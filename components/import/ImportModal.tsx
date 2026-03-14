'use client';

import { useCallback, useRef, useState } from 'react';
import { parseCSVWithLatLon } from '@/lib/import-export/csv-import';
import { parseGeoJSON } from '@/lib/import-export/geojson-import';
import { supabase } from '@/lib/supabase/client';
import { useLayerStore } from '@/lib/stores/layer-store';
import type { CSVImportResult } from '@/lib/import-export/csv-import';

/** Accepted file extensions for import */
const ACCEPTED_EXTENSIONS = '.csv,.geojson,.json,.kml';

/** Possible import status values */
type ImportStatus = 'idle' | 'parsing' | 'previewing' | 'importing' | 'done' | 'error';

/** Props for ImportModal */
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (features: GeoJSON.Feature[], layerName: string) => void;
}

/**
 * Modal component for importing geospatial data files.
 * Supports CSV (with lat/lon), GeoJSON, and JSON formats.
 * KML support is planned for a future release.
 */
export default function ImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportModalProps) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [layerName, setLayerName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [needsGeocoding, setNeedsGeocoding] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const setLayerVisibility = useLayerStore((s) => s.setLayerVisibility);

  /** Reset all state to initial values */
  const resetState = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setFeatures([]);
    setParseErrors([]);
    setLayerName('');
    setFileName('');
    setFileType('');
    setRowCount(0);
    setIsDragging(false);
    setNeedsGeocoding(false);
  }, []);

  /** Detect if CSV has lat/lon columns by checking headers */
  const hasLatLonColumns = (headers: string[]): boolean => {
    const lower = headers.map((h) => h.toLowerCase());
    const hasLat = lower.some((h) =>
      ['latitude', 'lat'].includes(h)
    );
    const hasLon = lower.some((h) =>
      ['longitude', 'lon', 'lng'].includes(h)
    );
    return hasLat && hasLon;
  };

  /** Process a selected or dropped file */
  const processFile = useCallback(
    async (file: File) => {
      setStatus('parsing');
      setErrorMessage(null);
      setParseErrors([]);
      setFileName(file.name);

      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      setFileType(ext);

      // Default layer name from file name
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setLayerName(baseName);

      if (ext === 'kml') {
        setStatus('error');
        setErrorMessage('KML import is coming soon. Please convert your file to GeoJSON or CSV.');
        return;
      }

      if (ext === 'csv') {
        // Quick header check: read first line
        const headerText = await file.slice(0, 4096).text();
        const firstLine = headerText.split('\n')[0] ?? '';
        const headers = firstLine.split(',').map((h) => h.trim().replace(/"/g, ''));

        if (hasLatLonColumns(headers)) {
          const result: CSVImportResult = await parseCSVWithLatLon(file);
          setFeatures(result.features);
          setParseErrors(result.errors);
          setRowCount(result.rowCount);
          setStatus('previewing');
        } else {
          // No lat/lon - needs geocoding
          setNeedsGeocoding(true);
          setRowCount(
            headerText.split('\n').filter((l) => l.trim().length > 0).length - 1
          );
          setStatus('previewing');
        }
        return;
      }

      if (ext === 'geojson' || ext === 'json') {
        const result = await parseGeoJSON(file);
        if (result.error || !result.data) {
          setStatus('error');
          setErrorMessage(result.error ?? 'Unknown error parsing GeoJSON');
          return;
        }
        setFeatures(result.data.features);
        setRowCount(result.data.features.length);
        setStatus('previewing');
        return;
      }

      setStatus('error');
      setErrorMessage(`Unsupported file type: .${ext}`);
    },
    []
  );

  /** Handle file input change */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  /** Handle drag events */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  /** Finalize import: register layer and record in Supabase */
  const handleImport = useCallback(async () => {
    if (features.length === 0 && !needsGeocoding) return;

    setStatus('importing');

    try {
      // Record the import in Supabase imported_datasets table
      const geomType =
        features.length > 0
          ? features[0]?.geometry?.type ?? 'Unknown'
          : 'Pending Geocoding';

      const { error } = await supabase.from('imported_datasets').insert({
        name: layerName || fileName,
        file_type: fileType,
        row_count: rowCount,
        geom_type: geomType,
      });

      if (error) {
        console.warn('Failed to record import in database:', error.message);
      }

      // Register the imported layer as visible
      const layerId = `imported-${layerName.toLowerCase().replace(/\s+/g, '-')}`;
      setLayerVisibility(layerId, true);

      setStatus('done');
      onImportComplete?.(features, layerName || fileName);
    } catch (err) {
      setStatus('error');
      setErrorMessage((err as Error).message);
    }
  }, [
    features,
    needsGeocoding,
    layerName,
    fileName,
    fileType,
    rowCount,
    setLayerVisibility,
    onImportComplete,
  ]);

  /** Handle modal close with cleanup */
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  if (!isOpen) return null;

  /** Build preview rows from first 5 features */
  const previewRows = features.slice(0, 5);
  const previewColumns =
    previewRows.length > 0
      ? Object.keys(previewRows[0]?.properties ?? {}).slice(0, 6)
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Import Data</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drop zone (idle state) */}
        {status === 'idle' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop a file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Supported: CSV, GeoJSON, JSON, KML (coming soon)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Parsing indicator */}
        {status === 'parsing' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">Parsing {fileName}...</p>
          </div>
        )}

        {/* Preview state */}
        {status === 'previewing' && (
          <div className="space-y-4">
            <div className="rounded bg-gray-50 p-3 text-sm text-gray-700">
              <p>
                <span className="font-medium">File:</span> {fileName}
              </p>
              <p>
                <span className="font-medium">Type:</span> {fileType.toUpperCase()}
              </p>
              <p>
                <span className="font-medium">Records:</span> {rowCount}
              </p>
              {features.length > 0 && features.length < rowCount && (
                <p>
                  <span className="font-medium">Parsed features:</span>{' '}
                  {features.length} of {rowCount}
                </p>
              )}
            </div>

            {/* Layer name input */}
            <div>
              <label
                htmlFor="layer-name"
                className="block text-sm font-medium text-gray-700"
              >
                Layer Name
              </label>
              <input
                id="layer-name"
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter a name for this layer"
              />
            </div>

            {/* Geocoding notice */}
            {needsGeocoding && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                No latitude/longitude columns detected. Addresses will need to be
                geocoded after import.
              </div>
            )}

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">
                  {parseErrors.length} row(s) had issues:
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {parseErrors.slice(0, 3).map((err, i) => (
                    <li key={i} className="truncate">
                      {err}
                    </li>
                  ))}
                  {parseErrors.length > 3 && (
                    <li>...and {parseErrors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview table */}
            {previewRows.length > 0 && previewColumns.length > 0 && (
              <div className="overflow-x-auto">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Preview (first {previewRows.length} rows)
                </p>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      {previewColumns.map((col) => (
                        <th
                          key={col}
                          className="px-2 py-1 text-left font-medium text-gray-600"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((feature, rowIdx) => (
                      <tr key={rowIdx} className="border-b">
                        {previewColumns.map((col) => (
                          <td
                            key={col}
                            className="max-w-[150px] truncate px-2 py-1 text-gray-700"
                          >
                            {String(
                              (feature.properties as Record<string, unknown>)?.[col] ?? ''
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={features.length === 0 && !needsGeocoding}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        )}

        {/* Importing indicator */}
        {status === 'importing' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">
              Importing {features.length} features...
            </p>
          </div>
        )}

        {/* Done state */}
        {status === 'done' && (
          <div className="space-y-4 py-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-gray-700">
              Successfully imported {features.length} features as layer{' '}
              <span className="font-medium">&quot;{layerName}&quot;</span>.
            </p>
            <button
              onClick={handleClose}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="space-y-4 py-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-red-700">{errorMessage}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={resetState}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Note {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  project_id: string | null;
  tag?: string;
}

type TagFilter = 'All' | 'Update' | 'Issue';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const diffMon = Math.floor(diffDay / 30);
  return `${diffMon} month${diffMon === 1 ? '' : 's'} ago`;
}

export default function MapNotesPanel() {
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState<TagFilter>('All');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setNotes((data as Note[]) ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('notes').insert({
        created_by: user?.id ?? 'anonymous',
        content: trimmed,
        project_id: null,
      });

      setContent('');
      fetchNotes();
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('notes').delete().eq('id', id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const filteredNotes =
    activeTag === 'All'
      ? notes
      : notes.filter((n) => (n.tag ?? '').toLowerCase() === activeTag.toLowerCase());

  const TAGS: TagFilter[] = ['All', 'Update', 'Issue'];

  return (
    <div
      style={{
        borderTop: '1px solid #e5e7eb',
        padding: '10px 12px',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 8,
        }}
      >
        Notes
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Take a note..."
          rows={2}
          style={{
            flex: 1,
            fontSize: 12,
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            resize: 'none',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: '#2563eb',
            borderRadius: 6,
            cursor: 'pointer',
            flexShrink: 0,
            alignSelf: 'flex-end',
          }}
          title="Add note"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Tag filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            style={{
              fontSize: 11,
              fontWeight: activeTag === tag ? 600 : 400,
              color: activeTag === tag ? '#2563eb' : '#6b7280',
              background: activeTag === tag ? '#eff6ff' : 'transparent',
              border: 'none',
              borderRadius: 4,
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Notes list */}
      <div
        style={{
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        {loading && filteredNotes.length === 0 ? (
          <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', padding: 8 }}>
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', padding: 8 }}>
            No notes yet
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              style={{
                padding: '6px 0',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: '#111827',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {note.content}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                  {relativeTime(note.created_at)}
                </div>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  borderRadius: 4,
                  padding: 0,
                }}
                title="Delete note"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

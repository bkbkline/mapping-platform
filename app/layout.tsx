import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'mapbox-gl/dist/mapbox-gl.css';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

/** Application metadata for SEO and browser tab display. */
export const metadata: Metadata = {
  title: 'Majestic Maps - Industrial Land Intelligence',
  description:
    'Industrial land mapping platform for site selection, parcel analysis, and market intelligence.',
};

/**
 * Root layout for the Majestic Maps application.
 * Applies the Inter font, global styles, and wraps children in the Providers component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

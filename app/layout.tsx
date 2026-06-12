import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import EnsureDefaultProject from '../components/EnsureDefaultProject';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Suno Core - Personal AI Music Generator',
  description: 'Generate, edit, and perfect your music with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EnsureDefaultProject />
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Link href="/create" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Create
            </Link>
            <Link href="/library" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Library
            </Link>
            <Link href="/chat" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Chat
            </Link>
            <Link href="/usage" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Usage
            </Link>
          </div>
        </nav>
        <main className="pt-4">{children}</main>
      </body>
    </html>
  );
}

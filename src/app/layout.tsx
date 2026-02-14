import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'QuizForge — Gamified Learning Platform',
  description: 'Master any subject through adaptive quizzes, gamification, and intelligent learning paths.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

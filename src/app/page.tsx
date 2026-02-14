'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (profile?.role === 'teacher') {
      router.replace('/teacher');
    } else {
      router.replace('/dashboard');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="loading-page">
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)' }}>Loading QuizForge...</p>
    </div>
  );
}

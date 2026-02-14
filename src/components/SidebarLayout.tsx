'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';

interface SidebarLayoutProps { children: ReactNode; }

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const { user, profile, loading, signOutUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    if (loading || !profile) {
        return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>;
    }

    const isTeacher = profile.role === 'teacher';

    const studentLinks = [
        { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
        { href: '/quiz', icon: '📝', label: 'Browse Quizzes' },
        { href: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
        { href: '/achievements', icon: '🎖️', label: 'Achievements' },
    ];

    const teacherLinks = [
        { href: '/teacher', icon: '📊', label: 'Dashboard' },
        { href: '/teacher/questions', icon: '❓', label: 'Question Bank' },
        { href: '/teacher/quiz/create', icon: '✏️', label: 'Create Quiz' },
        { href: '/teacher/analytics', icon: '📈', label: 'Analytics' },
    ];

    const links = isTeacher ? teacherLinks : studentLinks;

    return (
        <div className="layout">
            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚡</div>
                    <span className="sidebar-logo-text">QuizForge</span>
                </div>

                <nav className="sidebar-nav">
                    <span className="sidebar-section-title">{isTeacher ? 'Teaching' : 'Learning'}</span>
                    {links.map(link => (
                        <button
                            key={link.href}
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                            onClick={() => { router.push(link.href); setMobileOpen(false); }}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16, marginTop: 16 }}>
                    <div style={{ padding: '8px 12px', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{profile.name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {isTeacher ? '📚 Teacher' : `⭐ Level ${profile.level}`}
                        </div>
                    </div>
                    <button className="sidebar-link" onClick={signOutUser}>
                        <span className="sidebar-link-icon">🚪</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile hamburger */}
            <button
                className="btn btn-icon btn-ghost"
                style={{ position: 'fixed', top: 16, left: 16, zIndex: 200, display: 'none' }}
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                ☰
            </button>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { BADGES } from '@/lib/gamification';
import { getXPForNextLevel } from '@/lib/gamification';

export default function AchievementsPage() {
    const { profile } = useAuth();
    if (!profile) return null;

    const xpInfo = getXPForNextLevel(profile.xp);
    const earnedBadges = BADGES.filter(b => profile.badges.includes(b.id));
    const lockedBadges = BADGES.filter(b => !profile.badges.includes(b.id));
    const categories = ['milestone', 'mastery', 'streak', 'special'] as const;

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Achievements 🎖️</h1>
                    <p className="page-subtitle">Track your milestones and badges</p>
                </div>
            </div>

            {/* XP & Level Card */}
            <div className="glass-card" style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'white', flexShrink: 0 }}>
                        {profile.level}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)', marginBottom: 4 }}>Level {profile.level}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>
                            {profile.xp.toLocaleString()} XP total · {xpInfo.current} / {xpInfo.needed} to next level
                        </div>
                        <div className="progress-bar" style={{ height: 12 }}>
                            <div className="progress-fill" style={{ width: `${xpInfo.progress}%` }} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>{earnedBadges.length}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>of {BADGES.length} badges</div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                <div className="stat-card">
                    <div className="stat-icon green">📝</div>
                    <div className="stat-info">
                        <div className="stat-label">Quizzes</div>
                        <div className="stat-value">{profile.quizzesCompleted}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">🔥</div>
                    <div className="stat-info">
                        <div className="stat-label">Current Streak</div>
                        <div className="stat-value">{profile.streak} days</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">🏅</div>
                    <div className="stat-info">
                        <div className="stat-label">Best Streak</div>
                        <div className="stat-value">{profile.longestStreak} days</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">🎯</div>
                    <div className="stat-info">
                        <div className="stat-label">Avg Accuracy</div>
                        <div className="stat-value">{profile.averageAccuracy}%</div>
                    </div>
                </div>
            </div>

            {/* Badges by Category */}
            {categories.map(cat => {
                const catBadges = BADGES.filter(b => b.category === cat);
                if (catBadges.length === 0) return null;
                return (
                    <div key={cat} style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, textTransform: 'capitalize', marginBottom: 16 }}>
                            {cat === 'milestone' ? '🏁 Milestones' : cat === 'mastery' ? '🧠 Mastery' : cat === 'streak' ? '🔥 Streaks' : '✨ Special'}
                        </h2>
                        <div className="badges-grid">
                            {catBadges.map(b => (
                                <div key={b.id} className={`badge-card ${profile.badges.includes(b.id) ? 'earned' : 'locked'}`}>
                                    <div className="badge-card-icon">{b.icon}</div>
                                    <div className="badge-card-name">{b.name}</div>
                                    <div className="badge-card-desc">{b.description}</div>
                                    {!profile.badges.includes(b.id) && (
                                        <div style={{ marginTop: 8, fontSize: 'var(--font-size-xs)', color: 'var(--accent-purple-light)' }}>{b.requirement}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </SidebarLayout>
    );
}

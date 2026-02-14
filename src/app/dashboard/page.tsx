'use client';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { getUserResults, getQuizzes } from '@/lib/db';
import { Result, Quiz } from '@/lib/types';
import { getXPForNextLevel, BADGES } from '@/lib/gamification';
import Link from 'next/link';

export default function StudentDashboard() {
    const { profile } = useAuth();
    const [results, setResults] = useState<Result[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        Promise.all([
            getUserResults(profile.uid),
            getQuizzes({ isActive: true }),
        ]).then(([r, q]) => {
            setResults(r);
            setQuizzes(q);
        }).finally(() => setLoading(false));
    }, [profile]);

    if (!profile) return null;

    const xpInfo = getXPForNextLevel(profile.xp);
    const recentResults = results.slice(0, 5);
    const completedIds = results.map(r => r.quizId);
    const availableQuizzes = quizzes.filter(q => !completedIds.includes(q.id)).slice(0, 4);

    return (
        <SidebarLayout>
            {/* Welcome */}
            <div style={{ marginBottom: 32 }}>
                <h1 className="page-title">Welcome back, {profile.name.split(' ')[0]}! 👋</h1>
                <p className="page-subtitle">Continue your learning journey</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">⚡</div>
                    <div className="stat-info">
                        <div className="stat-label">XP / Level</div>
                        <div className="stat-value">{profile.xp}</div>
                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Level {profile.level}</span>
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{Math.round(xpInfo.progress)}%</span>
                            </div>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${xpInfo.progress}%` }} /></div>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">📝</div>
                    <div className="stat-info">
                        <div className="stat-label">Quizzes Done</div>
                        <div className="stat-value">{profile.quizzesCompleted}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">🎯</div>
                    <div className="stat-info">
                        <div className="stat-label">Avg Accuracy</div>
                        <div className="stat-value">{profile.averageAccuracy}%</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">🔥</div>
                    <div className="stat-info">
                        <div className="stat-label">Streak</div>
                        <div className="stat-value">{profile.streak} days</div>
                    </div>
                </div>
            </div>

            {/* Available Quizzes */}
            <div style={{ marginBottom: 32 }}>
                <div className="page-header">
                    <div>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Recommended Quizzes</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Pick one and start learning!</p>
                    </div>
                    <Link href="/quiz" className="btn btn-secondary">View All →</Link>
                </div>

                {loading ? (
                    <div className="quiz-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="quiz-card">
                                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
                                <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
                                <div className="skeleton" style={{ height: 40, width: '100%' }} />
                            </div>
                        ))}
                    </div>
                ) : availableQuizzes.length > 0 ? (
                    <div className="quiz-grid">
                        {availableQuizzes.map(q => (
                            <Link key={q.id} href={`/quiz/${q.id}`} style={{ textDecoration: 'none' }}>
                                <div className="quiz-card">
                                    <div className="quiz-card-header">
                                        <div className="quiz-card-title">{q.title}</div>
                                        <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`}>
                                            {q.difficulty}
                                        </span>
                                    </div>
                                    <div className="quiz-card-meta">
                                        <span className="badge badge-blue">{q.subject}</span>
                                        <span className="badge">{q.questions.length} Qs</span>
                                    </div>
                                    <div className="quiz-card-desc">{q.description}</div>
                                    <div className="quiz-card-footer">
                                        <span className="quiz-card-stat">⏱ {q.estimatedTime} min</span>
                                        <span className="quiz-card-stat">📊 {q.timesAttempted} attempts</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <div className="empty-state-title">All caught up!</div>
                        <div className="empty-state-desc">You&apos;ve completed all available quizzes. Check back later for new ones!</div>
                    </div>
                )}
            </div>

            {/* Recent Results */}
            <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 16 }}>Recent Results</h2>
                {recentResults.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Quiz</th>
                                    <th>Score</th>
                                    <th>Accuracy</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentResults.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.quizTitle}</td>
                                        <td>{r.score}/{r.maxScore}</td>
                                        <td>
                                            <span className={`badge ${r.accuracy >= 80 ? 'badge-green' : r.accuracy >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                                                {r.accuracy}%
                                            </span>
                                        </td>
                                        <td>{Math.round(r.timeSpent / 60)} min</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <div className="empty-state-title">No results yet</div>
                        <div className="empty-state-desc">Take your first quiz to see your results here!</div>
                    </div>
                )}
            </div>

            {/* Badges Preview */}
            <div style={{ marginTop: 32 }}>
                <div className="page-header">
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Your Badges</h2>
                    <Link href="/achievements" className="btn btn-ghost btn-sm">View All →</Link>
                </div>
                <div className="badges-grid">
                    {BADGES.slice(0, 6).map(b => (
                        <div key={b.id} className={`badge-card ${profile.badges.includes(b.id) ? 'earned' : 'locked'}`}>
                            <div className="badge-card-icon">{b.icon}</div>
                            <div className="badge-card-name">{b.name}</div>
                            <div className="badge-card-desc">{b.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        </SidebarLayout>
    );
}

'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { getLeaderboard } from '@/lib/db';
import { LeaderboardEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth';

export default function LeaderboardPage() {
    const { profile } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');

    useEffect(() => {
        getLeaderboard(50).then(setEntries).finally(() => setLoading(false));
    }, []);

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);
    const medals = ['🥇', '🥈', '🥉'];
    const podiumClasses = ['gold', 'silver', 'bronze'];
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leaderboard 🏆</h1>
                    <p className="page-subtitle">See how you stack up against fellow learners</p>
                </div>
                <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
                    {(['all', 'weekly', 'monthly'] as const).map(t => (
                        <button key={t} className={`tab ${timeframe === t ? 'active' : ''}`} onClick={() => setTimeframe(t)}>
                            {t === 'all' ? 'All Time' : t === 'weekly' ? 'This Week' : 'This Month'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <div className="empty-state-title">No rankings yet</div>
                    <div className="empty-state-desc">Complete quizzes to earn XP and climb the leaderboard!</div>
                </div>
            ) : (
                <>
                    {/* Podium */}
                    <div className="leaderboard-podium">
                        {podiumOrder.map((entry, i) => {
                            const originalIdx = top3.indexOf(entry);
                            return (
                                <div key={entry.userId} className={`podium-item ${podiumClasses[originalIdx]}`}
                                    style={{ transform: originalIdx === 0 ? 'scale(1.1)' : 'none' }}>
                                    <div className="podium-rank">{medals[originalIdx]}</div>
                                    <div className="podium-name">{entry.name}</div>
                                    <div className="podium-score">{entry.xp.toLocaleString()} XP</div>
                                    <div className="podium-xp">Level {entry.level} · {entry.averageAccuracy}% avg</div>
                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                                        {entry.badges.slice(0, 3).map(b => {
                                            const badge = require('@/lib/gamification').BADGES.find((bg: any) => bg.id === b);
                                            return badge ? <span key={b} title={badge.name} style={{ fontSize: '1.2rem' }}>{badge.icon}</span> : null;
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Full list */}
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Level</th>
                                    <th>XP</th>
                                    <th>Quizzes</th>
                                    <th>Avg Accuracy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((e) => (
                                    <tr key={e.userId} style={e.userId === profile?.uid ? { background: 'rgba(139, 92, 246, 0.08)' } : {}}>
                                        <td style={{ fontWeight: 700 }}>
                                            {e.rank <= 3 ? medals[e.rank - 1] : `#${e.rank}`}
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {e.name} {e.userId === profile?.uid && <span className="badge badge-purple" style={{ marginLeft: 8 }}>You</span>}
                                        </td>
                                        <td><span className="badge badge-purple">Lv. {e.level}</span></td>
                                        <td style={{ fontWeight: 600 }}>{e.xp.toLocaleString()}</td>
                                        <td>{e.quizzesCompleted}</td>
                                        <td>
                                            <span className={`badge ${e.averageAccuracy >= 80 ? 'badge-green' : e.averageAccuracy >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                                                {e.averageAccuracy}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </SidebarLayout>
    );
}

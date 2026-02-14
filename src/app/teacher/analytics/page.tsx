'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { getQuizzes, getQuizResults } from '@/lib/db';
import { Quiz, Result } from '@/lib/types';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TeacherAnalyticsPage() {
    const { profile } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [allResults, setAllResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState<string>('all');

    useEffect(() => {
        if (!profile) return;
        (async () => {
            const qs = await getQuizzes({ createdBy: profile.uid });
            setQuizzes(qs);
            // Gather results for all teacher's quizzes
            const results: Result[] = [];
            for (const q of qs) {
                const qr = await getQuizResults(q.id);
                results.push(...qr);
            }
            setAllResults(results);
            setLoading(false);
        })();
    }, [profile]);

    const filteredResults = selectedQuiz === 'all' ? allResults : allResults.filter(r => r.quizId === selectedQuiz);

    // Analytics
    const totalAttempts = filteredResults.length;
    const avgAccuracy = totalAttempts > 0 ? Math.round(filteredResults.reduce((s, r) => s + r.accuracy, 0) / totalAttempts) : 0;
    const avgTime = totalAttempts > 0 ? Math.round(filteredResults.reduce((s, r) => s + r.timeSpent, 0) / totalAttempts / 60) : 0;
    const uniqueStudents = new Set(filteredResults.map(r => r.userId)).size;

    // Score distribution
    const distribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    filteredResults.forEach(r => {
        if (r.accuracy <= 20) distribution['0-20']++;
        else if (r.accuracy <= 40) distribution['21-40']++;
        else if (r.accuracy <= 60) distribution['41-60']++;
        else if (r.accuracy <= 80) distribution['61-80']++;
        else distribution['81-100']++;
    });
    const maxDist = Math.max(...Object.values(distribution), 1);

    // Topic analysis
    const topicMap = new Map<string, { correct: number; total: number }>();
    filteredResults.forEach(r => {
        r.topicPerformance?.forEach(tp => {
            const curr = topicMap.get(tp.topic) || { correct: 0, total: 0 };
            curr.correct += tp.correct;
            curr.total += tp.total;
            topicMap.set(tp.topic, curr);
        });
    });
    const topicStats = Array.from(topicMap.entries())
        .map(([topic, data]) => ({ topic, accuracy: Math.round((data.correct / data.total) * 100), total: data.total }))
        .sort((a, b) => a.accuracy - b.accuracy);

    // Weak topics (class-wide)
    const weakTopics = topicStats.filter(t => t.accuracy < 50);

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics 📊</h1>
                    <p className="page-subtitle">Deep insights into student performance</p>
                </div>
                <select className="select" style={{ maxWidth: 220 }} value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}>
                    <option value="all">All Quizzes</option>
                    {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue">👥</div>
                            <div className="stat-info">
                                <div className="stat-label">Unique Students</div>
                                <div className="stat-value">{uniqueStudents}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple">📝</div>
                            <div className="stat-info">
                                <div className="stat-label">Total Attempts</div>
                                <div className="stat-value">{totalAttempts}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">🎯</div>
                            <div className="stat-info">
                                <div className="stat-label">Avg Accuracy</div>
                                <div className="stat-value">{avgAccuracy}%</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon cyan">⏱</div>
                            <div className="stat-info">
                                <div className="stat-label">Avg Time</div>
                                <div className="stat-value">{avgTime} min</div>
                            </div>
                        </div>
                    </div>

                    {/* Score Distribution */}
                    <div className="glass-card" style={{ marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Score Distribution</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
                            {Object.entries(distribution).map(([range, count]) => (
                                <div key={range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{count}</span>
                                    <div style={{
                                        width: '100%', maxWidth: 60, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                        height: `${Math.max((count / maxDist) * 120, 4)}px`,
                                        background: range === '81-100' ? 'var(--gradient-success)' : range === '61-80' ? 'var(--accent-blue)' : range === '41-60' ? 'var(--accent-yellow)' : range === '21-40' ? 'var(--accent-orange)' : 'var(--accent-red)',
                                        transition: 'height 0.5s ease',
                                    }} />
                                    <span style={{ marginTop: 8, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{range}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Topic Performance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                        <div className="glass-card">
                            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Topic Performance</h3>
                            {topicStats.length > 0 ? topicStats.map(tp => (
                                <div key={tp.topic} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{tp.topic}</span>
                                        <span className={`badge ${tp.accuracy >= 80 ? 'badge-green' : tp.accuracy >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                                            {tp.accuracy}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{
                                            width: `${tp.accuracy}%`,
                                            background: tp.accuracy >= 80 ? 'var(--gradient-success)' : tp.accuracy >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)',
                                        }} />
                                    </div>
                                </div>
                            )) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>No topic data yet</div>
                            )}
                        </div>

                        <div className="glass-card">
                            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>⚠️ Attention Areas</h3>
                            {weakTopics.length > 0 ? (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 16 }}>
                                        These topics need more focus across your students:
                                    </p>
                                    {weakTopics.map(tp => (
                                        <div key={tp.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <span style={{ fontWeight: 500 }}>{tp.topic}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className="badge badge-red">{tp.accuracy}% avg</span>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{tp.total} responses</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                                    <div>All topics above 50% — great job!</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Results Table */}
                    <div className="glass-card">
                        <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Recent Attempts</h3>
                        {filteredResults.length > 0 ? (
                            <div className="table-container" style={{ background: 'transparent', border: 'none' }}>
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
                                        {filteredResults.slice(0, 20).map(r => (
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
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No attempts yet</div>
                        )}
                    </div>
                </>
            )}
        </SidebarLayout>
    );
}

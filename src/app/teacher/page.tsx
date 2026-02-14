'use client';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { getQuizzes, getQuizResults } from '@/lib/db';
import { Quiz, Result } from '@/lib/types';
import Link from 'next/link';

export default function TeacherDashboard() {
    const { profile } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        getQuizzes({ createdBy: profile.uid }).then(q => {
            setQuizzes(q);
        }).finally(() => setLoading(false));
    }, [profile]);

    if (!profile) return null;

    const activeQuizzes = quizzes.filter(q => q.isActive);
    const totalAttempts = quizzes.reduce((sum, q) => sum + q.timesAttempted, 0);
    const avgScore = quizzes.length > 0 ? Math.round(quizzes.reduce((sum, q) => sum + q.averageScore, 0) / quizzes.length) : 0;

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Teacher Dashboard</h1>
                    <p className="page-subtitle">Manage your quizzes and track student progress</p>
                </div>
                <Link href="/teacher/quiz/create" className="btn btn-primary">
                    ✏️ Create Quiz
                </Link>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">📝</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Quizzes</div>
                        <div className="stat-value">{quizzes.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-info">
                        <div className="stat-label">Active</div>
                        <div className="stat-value">{activeQuizzes.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">👥</div>
                    <div className="stat-info">
                        <div className="stat-label">Total Attempts</div>
                        <div className="stat-value">{totalAttempts}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow">📊</div>
                    <div className="stat-info">
                        <div className="stat-label">Avg Score</div>
                        <div className="stat-value">{avgScore}%</div>
                    </div>
                </div>
            </div>

            {/* Quiz List */}
            <div>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 16 }}>Your Quizzes</h2>
                {loading ? (
                    <div className="quiz-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="quiz-card">
                                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
                                <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 16 }} />
                                <div className="skeleton" style={{ height: 40, width: '100%' }} />
                            </div>
                        ))}
                    </div>
                ) : quizzes.length > 0 ? (
                    <div className="quiz-grid">
                        {quizzes.map(q => (
                            <Link key={q.id} href={`/teacher/quiz/${q.id}`} style={{ textDecoration: 'none' }}>
                                <div className="quiz-card">
                                    <div className="quiz-card-header">
                                        <div className="quiz-card-title">{q.title}</div>
                                        <span className={`badge ${q.isActive ? 'badge-green' : 'badge-red'}`}>
                                            {q.isActive ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                    <div className="quiz-card-meta">
                                        <span className="badge badge-blue">{q.subject}</span>
                                        <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`}>
                                            {q.difficulty}
                                        </span>
                                        <span className="badge">{q.questions.length} Qs</span>
                                    </div>
                                    <div className="quiz-card-desc">{q.description || 'No description'}</div>
                                    <div className="quiz-card-footer">
                                        <span className="quiz-card-stat">👥 {q.timesAttempted} attempts</span>
                                        <span className="quiz-card-stat">📊 Avg: {q.averageScore}%</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <div className="empty-state-title">No quizzes yet</div>
                        <div className="empty-state-desc">Create your first quiz to get started!</div>
                        <Link href="/teacher/quiz/create" className="btn btn-primary" style={{ marginTop: 16 }}>
                            ✏️ Create Your First Quiz
                        </Link>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}

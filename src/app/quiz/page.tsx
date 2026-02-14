'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { getQuizzes } from '@/lib/db';
import { Quiz, Difficulty } from '@/lib/types';
import Link from 'next/link';

export default function BrowseQuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [diffFilter, setDiffFilter] = useState<string>('all');
    const [subjectFilter, setSubjectFilter] = useState<string>('all');

    useEffect(() => {
        getQuizzes({ isActive: true }).then(setQuizzes).finally(() => setLoading(false));
    }, []);

    const subjects = [...new Set(quizzes.map(q => q.subject))];

    const filtered = quizzes.filter(q => {
        if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.subject.toLowerCase().includes(search.toLowerCase())) return false;
        if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
        if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
        return true;
    });

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Browse Quizzes</h1>
                    <p className="page-subtitle">Find the perfect quiz to challenge yourself</p>
                </div>
            </div>

            <div className="filter-bar">
                <input className="input" placeholder="🔍 Search quizzes..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="select" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <select className="select" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                    <option value="all">All Subjects</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="quiz-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="quiz-card">
                            <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
                            <div className="skeleton" style={{ height: 60, width: '100%', marginBottom: 16 }} />
                            <div className="skeleton" style={{ height: 14, width: '100%' }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="quiz-grid">
                    {filtered.map(q => (
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
                                    {q.gradeLevel && <span className="badge">{q.gradeLevel}</span>}
                                    <span className="badge">{q.questions.length} Questions</span>
                                </div>
                                <div className="quiz-card-desc">{q.description || 'Challenge yourself with this quiz!'}</div>
                                <div className="quiz-card-footer">
                                    <span className="quiz-card-stat">⏱ {q.estimatedTime} min</span>
                                    <span className="quiz-card-stat">👥 {q.timesAttempted} attempts</span>
                                    <span className="quiz-card-stat">📊 Avg: {q.averageScore}%</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No quizzes found</div>
                    <div className="empty-state-desc">
                        {search || diffFilter !== 'all' || subjectFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No quizzes available yet. Check back later!'}
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}

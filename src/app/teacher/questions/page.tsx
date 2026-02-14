'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { getQuestions, deleteQuestion } from '@/lib/db';
import { Question, Difficulty } from '@/lib/types';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function QuestionBankPage() {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [diffFilter, setDiffFilter] = useState('all');

    useEffect(() => {
        if (!profile) return;
        getQuestions(profile.uid).then(setQuestions).finally(() => setLoading(false));
    }, [profile]);

    const filtered = questions.filter(q => {
        if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.topic.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== 'all' && q.type !== typeFilter) return false;
        if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
        return true;
    });

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this question?')) return;
        try {
            await deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
            showToast('Question deleted', 'success');
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Question Bank</h1>
                    <p className="page-subtitle">{questions.length} questions in your bank</p>
                </div>
            </div>

            <div className="filter-bar">
                <input className="input" placeholder="🔍 Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="mcq">MCQ</option>
                    <option value="true-false">True/False</option>
                    <option value="multi-select">Multi-select</option>
                </select>
                <select className="select" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
            ) : filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map(q => (
                        <div key={q.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.text}</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className={`badge ${q.type === 'mcq' ? 'badge-blue' : q.type === 'true-false' ? 'badge-purple' : 'badge-yellow'}`}>{q.type}</span>
                                    <span className={`badge ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`}>{q.difficulty}</span>
                                    {q.topic && <span className="badge">{q.topic}</span>}
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                        {q.timesAnswered > 0 ? `${q.successRate}% success (${q.timesAnswered} answers)` : 'No attempts yet'}
                                    </span>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(q.id)} style={{ color: 'var(--accent-red)' }}>🗑</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">❓</div>
                    <div className="empty-state-title">No questions found</div>
                    <div className="empty-state-desc">
                        {search || typeFilter !== 'all' || diffFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create questions through the quiz builder!'}
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}

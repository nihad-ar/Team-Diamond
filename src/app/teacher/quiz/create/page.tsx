'use client';

import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { createQuiz } from '@/lib/db';
import { QuestionType, Difficulty, QuizQuestion } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface DraftQuestion {
    text: string;
    type: QuestionType;
    options: string[];
    correctAnswers: number[];
    explanation: string;
    difficulty: Difficulty;
    topic: string;
    points: number;
}

const emptyQuestion = (): DraftQuestion => ({
    text: '', type: 'mcq', options: ['', '', '', ''], correctAnswers: [],
    explanation: '', difficulty: 'medium', topic: '', points: 10,
});

export default function CreateQuizPage() {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [estimatedTime, setEstimatedTime] = useState(10);
    const [tags, setTags] = useState('');
    const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
    const [loading, setLoading] = useState(false);
    const [activeQ, setActiveQ] = useState(0);

    const updateQuestion = (index: number, updates: Partial<DraftQuestion>) => {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
    };

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            const options = [...q.options]; options[optIndex] = value;
            return { ...q, options };
        }));
    };

    const toggleCorrect = (qIndex: number, optIndex: number) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIndex) return q;
            const ca = q.type === 'mcq' || q.type === 'true-false'
                ? [optIndex]
                : q.correctAnswers.includes(optIndex)
                    ? q.correctAnswers.filter(a => a !== optIndex)
                    : [...q.correctAnswers, optIndex];
            return { ...q, correctAnswers: ca };
        }));
    };

    const addQuestion = () => {
        setQuestions(prev => [...prev, emptyQuestion()]);
        setActiveQ(questions.length);
    };

    const removeQuestion = (index: number) => {
        if (questions.length <= 1) { showToast('Quiz needs at least 1 question', 'warning'); return; }
        setQuestions(prev => prev.filter((_, i) => i !== index));
        if (activeQ >= questions.length - 1) setActiveQ(Math.max(0, activeQ - 1));
    };

    const handleSubmit = async (publish: boolean) => {
        if (!title || !subject) { showToast('Title and subject are required', 'warning'); return; }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text) { showToast(`Question ${i + 1} text is empty`, 'warning'); setActiveQ(i); return; }
            if (q.correctAnswers.length === 0) { showToast(`Question ${i + 1} needs a correct answer`, 'warning'); setActiveQ(i); return; }
            if (q.options.some(o => !o.trim())) { showToast(`Question ${i + 1} has empty options`, 'warning'); setActiveQ(i); return; }
        }

        setLoading(true);
        try {
            const quizQuestions: QuizQuestion[] = questions.map((q, i) => ({
                questionId: `q-${Date.now()}-${i}`,
                text: q.text, type: q.type, options: q.options,
                correctAnswers: q.correctAnswers, explanation: q.explanation,
                difficulty: q.difficulty, topic: q.topic || subject, points: q.points,
            }));

            await createQuiz({
                title, description, subject, gradeLevel, difficulty, estimatedTime,
                questions: quizQuestions,
                createdBy: profile!.uid,
                isActive: publish,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            });

            showToast(publish ? 'Quiz published! 🎉' : 'Quiz saved as draft', 'success');
            router.push('/teacher');
        } catch (err) {
            showToast('Failed to create quiz', 'error');
        } finally {
            setLoading(false);
        }
    };

    const q = questions[activeQ];

    return (
        <SidebarLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create Quiz</h1>
                    <p className="page-subtitle">Build an engaging quiz for your students</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => handleSubmit(false)} disabled={loading}>Save Draft</button>
                    <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={loading}>
                        {loading ? '...' : '🚀 Publish'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Quiz Details */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Quiz Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label>Title *</label>
                            <input className="input" placeholder="e.g. Algebra Basics" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Description</label>
                            <textarea className="textarea" placeholder="What does this quiz cover?" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label>Subject *</label>
                                <input className="input" placeholder="e.g. Mathematics" value={subject} onChange={e => setSubject(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Grade Level</label>
                                <input className="input" placeholder="e.g. Grade 10" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label>Difficulty</label>
                                <select className="select" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Time Limit (min)</label>
                                <input type="number" className="input" min={1} value={estimatedTime} onChange={e => setEstimatedTime(Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Tags (comma separated)</label>
                            <input className="input" placeholder="algebra, equations, basics" value={tags} onChange={e => setTags(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Question Editor */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontWeight: 700 }}>Questions ({questions.length})</h3>
                        <button className="btn btn-secondary btn-sm" onClick={addQuestion}>+ Add</button>
                    </div>

                    {/* Question Tabs */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                        {questions.map((_, i) => (
                            <button key={i} className={`nav-dot ${activeQ === i ? 'current' : questions[i].text ? 'answered' : ''}`} onClick={() => setActiveQ(i)}>
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    {q && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--accent-purple-light)', fontSize: 'var(--font-size-sm)' }}>
                                    Question {activeQ + 1}
                                </span>
                                <button className="btn btn-ghost btn-sm" onClick={() => removeQuestion(activeQ)} style={{ color: 'var(--accent-red)' }}>
                                    🗑 Remove
                                </button>
                            </div>

                            <div className="input-group">
                                <label>Question Text *</label>
                                <textarea className="textarea" placeholder="Enter your question..." value={q.text} onChange={e => updateQuestion(activeQ, { text: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label>Type</label>
                                    <select className="select" value={q.type} onChange={e => {
                                        const type = e.target.value as QuestionType;
                                        const opts = type === 'true-false' ? ['True', 'False'] : q.options.length < 4 ? [...q.options, '', '', '', ''].slice(0, 4) : q.options;
                                        updateQuestion(activeQ, { type, options: opts, correctAnswers: [] });
                                    }}>
                                        <option value="mcq">Multiple Choice</option>
                                        <option value="true-false">True / False</option>
                                        <option value="multi-select">Multi Select</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Difficulty</label>
                                    <select className="select" value={q.difficulty} onChange={e => updateQuestion(activeQ, { difficulty: e.target.value as Difficulty })}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Points</label>
                                    <input type="number" className="input" min={1} value={q.points} onChange={e => updateQuestion(activeQ, { points: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Topic</label>
                                <input className="input" placeholder="e.g. Linear Equations" value={q.topic} onChange={e => updateQuestion(activeQ, { topic: e.target.value })} />
                            </div>

                            <div className="input-group">
                                <label>Options * (click ✓ to mark correct)</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                className={`btn btn-icon btn-sm ${q.correctAnswers.includes(oi) ? '' : 'btn-ghost'}`}
                                                style={q.correctAnswers.includes(oi) ? { background: 'var(--accent-green)', color: 'white' } : {}}
                                                onClick={() => toggleCorrect(activeQ, oi)}
                                                title="Mark as correct"
                                            >
                                                ✓
                                            </button>
                                            <input
                                                className="input"
                                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                                value={opt}
                                                onChange={e => updateOption(activeQ, oi, e.target.value)}
                                                disabled={q.type === 'true-false'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Explanation (shown after answering)</label>
                                <textarea className="textarea" placeholder="Explain why this is the correct answer..." value={q.explanation} onChange={e => updateQuestion(activeQ, { explanation: e.target.value })} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}

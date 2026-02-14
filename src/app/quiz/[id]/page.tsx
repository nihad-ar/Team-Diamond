'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { getQuiz, createAttempt, updateAttempt, saveResult, updateUserStats, updateQuiz, updateUser } from '@/lib/db';
import { Quiz, QuizQuestion, QuestionResponse, TopicPerformance } from '@/lib/types';
import { checkNewBadges, calculateXP, getLevel } from '@/lib/gamification';
import { analyzeTopicStrengths } from '@/lib/adaptive';

export default function TakeQuizPage() {
    const params = useParams();
    const quizId = params.id as string;
    const router = useRouter();
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);
    const [responses, setResponses] = useState<Map<number, number[]>>(new Map());
    const [flagged, setFlagged] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [result, setResult] = useState<{ score: number; maxScore: number; accuracy: number; timeSpent: number; topicPerf: TopicPerformance[]; newBadges: string[] } | null>(null);
    const attemptIdRef = useRef<string>('');
    const startTimeRef = useRef<Date>(new Date());
    const questionStartRef = useRef<Date>(new Date());
    const timeSpentPerQ = useRef<Map<number, number>>(new Map());

    useEffect(() => {
        getQuiz(quizId).then(q => { setQuiz(q); if (q) setTimeLeft(q.estimatedTime * 60); }).finally(() => setLoading(false));
    }, [quizId]);

    // Timer
    useEffect(() => {
        if (!started || showResults) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { handleSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [started, showResults]);

    const startQuiz = async () => {
        if (!profile || !quiz) return;
        startTimeRef.current = new Date();
        questionStartRef.current = new Date();
        const id = await createAttempt({
            userId: profile.uid, quizId, quizTitle: quiz.title,
            startTime: new Date(), endTime: null, status: 'in-progress',
            responses: [], score: 0, maxScore: quiz.questions.reduce((s, q) => s + q.points, 0),
            accuracy: 0, completionRate: 0,
        });
        attemptIdRef.current = id;
        setStarted(true);
    };

    const selectAnswer = (qIdx: number, optIdx: number) => {
        const q = quiz!.questions[qIdx];
        setResponses(prev => {
            const next = new Map(prev);
            if (q.type === 'multi-select') {
                const current = next.get(qIdx) || [];
                next.set(qIdx, current.includes(optIdx) ? current.filter(i => i !== optIdx) : [...current, optIdx]);
            } else {
                next.set(qIdx, [optIdx]);
            }
            return next;
        });
    };

    const navigateQ = (idx: number) => {
        const now = new Date();
        const elapsed = (now.getTime() - questionStartRef.current.getTime()) / 1000;
        timeSpentPerQ.current.set(currentQ, (timeSpentPerQ.current.get(currentQ) || 0) + elapsed);
        questionStartRef.current = now;
        setCurrentQ(idx);
    };

    const toggleFlag = () => {
        setFlagged(prev => {
            const next = new Set(prev);
            next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ);
            return next;
        });
    };

    const handleSubmit = useCallback(async () => {
        if (!quiz || !profile || submitting) return;
        setSubmitting(true);

        const totalTime = (new Date().getTime() - startTimeRef.current.getTime()) / 1000;
        let score = 0;
        const maxScore = quiz.questions.reduce((s, q) => s + q.points, 0);
        const topicMap = new Map<string, { correct: number; total: number }>();

        const qResponses: QuestionResponse[] = quiz.questions.map((q, i) => {
            const selected = responses.get(i) || [];
            const isCorrect = q.correctAnswers.length === selected.length && q.correctAnswers.every(a => selected.includes(a));
            if (isCorrect) score += q.points;

            const topic = q.topic || quiz.subject;
            const curr = topicMap.get(topic) || { correct: 0, total: 0 };
            curr.total++;
            if (isCorrect) curr.correct++;
            topicMap.set(topic, curr);

            return {
                questionId: q.questionId, selectedAnswers: selected,
                isCorrect, timeSpent: timeSpentPerQ.current.get(i) || 0, flagged: flagged.has(i),
            };
        });

        const accuracy = Math.round((score / maxScore) * 100);
        const topicPerf: TopicPerformance[] = Array.from(topicMap.entries()).map(([topic, data]) => ({
            topic, correct: data.correct, total: data.total, accuracy: Math.round((data.correct / data.total) * 100),
        }));
        const { weak, strong } = analyzeTopicStrengths(topicPerf);

        try {
            await updateAttempt(attemptIdRef.current, {
                endTime: new Date(), status: 'completed', responses: qResponses,
                score, accuracy, completionRate: (responses.size / quiz.questions.length) * 100,
            });

            await saveResult({
                userId: profile.uid, quizId, quizTitle: quiz.title,
                attemptId: attemptIdRef.current, timestamp: new Date(),
                score, maxScore, accuracy, timeSpent: totalTime,
                topicPerformance: topicPerf, weakTopics: weak, strongTopics: strong,
            });

            await updateUserStats(profile.uid, score, accuracy);

            const xp = calculateXP(score, accuracy, quiz.difficulty);
            const newBadges = checkNewBadges(profile.badges, {
                quizzesCompleted: profile.quizzesCompleted + 1,
                streak: profile.streak,
                level: getLevel(profile.xp + xp),
                lastAccuracy: accuracy,
                lastTimeSpent: totalTime,
            });

            if (newBadges.length > 0) {
                await updateUser(profile.uid, { badges: [...profile.badges, ...newBadges] });
            }

            await updateQuiz(quizId, {
                timesAttempted: quiz.timesAttempted + 1,
                averageScore: Math.round(((quiz.averageScore * quiz.timesAttempted) + accuracy) / (quiz.timesAttempted + 1)),
            });

            setResult({ score, maxScore, accuracy, timeSpent: totalTime, topicPerf, newBadges });
            setShowResults(true);
        } catch {
            showToast('Failed to submit quiz', 'error');
        } finally {
            setSubmitting(false);
        }
    }, [quiz, profile, responses, flagged, submitting, quizId, showToast]);

    if (loading) {
        return <div className="loading-page"><div className="spinner" /><p style={{ color: 'var(--text-secondary)' }}>Loading quiz...</p></div>;
    }
    if (!quiz) {
        return <div className="loading-page"><p style={{ color: 'var(--text-secondary)' }}>Quiz not found</p></div>;
    }

    // ─── Pre-start screen ───
    if (!started) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ maxWidth: 520 }}>
                    <h1 className="auth-title">{quiz.title}</h1>
                    <p className="auth-subtitle">{quiz.description || 'Ready to test your knowledge?'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>📝</div>
                            <div style={{ fontWeight: 600, marginTop: 4 }}>{quiz.questions.length}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Questions</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>⏱</div>
                            <div style={{ fontWeight: 600, marginTop: 4 }}>{quiz.estimatedTime} min</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Time Limit</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>🎯</div>
                            <div style={{ fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>{quiz.difficulty}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Difficulty</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => router.back()}>← Back</button>
                        <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={startQuiz}>🚀 Start Quiz</button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Results screen ───
    if (showResults && result) {
        return (
            <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
                <div className="result-hero">
                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>
                        {result.accuracy >= 80 ? '🏆' : result.accuracy >= 50 ? '👍' : '💪'}
                    </div>
                    <div className="result-score">{result.accuracy}%</div>
                    <div className="result-label">
                        {result.accuracy >= 80 ? 'Excellent work!' : result.accuracy >= 50 ? 'Good job!' : 'Keep practicing!'}
                    </div>
                    <div className="result-stats">
                        <div className="result-stat-item">
                            <div className="result-stat-value">{result.score}/{result.maxScore}</div>
                            <div className="result-stat-label">Score</div>
                        </div>
                        <div className="result-stat-item">
                            <div className="result-stat-value">{Math.round(result.timeSpent / 60)} min</div>
                            <div className="result-stat-label">Time Spent</div>
                        </div>
                        <div className="result-stat-item">
                            <div className="result-stat-value">{responses.size}/{quiz.questions.length}</div>
                            <div className="result-stat-label">Answered</div>
                        </div>
                    </div>
                </div>

                {/* New Badges */}
                {result.newBadges.length > 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 12 }}>🎖️ New Badges Earned!</h3>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {result.newBadges.map(id => {
                                const badge = require('@/lib/gamification').BADGES.find((b: any) => b.id === id);
                                return badge ? (
                                    <div key={id} className="badge-card earned" style={{ minWidth: 120 }}>
                                        <div className="badge-card-icon">{badge.icon}</div>
                                        <div className="badge-card-name">{badge.name}</div>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {/* Topic Performance */}
                <div className="glass-card" style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16 }}>Topic Breakdown</h3>
                    {result.topicPerf.map(tp => (
                        <div key={tp.topic} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontWeight: 500 }}>{tp.topic}</span>
                                <span className={`badge ${tp.accuracy >= 80 ? 'badge-green' : tp.accuracy >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                                    {tp.correct}/{tp.total} ({tp.accuracy}%)
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${tp.accuracy}%`, background: tp.accuracy >= 80 ? 'var(--gradient-success)' : tp.accuracy >= 50 ? 'var(--accent-yellow)' : 'var(--accent-red)' }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Review Answers */}
                <div className="glass-card" style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16 }}>Review Answers</h3>
                    {quiz.questions.map((q, i) => {
                        const selected = responses.get(i) || [];
                        const isCorrect = q.correctAnswers.length === selected.length && q.correctAnswers.every(a => selected.includes(a));
                        return (
                            <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < quiz.questions.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontWeight: 700, color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                        {isCorrect ? '✓' : '✕'} Q{i + 1}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{q.text}</span>
                                </div>
                                <div className="options-list" style={{ gap: 6 }}>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} className={`option ${q.correctAnswers.includes(oi) ? 'correct' : selected.includes(oi) ? 'incorrect' : ''}`}
                                            style={{ padding: '10px 14px', cursor: 'default' }}>
                                            <span className="option-letter" style={{ width: 24, height: 24, fontSize: 'var(--font-size-xs)' }}>
                                                {String.fromCharCode(65 + oi)}
                                            </span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <div style={{ marginTop: 8, padding: 12, background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        💡 {q.explanation}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="btn btn-secondary btn-lg" onClick={() => router.push('/dashboard')}>← Dashboard</button>
                    <button className="btn btn-primary btn-lg" onClick={() => router.push('/quiz')}>Browse More Quizzes</button>
                </div>
            </div>
        );
    }

    // ─── Quiz-taking screen ───
    const q = quiz.questions[currentQ];
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timerClass = timeLeft < 60 ? 'danger' : timeLeft < 180 ? 'warning' : '';

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
            {/* Header */}
            <div className="quiz-header">
                <div>
                    <div style={{ fontWeight: 700 }}>{quiz.title}</div>
                    <div className="quiz-progress-text">
                        Question {currentQ + 1} of {quiz.questions.length}
                    </div>
                </div>
                <div className={`quiz-timer ${timerClass}`}>
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
            </div>

            {/* Progress */}
            <div className="progress-bar" style={{ marginBottom: 24 }}>
                <div className="progress-fill" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
            </div>

            {/* Question */}
            <div className="question-card">
                <div className="question-number">
                    Question {currentQ + 1}
                    {q.type === 'multi-select' && <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>( select all that apply )</span>}
                </div>
                <div className="question-text">{q.text}</div>
                <div className="options-list">
                    {q.options.map((opt, oi) => (
                        <button key={oi} className={`option ${(responses.get(currentQ) || []).includes(oi) ? 'selected' : ''}`} onClick={() => selectAnswer(currentQ, oi)}>
                            <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="question-nav">
                <button className="btn btn-secondary" disabled={currentQ === 0} onClick={() => navigateQ(currentQ - 1)}>← Previous</button>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className={`btn btn-sm ${flagged.has(currentQ) ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleFlag}
                        style={flagged.has(currentQ) ? { background: 'var(--accent-yellow)', border: 'none' } : {}}>
                        🚩 {flagged.has(currentQ) ? 'Flagged' : 'Flag'}
                    </button>
                </div>
                {currentQ < quiz.questions.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => navigateQ(currentQ + 1)}>Next →</button>
                ) : (
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? '...' : '✅ Submit Quiz'}
                    </button>
                )}
            </div>

            {/* Navigation Dots */}
            <div className="question-nav-dots" style={{ marginTop: 20 }}>
                {quiz.questions.map((_, i) => (
                    <button key={i} className={`nav-dot ${currentQ === i ? 'current' : responses.has(i) ? 'answered' : ''} ${flagged.has(i) ? 'flagged' : ''}`}
                        onClick={() => navigateQ(i)}>
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}

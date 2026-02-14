'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { UserRole } from '@/lib/types';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !role) {
            showToast('Please fill in all fields and select a role', 'warning');
            return;
        }
        if (password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
        if (password !== confirmPassword) { showToast('Passwords do not match', 'warning'); return; }

        setLoading(true);
        try {
            await signUp(email, password, name, role);
            showToast('Account created successfully! 🎉', 'success');
            router.push('/');
        } catch (err: any) {
            const msg = err.code === 'auth/email-already-in-use' ? 'An account with this email already exists' :
                err.code === 'auth/weak-password' ? 'Please choose a stronger password' :
                    'Registration failed. Please try again.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Join QuizForge</h1>
                <p className="auth-subtitle">Start your learning adventure today</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="name">Full Name</label>
                        <input id="name" type="text" className="input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-email">Email Address</label>
                        <input id="reg-email" type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label>I am a...</label>
                        <div className="role-selector">
                            <button type="button" className={`role-option ${role === 'student' ? 'selected' : ''}`} onClick={() => setRole('student')}>
                                <span className="role-option-icon">🎓</span>
                                <span className="role-option-title">Student</span>
                                <span className="role-option-desc">Take quizzes & learn</span>
                            </button>
                            <button type="button" className={`role-option ${role === 'teacher' ? 'selected' : ''}`} onClick={() => setRole('teacher')}>
                                <span className="role-option-icon">📚</span>
                                <span className="role-option-title">Teacher</span>
                                <span className="role-option-desc">Create quizzes & analyze</span>
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-password">Password</label>
                        <input id="reg-password" type="password" className="input" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <input id="confirm-password" type="password" className="input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}

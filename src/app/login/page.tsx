'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { showToast('Please fill in all fields', 'warning'); return; }
        setLoading(true);
        try {
            await signIn(email, password);
            showToast('Welcome back!', 'success');
            router.push('/');
        } catch (err: any) {
            const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password' :
                err.code === 'auth/user-not-found' ? 'No account found with that email' :
                    err.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later' :
                        'Login failed. Please try again.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to continue your learning journey</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                        {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don&apos;t have an account? <Link href="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}

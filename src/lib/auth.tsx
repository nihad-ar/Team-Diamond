'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from './types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOutUser: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const docRef = doc(db, 'users', firebaseUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, name: string, role: UserRole) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newProfile: UserProfile = {
            uid: cred.user.uid,
            name,
            email,
            role,
            subjects: [],
            totalScore: 0,
            quizzesCompleted: 0,
            averageAccuracy: 0,
            streak: 0,
            longestStreak: 0,
            lastActive: null,
            createdAt: new Date(),
            badges: [],
            xp: 0,
            level: 1,
        };
        await setDoc(doc(db, 'users', cred.user.uid), {
            ...newProfile,
            createdAt: serverTimestamp(),
        });
        setProfile(newProfile);
    };

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signOutUser = async () => {
        await firebaseSignOut(auth);
        setProfile(null);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOutUser, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

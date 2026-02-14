import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, addDoc, serverTimestamp, increment,
    Timestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Quiz, Question, Attempt, Result, LeaderboardEntry } from './types';

/* ═══════════════════════════════════════
   USERS
   ═══════════════════════════════════════ */

export async function getUser(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUser(uid: string, data: Partial<UserProfile>) {
    await updateDoc(doc(db, 'users', uid), { ...data, lastActive: serverTimestamp() });
}

export async function updateUserStats(uid: string, score: number, accuracy: number) {
    const user = await getUser(uid);
    if (!user) return;
    const newCompleted = user.quizzesCompleted + 1;
    const newTotalScore = user.totalScore + score;
    const newAvgAccuracy = ((user.averageAccuracy * user.quizzesCompleted) + accuracy) / newCompleted;
    const newXp = user.xp + Math.round(score * (accuracy / 100) * 10);

    await updateDoc(doc(db, 'users', uid), {
        totalScore: newTotalScore,
        quizzesCompleted: newCompleted,
        averageAccuracy: Math.round(newAvgAccuracy * 100) / 100,
        xp: newXp,
        level: Math.floor(newXp / 500) + 1,
        lastActive: serverTimestamp(),
    });
}

/* ═══════════════════════════════════════
   QUESTIONS
   ═══════════════════════════════════════ */

export async function createQuestion(q: Omit<Question, 'id' | 'timesAnswered' | 'successRate' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'questions'), {
        ...q,
        timesAnswered: 0,
        successRate: 0,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function getQuestions(createdBy?: string): Promise<Question[]> {
    let q;
    if (createdBy) {
        q = query(collection(db, 'questions'), where('createdBy', '==', createdBy), orderBy('createdAt', 'desc'));
    } else {
        q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
}

export async function getQuestionsByTopic(topic: string): Promise<Question[]> {
    const q = query(collection(db, 'questions'), where('topic', '==', topic));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
}

export async function deleteQuestion(id: string) {
    await deleteDoc(doc(db, 'questions', id));
}

/* ═══════════════════════════════════════
   QUIZZES
   ═══════════════════════════════════════ */

export async function createQuiz(quiz: Omit<Quiz, 'id' | 'timesAttempted' | 'averageScore' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'quizzes'), {
        ...quiz,
        timesAttempted: 0,
        averageScore: 0,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function getQuizzes(filters?: { subject?: string; difficulty?: string; isActive?: boolean; createdBy?: string }): Promise<Quiz[]> {
    let q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
    // client-side filtering for simplicity (Firestore composite index limitations)
    const snap = await getDocs(q);
    let quizzes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));

    if (filters) {
        if (filters.subject) quizzes = quizzes.filter(q => q.subject === filters.subject);
        if (filters.difficulty) quizzes = quizzes.filter(q => q.difficulty === filters.difficulty);
        if (filters.isActive !== undefined) quizzes = quizzes.filter(q => q.isActive === filters.isActive);
        if (filters.createdBy) quizzes = quizzes.filter(q => q.createdBy === filters.createdBy);
    }
    return quizzes;
}

export async function getQuiz(id: string): Promise<Quiz | null> {
    const snap = await getDoc(doc(db, 'quizzes', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Quiz) : null;
}

export async function updateQuiz(id: string, data: Partial<Quiz>) {
    await updateDoc(doc(db, 'quizzes', id), data);
}

export async function deleteQuiz(id: string) {
    await deleteDoc(doc(db, 'quizzes', id));
}

/* ═══════════════════════════════════════
   ATTEMPTS
   ═══════════════════════════════════════ */

export async function createAttempt(attempt: Omit<Attempt, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'attempts'), {
        ...attempt,
        startTime: serverTimestamp(),
    });
    return ref.id;
}

export async function updateAttempt(id: string, data: Partial<Attempt>) {
    await updateDoc(doc(db, 'attempts', id), data);
}

export async function getAttempt(id: string): Promise<Attempt | null> {
    const snap = await getDoc(doc(db, 'attempts', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Attempt) : null;
}

export async function getUserAttempts(userId: string, quizId?: string): Promise<Attempt[]> {
    let q;
    if (quizId) {
        q = query(collection(db, 'attempts'), where('userId', '==', userId), where('quizId', '==', quizId), orderBy('startTime', 'desc'));
    } else {
        q = query(collection(db, 'attempts'), where('userId', '==', userId), orderBy('startTime', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Attempt));
}

/* ═══════════════════════════════════════
   RESULTS
   ═══════════════════════════════════════ */

export async function saveResult(result: Omit<Result, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'results'), {
        ...result,
        timestamp: serverTimestamp(),
    });
    return ref.id;
}

export async function getUserResults(userId: string): Promise<Result[]> {
    const q = query(collection(db, 'results'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Result));
}

export async function getQuizResults(quizId: string): Promise<Result[]> {
    const q = query(collection(db, 'results'), where('quizId', '==', quizId), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Result));
}

/* ═══════════════════════════════════════
   LEADERBOARD
   ═══════════════════════════════════════ */

export async function getLeaderboard(limitCount: number = 20): Promise<LeaderboardEntry[]> {
    const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('xp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d, i) => {
        const data = d.data() as UserProfile;
        return {
            userId: d.id,
            name: data.name,
            totalScore: data.totalScore,
            quizzesCompleted: data.quizzesCompleted,
            averageAccuracy: data.averageAccuracy,
            rank: i + 1,
            xp: data.xp,
            level: data.level,
            badges: data.badges,
        };
    });
}

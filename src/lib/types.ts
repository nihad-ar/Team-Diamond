/* ─── User ─── */
export type UserRole = 'student' | 'teacher';

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    gradeLevel?: string;
    subjects: string[];
    totalScore: number;
    quizzesCompleted: number;
    averageAccuracy: number;
    streak: number;
    longestStreak: number;
    lastActive: Date | null;
    createdAt: Date;
    badges: string[];
    xp: number;
    level: number;
}

/* ─── Question ─── */
export type QuestionType = 'mcq' | 'true-false' | 'multi-select';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    options: string[];
    correctAnswers: number[]; // indices into options
    explanation: string;
    difficulty: Difficulty;
    topic: string;
    subtopic: string;
    bloomsLevel: BloomsLevel;
    timesAnswered: number;
    successRate: number;
    createdBy: string;
    createdAt: Date;
}

/* ─── Quiz ─── */
export interface Quiz {
    id: string;
    title: string;
    description: string;
    subject: string;
    gradeLevel: string;
    difficulty: Difficulty;
    estimatedTime: number; // minutes
    questions: QuizQuestion[];
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
    tags: string[];
    timesAttempted: number;
    averageScore: number;
}

export interface QuizQuestion {
    questionId: string;
    text: string;
    type: QuestionType;
    options: string[];
    correctAnswers: number[];
    explanation: string;
    difficulty: Difficulty;
    topic: string;
    points: number;
}

/* ─── Attempt & Result ─── */
export type AttemptStatus = 'in-progress' | 'completed' | 'abandoned';

export interface QuestionResponse {
    questionId: string;
    selectedAnswers: number[];
    isCorrect: boolean;
    timeSpent: number; // seconds
    flagged: boolean;
}

export interface Attempt {
    id: string;
    userId: string;
    quizId: string;
    quizTitle: string;
    startTime: Date;
    endTime: Date | null;
    status: AttemptStatus;
    responses: QuestionResponse[];
    score: number;
    maxScore: number;
    accuracy: number;
    completionRate: number;
}

export interface TopicPerformance {
    topic: string;
    correct: number;
    total: number;
    accuracy: number;
}

export interface Result {
    id: string;
    userId: string;
    quizId: string;
    quizTitle: string;
    attemptId: string;
    timestamp: Date;
    score: number;
    maxScore: number;
    accuracy: number;
    timeSpent: number;
    topicPerformance: TopicPerformance[];
    weakTopics: string[];
    strongTopics: string[];
}

/* ─── Leaderboard ─── */
export interface LeaderboardEntry {
    userId: string;
    name: string;
    totalScore: number;
    quizzesCompleted: number;
    averageAccuracy: number;
    rank: number;
    xp: number;
    level: number;
    badges: string[];
}

/* ─── Learning Path ─── */
export interface LearningPath {
    userId: string;
    subject: string;
    currentLevel: Difficulty;
    masteredTopics: string[];
    strugglingTopics: { topic: string; frequency: number; recentAccuracy: number }[];
    nextRecommendedQuizzes: string[];
    lastUpdated: Date;
}

/* ─── Badge ─── */
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: string;
    category: 'milestone' | 'mastery' | 'streak' | 'special';
}

import { Badge } from './types';

/* ─── Badge Definitions ─── */
export const BADGES: Badge[] = [
    { id: 'first-quiz', name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', requirement: 'Complete 1 quiz', category: 'milestone' },
    { id: 'ten-quizzes', name: 'Quiz Warrior', description: 'Complete 10 quizzes', icon: '⚔️', requirement: 'Complete 10 quizzes', category: 'milestone' },
    { id: 'fifty-quizzes', name: 'Quiz Legend', description: 'Complete 50 quizzes', icon: '👑', requirement: 'Complete 50 quizzes', category: 'milestone' },
    { id: 'perfect-score', name: 'Perfectionist', description: 'Score 100% on a quiz', icon: '💯', requirement: '100% accuracy on any quiz', category: 'special' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Finish a quiz in under 2 minutes', icon: '⚡', requirement: 'Complete quiz under 2 min', category: 'special' },
    { id: 'streak-3', name: 'On Fire', description: '3-day learning streak', icon: '🔥', requirement: '3 consecutive days', category: 'streak' },
    { id: 'streak-7', name: 'Unstoppable', description: '7-day learning streak', icon: '🌟', requirement: '7 consecutive days', category: 'streak' },
    { id: 'streak-30', name: 'Dedicated Learner', description: '30-day learning streak', icon: '🏆', requirement: '30 consecutive days', category: 'streak' },
    { id: 'math-master', name: 'Math Master', description: 'Master Mathematics', icon: '🧮', requirement: '80%+ on 5 math quizzes', category: 'mastery' },
    { id: 'science-star', name: 'Science Star', description: 'Master Science', icon: '🔬', requirement: '80%+ on 5 science quizzes', category: 'mastery' },
    { id: 'history-buff', name: 'History Buff', description: 'Master History', icon: '📜', requirement: '80%+ on 5 history quizzes', category: 'mastery' },
    { id: 'level-5', name: 'Rising Star', description: 'Reach Level 5', icon: '⭐', requirement: 'Reach Level 5', category: 'milestone' },
    { id: 'level-10', name: 'Elite Scholar', description: 'Reach Level 10', icon: '🌠', requirement: 'Reach Level 10', category: 'milestone' },
];

/* ─── Calculate earned badges ─── */
export function checkNewBadges(
    currentBadges: string[],
    stats: { quizzesCompleted: number; streak: number; level: number; lastAccuracy?: number; lastTimeSpent?: number }
): string[] {
    const newBadges: string[] = [];

    const check = (id: string, condition: boolean) => {
        if (!currentBadges.includes(id) && condition) newBadges.push(id);
    };

    check('first-quiz', stats.quizzesCompleted >= 1);
    check('ten-quizzes', stats.quizzesCompleted >= 10);
    check('fifty-quizzes', stats.quizzesCompleted >= 50);
    check('perfect-score', (stats.lastAccuracy ?? 0) === 100);
    check('speed-demon', (stats.lastTimeSpent ?? Infinity) < 120);
    check('streak-3', stats.streak >= 3);
    check('streak-7', stats.streak >= 7);
    check('streak-30', stats.streak >= 30);
    check('level-5', stats.level >= 5);
    check('level-10', stats.level >= 10);

    return newBadges;
}

/* ─── XP and Level ─── */
export function calculateXP(score: number, accuracy: number, difficulty: string): number {
    const diffMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1;
    return Math.round(score * (accuracy / 100) * diffMultiplier * 10);
}

export function getLevel(xp: number): number {
    return Math.floor(xp / 500) + 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
    const level = getLevel(xp);
    const currentLevelXP = (level - 1) * 500;
    const nextLevelXP = level * 500;
    return {
        current: xp - currentLevelXP,
        needed: 500,
        progress: ((xp - currentLevelXP) / 500) * 100,
    };
}

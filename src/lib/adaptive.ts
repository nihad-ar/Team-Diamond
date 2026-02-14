import { Difficulty } from './types';

interface PerformanceData {
    accuracy: number;
    timeSpent: number; // seconds
    difficulty: Difficulty;
}

/* ─── Recommend next difficulty ─── */
export function recommendDifficulty(recentAttempts: PerformanceData[]): Difficulty {
    if (recentAttempts.length === 0) return 'easy';

    const last5 = recentAttempts.slice(0, 5);
    const avgAccuracy = last5.reduce((sum, a) => sum + a.accuracy, 0) / last5.length;
    const currentDifficulty = last5[0]?.difficulty || 'easy';

    // Consistent mastery → increase
    if (avgAccuracy >= 80 && last5.length >= 3) {
        if (currentDifficulty === 'easy') return 'medium';
        if (currentDifficulty === 'medium') return 'hard';
        return 'hard';
    }

    // Struggling → decrease
    if (avgAccuracy < 50) {
        if (currentDifficulty === 'hard') return 'medium';
        if (currentDifficulty === 'medium') return 'easy';
        return 'easy';
    }

    // Mixed → stay current
    return currentDifficulty;
}

/* ─── Topic mastery scoring ─── */
export function calculateTopicMastery(
    topicResults: { correct: number; total: number; recentAccuracy: number }[]
): { topic: string; mastery: number }[] {
    return [];
}

/* ─── Identify weak/strong topics ─── */
export function analyzeTopicStrengths(
    topicPerformance: { topic: string; correct: number; total: number }[]
): { weak: string[]; strong: string[] } {
    const weak: string[] = [];
    const strong: string[] = [];

    topicPerformance.forEach(tp => {
        if (tp.total === 0) return;
        const accuracy = (tp.correct / tp.total) * 100;
        if (accuracy >= 80) strong.push(tp.topic);
        else if (accuracy < 50) weak.push(tp.topic);
    });

    return { weak, strong };
}

/* ─── Quiz recommendation ─── */
export function recommendQuizzes(
    availableQuizzes: { id: string; subject: string; difficulty: Difficulty; tags: string[] }[],
    weakTopics: string[],
    recommendedDifficulty: Difficulty,
    completedQuizIds: string[]
): string[] {
    // Filter out completed quizzes
    const uncompleted = availableQuizzes.filter(q => !completedQuizIds.includes(q.id));

    // Score quizzes: prioritize weak topic coverage + appropriate difficulty
    const scored = uncompleted.map(q => {
        let score = 0;
        // Weak topic match
        if (weakTopics.some(t => q.tags.includes(t) || q.subject.toLowerCase().includes(t.toLowerCase()))) {
            score += 10;
        }
        // Difficulty match
        if (q.difficulty === recommendedDifficulty) score += 5;
        return { id: q.id, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(s => s.id);
}

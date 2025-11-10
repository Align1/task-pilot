import { Task } from '../types';

const ACHIEVEMENT_IDS = {
    // Consistency & Streaks
    DAILY_HABIT: 'ach_daily_habit',
    PERFECT_WEEK: 'ach_perfect_week',
    MONTHLY_MARATHONER: 'ach_monthly_marathoner',

    // Time Milestones
    FIRST_SPRINT: 'ach_first_sprint',
    CENTURION: 'ach_centurion',
    TIME_LORD: 'ach_time_lord',

    // Focus & Deep Work
    IN_THE_ZONE: 'ach_in_the_zone',
    DEEP_DIVER: 'ach_deep_diver',
    FULL_DAY: 'ach_full_day',

    // Project & Task Management
    TASK_JUGGLER: 'ach_task_juggler',
    SPECIALIST: 'ach_specialist',
    COLOR_COORDINATOR: 'ach_color_coordinator',

    // Fun & "Easter Egg"
    WEEKEND_WARRIOR: 'ach_weekend_warrior',
    DETAIL_ORIENTED: 'ach_detail_oriented',
};

const getDayIdentifier = (date: Date) => date.toISOString().split('T')[0];

export const checkAchievements = (tasks: Task[], unlocked: string[]): string[] => {
    // Defensive check: ensure tasks is an array of objects
    if (!Array.isArray(tasks)) {
        return unlocked;
    }

    const newUnlocked = new Set(unlocked);
    
    const unlock = (id: string) => {
        newUnlocked.add(id);
    };

    // Filter for tasks that have the bare minimum properties to be processed.
    const validTasks = tasks.filter(t => t && typeof t === 'object');
    
    if (validTasks.length === 0) return Array.from(newUnlocked);

    // --- Time Milestones ---
    const totalTime = validTasks.reduce((sum, task) => sum + (task.time || 0), 0);
    if (totalTime >= 10 * 3600) unlock(ACHIEVEMENT_IDS.FIRST_SPRINT);
    if (totalTime >= 100 * 3600) unlock(ACHIEVEMENT_IDS.CENTURION);
    if (totalTime >= 1000 * 3600) unlock(ACHIEVEMENT_IDS.TIME_LORD);

    // --- Focus & Deep Work ---
    if (validTasks.some(task => (task.time || 0) >= 90 * 60)) unlock(ACHIEVEMENT_IDS.IN_THE_ZONE);
    if (validTasks.some(task => (task.time || 0) >= 3 * 3600)) unlock(ACHIEVEMENT_IDS.DEEP_DIVER);

    // --- Project & Task Management ---
    const tasksWithNotes = validTasks.filter(task => task.notes && task.notes.trim().length > 0).length;
    if (tasksWithNotes >= 5) unlock(ACHIEVEMENT_IDS.DETAIL_ORIENTED);
    
    const colorsUsed = new Set(validTasks.map(task => task.color).filter(Boolean));
    if (colorsUsed.size >= 8) unlock(ACHIEVEMENT_IDS.COLOR_COORDINATOR);
    
    const projectTime: { [title: string]: number } = {};
    validTasks.forEach(task => {
        if (task.title) { // Check for title
            projectTime[task.title] = (projectTime[task.title] || 0) + (task.time || 0);
        }
    });
    if (Object.values(projectTime).some(time => time >= 50 * 3600)) {
        unlock(ACHIEVEMENT_IDS.SPECIALIST);
    }
    
    // --- Date-based achievements ---
    const tasksByDay: { [day: string]: Task[] } = {};
    validTasks.forEach(task => {
        if (task.createdAt && !isNaN(new Date(task.createdAt).getTime())) {
            const day = getDayIdentifier(new Date(task.createdAt));
            if (!tasksByDay[day]) tasksByDay[day] = [];
            tasksByDay[day].push(task);
        }
    });

    for (const day in tasksByDay) {
        // Full Day's Work
        const dailyTotalTime = tasksByDay[day].reduce((sum, task) => sum + (task.time || 0), 0);
        if (dailyTotalTime >= 8 * 3600) {
            unlock(ACHIEVEMENT_IDS.FULL_DAY);
        }

        // Task Juggler
        const dailyProjects = new Set(tasksByDay[day].map(task => task.title).filter(Boolean));
        if (dailyProjects.size >= 3) {
            unlock(ACHIEVEMENT_IDS.TASK_JUGGLER);
        }
    }
    
    const uniqueDays = Object.keys(tasksByDay).sort();
    
    // Daily Habit
    if (uniqueDays.length >= 3) {
        for (let i = 0; i <= uniqueDays.length - 3; i++) {
            const d1 = new Date(uniqueDays[i]);
            d1.setDate(d1.getDate() + 1);
            if (getDayIdentifier(d1) === uniqueDays[i+1]) {
                const d2 = new Date(uniqueDays[i+1]);
                d2.setDate(d2.getDate() + 1);
                if (getDayIdentifier(d2) === uniqueDays[i+2]) {
                    unlock(ACHIEVEMENT_IDS.DAILY_HABIT);
                    break;
                }
            }
        }
    }
    
    // Monthly Marathoner
    const daysByMonth: { [month: string]: Set<string> } = {};
    uniqueDays.forEach(dayStr => {
        const month = dayStr.substring(0, 7); // YYYY-MM
        if (!daysByMonth[month]) daysByMonth[month] = new Set();
        daysByMonth[month].add(dayStr);
    });
    if (Object.values(daysByMonth).some(days => days.size >= 20)) {
        unlock(ACHIEVEMENT_IDS.MONTHLY_MARATHONER);
    }

    // Weekend Warrior
    const tasksByWeekend: { [weekendStart: string]: number } = {};
    validTasks.forEach(task => {
        if (task.createdAt && !isNaN(new Date(task.createdAt).getTime())) {
            const date = new Date(task.createdAt);
            const dayOfWeek = date.getDay(); // Sunday = 0, Saturday = 6
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                const weekendStart = new Date(date);
                weekendStart.setDate(date.getDate() - dayOfWeek); // Go back to Sunday
                const weekendKey = getDayIdentifier(weekendStart);
                tasksByWeekend[weekendKey] = (tasksByWeekend[weekendKey] || 0) + (task.time || 0);
            }
        }
    });

    if (Object.values(tasksByWeekend).some(time => time >= 4 * 3600)) {
        unlock(ACHIEVEMENT_IDS.WEEKEND_WARRIOR);
    }

    // Perfect Week
    const daysByWeek: { [weekStart: string]: Set<number> } = {};
    validTasks.forEach(task => {
        if (task.createdAt && !isNaN(new Date(task.createdAt).getTime())) {
            const date = new Date(task.createdAt);
            const dayOfWeek = date.getDay(); // Sunday = 0, ..., Saturday = 6
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - dayOfWeek);
            const weekKey = getDayIdentifier(weekStart);

            if (!daysByWeek[weekKey]) daysByWeek[weekKey] = new Set();
            daysByWeek[weekKey].add(dayOfWeek);
        }
    });

    if (Object.values(daysByWeek).some(days => days.size === 7)) {
        unlock(ACHIEVEMENT_IDS.PERFECT_WEEK);
    }

    return Array.from(newUnlocked);
};

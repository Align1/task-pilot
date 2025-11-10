import { Achievement } from '../types';

export const mockAchievements: Achievement[] = [
    // Consistency & Streaks
    { id: 'ach_daily_habit', name: 'Daily Habit', description: 'Track time for 3 consecutive days.', icon: 'Calendar' },
    { id: 'ach_perfect_week', name: 'Perfect Week', description: 'Track time every day for one week.', icon: 'Trophy' },
    { id: 'ach_monthly_marathoner', name: 'Monthly Marathoner', description: 'Track on 20 different days in a month.', icon: 'Rocket' },

    // Time Milestones
    { id: 'ach_first_sprint', name: 'The First Sprint', description: 'Log your first 10 hours.', icon: 'Sunrise' },
    { id: 'ach_centurion', name: 'Centurion', description: 'Log a total of 100 hours.', icon: 'Trophy' },
    { id: 'ach_time_lord', name: 'Time Lord', description: 'Log a total of 1,000 hours.', icon: 'Zap' },

    // Focus & Deep Work
    { id: 'ach_in_the_zone', name: 'In the Zone', description: 'Track a single session for 90 minutes.', icon: 'Target' },
    { id: 'ach_deep_diver', name: 'Deep Diver', description: 'Track a single session for 3 hours.', icon: 'Target' },
    { id: 'ach_full_day', name: 'Full Day\'s Work', description: 'Track 8 hours in a single day.', icon: 'Briefcase' },

    // Project & Task Management
    { id: 'ach_task_juggler', name: 'Task Juggler', description: 'Work on 3+ projects in one day.', icon: 'LayoutGrid' },
    { id: 'ach_specialist', name: 'The Specialist', description: 'Log 50+ hours on a single project.', icon: 'Briefcase' },
    { id: 'ach_color_coordinator', name: 'Color Coordinator', description: 'Use all 8 available task colors.', icon: 'Settings' },

    // Fun & "Easter Egg"
    { id: 'ach_weekend_warrior', name: 'Weekend Warrior', description: 'Track 4+ hours over a weekend.', icon: 'Zap' },
    { id: 'ach_detail_oriented', name: 'Detail Oriented', description: 'Add notes to 5 different tasks.', icon: 'Edit' },
];


export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  subscription: {
    tier: 'free' | 'pro';
    status: 'active';
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  children?: Project[];
  taskCount?: number;
  totalTime?: number;
}

export interface Task {
  id: string;
  projectId?: string | null;
  title: string; // Task name
  description: string;
  time: number; // in seconds
  color: string;
  tags: string[];
  notes?: string;
  createdAt: string; // ISO string
  // Computed fields
  project?: Project;
}

export interface Goal {
  id: string;
  category: string; // Project name
  timeframe: 'Weekly' | 'Monthly';
  hours: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface NotificationSettings {
  weeklyReport: boolean;
  goalReminders: boolean;
  achievementUnlocked: boolean;
}

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
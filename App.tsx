import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, Project, Goal, Achievement, Timeframe, NotificationSettings, ToastMessage } from './types';
import { mockAchievements } from './data/mockData';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { TaskDialog } from './components/TaskDialog';
import { ProjectDialog } from './components/ProjectDialog';
import { Icon } from './components/icons';
import { Button } from './components/ui';
import { checkAchievements } from './lib/achievements';
import { ToastContainer, ToastContext } from './components/Toast';
import { Auth } from './components/Auth';
import { registerServiceWorker, showNotification } from './lib/pwa';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { 
  SUBSCRIPTION_PLANS, 
  hasReachedLimit, 
  getRemainingQuota,
  checkUsage,
  SubscriptionTier 
} from './lib/subscription';
import { UpgradePrompt, UpgradeBanner } from './components/UpgradePrompt';
import { PricingPage } from './components/PricingPage';
import { supabase } from './lib/supabase';
import {
  getCurrentUser,
  signOut,
  fetchTasks as fetchTasksFromSupabase,
  createTask as createTaskInSupabase,
  updateTask as updateTaskInSupabase,
  deleteTask as deleteTaskFromSupabase,
  fetchProjects as fetchProjectsFromSupabase,
  createProject as createProjectInSupabase,
  updateProject as updateProjectInSupabase,
  deleteProject as deleteProjectFromSupabase,
} from './lib/supabaseHelpers';

type Page = 'dashboard' | 'settings' | 'pricing';

const getFromStorage = <T,>(key: string, fallback: T): T => {
    const item = localStorage.getItem(key);
    if (!item) {
        return fallback;
    }

    // Handle string types directly - if fallback is a string, assume item is valid
    if (typeof fallback === 'string' && typeof item === 'string') {
        return item as T;
    }
    
    // Handle boolean types
    if (typeof fallback === 'boolean' && (item === 'true' || item === 'false')) {
        return (item === 'true') as T;
    }

    try {
        const parsed = JSON.parse(item);

        if (parsed === null) {
            return fallback;
        }
        
        const isFallbackArray = Array.isArray(fallback);
        const isParsedArray = Array.isArray(parsed);

        if (isFallbackArray !== isParsedArray) {
            return fallback;
        }

        const isFallbackObject = typeof fallback === 'object' && fallback !== null && !isFallbackArray;
        const isParsedObject = typeof parsed === 'object' && parsed !== null && !isParsedArray;
        
        if (isFallbackObject !== isParsedObject) {
            return fallback;
        }

        return parsed;
    } catch (e) {
        // If JSON parsing fails but it's a string that matches the fallback type, use it
        if (typeof fallback === 'string') {
            return item as T;
        }
        console.error(`Failed to parse ${key} from localStorage`, e);
        return fallback;
    }
};

const defaultNotificationSettings: NotificationSettings = {
    weeklyReport: true,
    goalReminders: true,
    achievementUnlocked: false,
};

const Sidebar: React.FC<{
  user: User | null;
  page: Page;
  setPage: (page: Page) => void;
  onAddTask: () => void;
  onLogout: () => void;
}> = ({ user, page, setPage, onAddTask, onLogout }) => {
    const NavLink: React.FC<{ p: Page; icon: string; label: string }> = ({ p, icon, label }) => (
        <button
            onClick={() => setPage(p)}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
                page === p
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
        >
            <Icon name={icon} className="w-5 h-5 mr-4" />
            <span className="font-semibold">{label}</span>
        </button>
    );

    return (
        <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-lg border-r border-slate-800/50 flex-col p-4 text-white">
            <div className="flex items-center gap-2 px-2 mb-10">
                <Icon name="Rocket" className="w-7 h-7 text-indigo-400" />
                <span className="font-bold text-2xl text-slate-100">Task Pilot</span>
            </div>
            
            <nav className="flex flex-col gap-2">
                <NavLink p="dashboard" icon="LayoutGrid" label="Dashboard" />
                <NavLink p="settings" icon="Settings" label="Settings" />
                <NavLink p="pricing" icon="Zap" label="Pricing" />
            </nav>

            <div className="mt-auto">
                {user && user.subscription?.tier === 'free' && (
                    <Button
                        variant="primary"
                        className="w-full mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        onClick={() => setPage('pricing')}
                    >
                        <Icon name="Zap" className="w-5 h-5 mr-2" />
                        Upgrade to Pro
                    </Button>
                )}
                <Button variant="primary" size="lg" onClick={onAddTask} className="w-full mb-4">
                    <Icon name="Plus" className="w-5 h-5 mr-2" />
                    Add New Task
                </Button>
                {user && (
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold text-sm text-slate-100">{user.displayName}</p>
                                <p className="text-xs text-slate-400">{user.subscription?.tier} User</p>
                            </div>
                        </div>
                         <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onLogout} aria-label="Log Out">
                            <Icon name="LogOut" className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
};

const MobileHeader: React.FC<{ user: User | null }> = ({ user }) => {
    const greeting = React.useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const tierBadgeColor = user?.subscription?.tier === 'pro' 
      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
      : user?.subscription?.tier === 'enterprise'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      : 'bg-slate-500/20 text-slate-400 border-slate-500/50';

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800/50">
            <div>
                <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100">{greeting}, {user?.displayName?.split(' ')[0]}!</h1>
                    {user && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierBadgeColor}`}>
                            {user.subscription?.tier?.toUpperCase() || 'FREE'}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-400">Ready to be productive?</p>
            </div>
            {user && <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full" />}
        </header>
    );
};

const BottomNav: React.FC<{
    page: Page;
    setPage: (page: Page) => void;
    onAddTask: () => void;
}> = ({ page, setPage, onAddTask }) => {
    const NavItem: React.FC<{ p: Page; icon: string; label: string }> = ({ p, icon, label }) => (
        <button onClick={() => setPage(p)} className={`flex flex-col items-center gap-1 transition-colors duration-200 ${page === p ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <Icon name={icon} className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-20 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/50 flex items-center justify-around px-2">
            <NavItem p="dashboard" icon="LayoutGrid" label="Dashboard" />
            <NavItem p="pricing" icon="Zap" label="Pricing" />
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg shadow-indigo-500/30" onClick={onAddTask}>
                <Icon name="Plus" className="w-7 h-7" />
            </Button>
            <NavItem p="settings" icon="Settings" label="Settings" />
        </nav>
    );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [page, setPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getFromStorage<'light' | 'dark'>('theme', 'dark'));
  const [timeframe, setTimeframe] = useState<Timeframe>(() => getFromStorage<Timeframe>('timeframe', 'Weekly'));
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getFromStorage('notificationSettings', defaultNotificationSettings));
  
  const [timezone, setTimezone] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => localStorage.getItem('activeTaskId'));
  const [isTaskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  // Subscription state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState<{
    title: string;
    message: string;
    feature: string;
    suggestedTier: SubscriptionTier;
  } | null>(null);
  
  // Network state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Ref to track timer interval for cleanup
  const timerIntervalRef = React.useRef<number | undefined>(undefined);
  const lastSaveTimeRef = React.useRef<number>(Date.now());

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAuthSuccess = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    // Save active timer data before logging out
    if (activeTaskId && user) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask) {
        try {
          await updateTaskInSupabase(activeTaskId, activeTask);
        } catch (error) {
          console.error('Failed to save timer before logout:', error);
        }
      }
    }

    // Clear active timer interval to prevent memory leak
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }
    
    // Sign out from Supabase
    await signOut();
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset all state
    setUser(null);
    setTasks([]);
    setProjects([]);
    setActiveTaskId(null);
    
    addToast("You've been logged out.", 'info');
  };

  // Fetch tasks with pagination
  const fetchTasks = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!user) return;
    
    try {
      const { tasks: newTasks, totalCount } = await fetchTasksFromSupabase(user.uid, page, limit);
      
      // Append tasks if loading more (page > 1), otherwise replace
      if (page > 1) {
        setTasks(prev => [...prev, ...newTasks]);
      } else {
        setTasks(newTasks);
      }
      
      return {
        items: newTasks,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount
        }
      };
    } catch (error: any) {
      addToast(`Could not load tasks: ${error.message}`, 'error');
      throw error;
    }
  }, [user, addToast]);
  
  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const fetchedProjects = await fetchProjectsFromSupabase(user.uid);
      setProjects(fetchedProjects);
    } catch (error: any) {
      addToast(`Could not load projects: ${error.message}`, 'error');
    }
  }, [user, addToast]);

  // Check auth on mount and listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTasks([]);
        setProjects([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      const fetchInitialData = async () => {
        try {
          await Promise.all([
            fetchTasks(1, 20),
            fetchProjects()
          ]);
        } catch (error: any) {
          // Errors already handled in fetch functions
        }
      };
      fetchInitialData();
    }
  }, [user, fetchTasks, fetchProjects]);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Register service worker for PWA
  useEffect(() => {
    // Only register in production or if explicitly testing PWA
    if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
      registerServiceWorker()
        .then((registration) => {
          if (registration) {
            console.log('[PWA] Service Worker registered successfully');
          }
        })
        .catch((error) => {
          // Silently fail - PWA features are optional
          console.log('[PWA] Service Worker not available:', error.message);
        });
    }
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Connection restored!', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('You are offline. Changes will be saved when connection is restored.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Save timer data before page unload
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (activeTaskId) {
        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (activeTask) {
          // Use synchronous API if available, or navigator.sendBeacon
          const data = JSON.stringify({
            title: activeTask.title,
            description: activeTask.description,
            time: activeTask.time,
            color: activeTask.color,
            tags: activeTask.tags,
            notes: activeTask.notes
          });

          // Try to send the data before unload
          if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon(`${API_URL}/tasks/${activeTaskId}`, blob);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTaskId, tasks]);
  
  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('timeframe', timeframe); }, [timeframe]);
  useEffect(() => { localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings)); }, [notificationSettings]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Timer interval effect with memory leak protection
  useEffect(() => {
    // Clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }

    if (activeTaskId) {
      // Persist active task ID
      localStorage.setItem('activeTaskId', activeTaskId);
      
      // Start new interval - COUNT DOWN
      timerIntervalRef.current = window.setInterval(() => {
        setTasks(prevTasks =>
          prevTasks.map(task => {
            if (task.id === activeTaskId) {
              const newTime = Math.max(0, (task.time || 0) - 1);
              
              // Stop timer when it reaches 0
              if (newTime === 0 && task.time !== 0) {
                setActiveTaskId(null);
                addToast(`Timer completed for "${task.title}"!`, 'success');
              }
              
              return { ...task, time: newTime };
            }
            return task;
          })
        );
      }, 1000);
    } else {
      // Remove from localStorage when no active task
      localStorage.removeItem('activeTaskId');
    }

    // Cleanup function
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = undefined;
      }
    };
  }, [activeTaskId, addToast]);

  // Periodic save of active timer to server (every 30 seconds)
  useEffect(() => {
    if (!activeTaskId || !user) return;

    const saveTimerToServer = async () => {
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTimeRef.current;
      
      // Only save if it's been at least 30 seconds
      if (timeSinceLastSave < 30000) return;

      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (!activeTask) return;

      try {
        await updateTaskInSupabase(activeTaskId, activeTask);
        lastSaveTimeRef.current = now;
      } catch (error) {
        console.error('Failed to save timer to server:', error);
        // Don't show toast to avoid spamming user
      }
    };

    // Save immediately on mount if needed
    saveTimerToServer();

    // Then save every 30 seconds
    const saveInterval = setInterval(saveTimerToServer, 30000);

    return () => clearInterval(saveInterval);
  }, [activeTaskId, tasks, user]);

  useEffect(() => {
    if (tasks.length > 0) {
        const potentiallyNewUnlocked = checkAchievements(tasks, unlocked);
        const newAchievements = potentiallyNewUnlocked.filter(id => !unlocked.includes(id));
        if (newAchievements.length > 0) {
            setUnlocked(potentiallyNewUnlocked);
            newAchievements.forEach(achId => {
                const achievement = mockAchievements.find(a => a.id === achId);
                if (achievement) {
                    addToast(`Achievement Unlocked: ${achievement.name}!`, 'info');
                    
                    // Send PWA notification if enabled
                    if (notificationSettings.achievementUnlocked) {
                        try {
                            showNotification('🏆 Achievement Unlocked!', {
                                body: `${achievement.name} - ${achievement.description}`,
                                icon: '/icons/icon-192x192.png',
                                badge: '/icons/icon-72x72.png',
                                tag: `achievement-${achId}`,
                                vibrate: [200, 100, 200]
                            }).catch(() => {
                                // Silently fail if notifications not supported
                            });
                        } catch (error) {
                            // Silently fail if showNotification not available
                            console.log('[PWA] Notifications not supported');
                        }
                    }
                }
            });
        }
    }
  }, [tasks, unlocked, addToast, notificationSettings]);

  const handleOpenTaskDialog = (task: Task | null) => {
    setTaskToEdit(task);
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setTaskToEdit(null);
    setTaskDialogOpen(false);
  };

  const handleOpenProjectDialog = (project: Project | null) => {
    setProjectToEdit(project);
    setProjectDialogOpen(true);
  };

  const handleCloseProjectDialog = () => {
    setProjectToEdit(null);
    setProjectDialogOpen(false);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt'>, id?: string) => {
    if (!user) return;

    // Check limit for new tasks
    if (!id && !checkTaskLimit()) {
      return;
    }

    try {
      if (id) {
        const updatedTask = await updateTaskInSupabase(id, taskData as Partial<Task>);
        setTasks(tasks.map(t => t.id === id ? updatedTask : t));
        addToast(`Task "${taskData.title}" updated!`, 'success');
      } else {
        const newTask = await createTaskInSupabase(user.uid, taskData as Partial<Task>);
        // Add new task to the top of the list (optimistic update)
        setTasks([newTask, ...tasks]);
        addToast(`Task "${taskData.title}" created!`, 'success');
      }
    } catch (error: any) {
      addToast(`Error saving task: ${error.message}`, 'error');
    }
  };

  const handleUpgrade = (tier: SubscriptionTier, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    // In production, integrate with Stripe, Paddle, or LemonSqueezy
    addToast(`Opening ${tier} plan checkout...`, 'info');
    
    // For now, navigate to pricing page
    setPage('pricing');
    
    // TODO: Integrate payment processor
    // Example: window.location.href = `/checkout?tier=${tier}&cycle=${billingCycle}`;
  };

  const handleDismissUpgrade = () => {
    setShowUpgradePrompt(false);
    setUpgradePromptData(null);
  };

  const handleToggleTimer = (taskId: string) => {
    // If clicking the same task, pause/stop it
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    } else {
      // Start timer on new task
      setActiveTaskId(taskId);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Stop timer if deleting the active task
      if (activeTaskId === taskId) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = undefined;
        }
        setActiveTaskId(null);
        localStorage.removeItem('activeTaskId');
      }

      await deleteTaskFromSupabase(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      addToast('Task deleted.', 'success');
    } catch (error: any) {
      addToast(`Error deleting task: ${error.message}`, 'error');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    addToast('Profile updated!', 'success');
  };

  const checkProjectLimit = (): boolean => {
    const userTier = (user?.subscription?.tier as SubscriptionTier) || 'free';
    const projectCount = projects.length;
    const check = checkUsage(userTier, 'maxProjects', projectCount, 'projects');
    
    if (!check.allowed) {
      setUpgradePromptData({
        title: 'Project Limit Reached',
        message: check.reason || 'Upgrade to create more projects',
        feature: 'Unlimited Projects',
        suggestedTier: 'pro'
      });
      setShowUpgradePrompt(true);
      return false;
    }
    
    return true;
  };

  const checkTaskLimit = (): boolean => {
    const userTier = (user?.subscription?.tier as SubscriptionTier) || 'free';
    // Count tasks created this month
    const now = new Date();
    const thisMonthTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate.getMonth() === now.getMonth() && 
             taskDate.getFullYear() === now.getFullYear();
    }).length;
    
    const check = checkUsage(userTier, 'maxTasksPerMonth', thisMonthTasks, 'tasks this month');
    
    if (!check.allowed) {
      setUpgradePromptData({
        title: 'Monthly Task Limit Reached',
        message: check.reason || 'Upgrade for unlimited tasks',
        feature: 'Unlimited Tasks',
        suggestedTier: 'pro'
      });
      setShowUpgradePrompt(true);
      return false;
    }
    
    return true;
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'taskCount' | 'totalTime'>, id?: string) => {
    if (!user) return;

    // Check limit for new projects
    if (!id && !checkProjectLimit()) {
      return;
    }

    try {
      if (id) {
        const updatedProject = await updateProjectInSupabase(id, projectData as Partial<Project>);
        setProjects(projects.map(p => p.id === id ? updatedProject : p));
        addToast(`Project "${projectData.name}" updated!`, 'success');
      } else {
        const newProject = await createProjectInSupabase(user.uid, projectData as Partial<Project>);
        setProjects([newProject, ...projects]);
        addToast(`Project "${projectData.name}" created!`, 'success');
      }
    } catch (error: any) {
      addToast(`Error saving project: ${error.message}`, 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProjectFromSupabase(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      // Refresh tasks to update projectId references
      await fetchTasks(1, 20);
      addToast('Project deleted. Related tasks are now unassigned.', 'success');
    } catch (error: any) {
      addToast(`Error deleting project: ${error.message}`, 'error');
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastContext.Provider value={{ addToast }}>
        <div className={`font-sans ${theme === 'dark' ? 'dark' : ''}`}>
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
          <Auth onAuthSuccess={handleAuthSuccess} />
        </div>
      </ToastContext.Provider>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard 
          user={user} 
          tasks={tasks}
          projects={projects}
          goals={goals} 
          timeframe={timeframe} 
          setTimeframe={setTimeframe} 
          activeTaskId={activeTaskId} 
          onToggleTimer={handleToggleTimer} 
          onEditTask={handleOpenTaskDialog} 
          onDeleteTask={handleDeleteTask}
          onLoadMore={fetchTasks}
          onOpenProjectDialog={handleOpenProjectDialog}
        />;
      case 'settings':
        return <Settings user={user} theme={theme} setTheme={setTheme} achievements={mockAchievements} unlockedAchievements={unlocked} goals={goals} timezone={timezone} notificationSettings={notificationSettings} onNotificationSettingsChange={setNotificationSettings} onUpdateUser={handleUpdateUser} />;
      case 'pricing':
        return user && <PricingPage 
          currentUser={user} 
          onUpgrade={handleUpgrade} 
          onClose={() => setPage('dashboard')}
        />;
      default: return null;
    }
  };

  // Network status indicator component
  const NetworkStatusIndicator = () => {
    if (isOnline) return null;

    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-fade-in-up">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
          <Icon name="XCircle" className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">You're offline</p>
            <p className="text-xs opacity-80">Changes will be saved when reconnected</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className={`min-h-screen font-sans text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950`}>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <NetworkStatusIndicator />
        <PWAInstallPrompt />
        <Sidebar user={user} page={page} setPage={setPage} onAddTask={() => handleOpenTaskDialog(null)} onLogout={handleLogout} />
        <MobileHeader user={user} />
        <main className="md:pl-64 pt-20 md:pt-0 pb-20 md:pb-0">
            {renderPage()}
        </main>
        <BottomNav page={page} setPage={setPage} onAddTask={() => handleOpenTaskDialog(null)} />
        <TaskDialog 
          isOpen={isTaskDialogOpen} 
          onClose={handleCloseTaskDialog} 
          onSave={handleSaveTask} 
          taskToEdit={taskToEdit}
          projects={projects}
        />
        <ProjectDialog
          isOpen={isProjectDialogOpen}
          onClose={handleCloseProjectDialog}
          onSave={handleSaveProject}
          projectToEdit={projectToEdit}
          projects={projects}
        />
        {showUpgradePrompt && upgradePromptData && (
          <UpgradePrompt
            title={upgradePromptData.title}
            message={upgradePromptData.message}
            featureList={[upgradePromptData.feature]}
            currentTier={(user?.subscription?.tier as SubscriptionTier) || 'free'}
            suggestedTier={upgradePromptData.suggestedTier}
            onUpgrade={handleUpgrade}
            onDismiss={handleDismissUpgrade}
          />
        )}
      </div>
    </ToastContext.Provider>
  );
};

export default App;
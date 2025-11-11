import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { User, Task, Project, Goal, Timeframe } from '../types';
import { Icon } from './icons';
import { Button, Card, Progress, ToggleGroup, Input } from './ui';

// --- Helper Functions ---
const formatTime = (totalSeconds: number | null | undefined) => {
  // Handle null, undefined, NaN, or invalid values
  if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00:00';
  }
  
  // Ensure we have a valid integer
  const validSeconds = Math.floor(Number(totalSeconds));
  
  const hours = Math.floor(validSeconds / 3600);
  const minutes = Math.floor((validSeconds % 3600) / 60);
  const seconds = validSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const filterTasksByTimeframe = (tasks: Task[], timeframe: Timeframe) => {
  const now = new Date();
  return tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    if (timeframe === 'Daily') {
      return taskDate.toDateString() === now.toDateString();
    }
    if (timeframe === 'Weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return taskDate >= weekStart;
    }
    if (timeframe === 'Monthly') {
      return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
    }
    return false;
  });
};

const COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#60a5fa', '#34d399'];

const borderColorMap: { [key: string]: string } = {
    'blue-500': 'border-blue-500',
    'green-500': 'border-green-500',
    'purple-500': 'border-purple-500',
    'pink-500': 'border-pink-500',
    'yellow-500': 'border-yellow-500',
    'red-500': 'border-red-500',
    'orange-500': 'border-orange-500',
    'teal-500': 'border-teal-500',
};

const bgColorMap: { [key: string]: string } = {
    'blue-500': 'bg-blue-500/10 dark:bg-blue-500/20',
    'green-500': 'bg-green-500/10 dark:bg-green-500/20',
    'purple-500': 'bg-purple-500/10 dark:bg-purple-500/20',
    'pink-500': 'bg-pink-500/10 dark:bg-pink-500/20',
    'yellow-500': 'bg-yellow-500/10 dark:bg-yellow-500/20',
    'red-500': 'bg-red-500/10 dark:bg-red-500/20',
    'orange-500': 'bg-orange-500/10 dark:bg-orange-500/20',
    'teal-500': 'bg-teal-500/10 dark:bg-teal-500/20',
};

// --- Sub-components ---
const WelcomeCard: React.FC<{ user: User | null }> = ({ user }) => {
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    return (
        <Card className="p-6 flex flex-col justify-center h-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{greeting}, {user?.displayName?.split(' ')[0]}!</h2>
            <p className="text-slate-500 dark:text-slate-400">Ready to be productive today?</p>
        </Card>
    );
};

const HoursChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const chartData = useMemo(() => {
        const projectHours: { [key: string]: number } = {};
        tasks.forEach(task => {
            projectHours[task.title] = (projectHours[task.title] || 0) + (task.time || 0);
        });
        return Object.entries(projectHours).map(([name, time]) => ({
            name,
            hours: parseFloat(((time || 0) / 3600).toFixed(2)),
        }));
    }, [tasks]);

    const totalHours = chartData.reduce((acc, item) => acc + item.hours, 0).toFixed(1);

    return (
        <Card className="p-6 col-span-1 lg:col-span-3">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Hours Tracked</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Your project time distribution.</p>
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalHours}h</span>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8' }} fontSize={12} unit="h" axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                            contentStyle={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '0.75rem',
                                color: '#f8fafc'
                            }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const GoalProgress: React.FC<{ goals: Goal[], tasks: Task[] }> = ({ goals, tasks }) => {
  if (goals.length === 0) return null;
  return (
    <Card className="p-6 space-y-5 h-full">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Goal Progress</h3>
        {goals.map(goal => {
            const relevantTasksTime = tasks.filter(t => t.title === goal.category).reduce((acc, t) => acc + (t.time || 0), 0);
            const progress = Math.min((relevantTasksTime / (goal.hours * 3600)) * 100, 100);
            return (
                <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{goal.category} ({goal.timeframe})</span>
                        <span className="text-slate-500 dark:text-slate-400">{formatTime(relevantTasksTime)} / {goal.hours}h</span>
                    </div>
                    <Progress value={progress} />
                </div>
            )
        })}
    </Card>
  );
};

const TaskItem: React.FC<{ task: Task; isActive: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; project?: Project | null; }> = ({ task, isActive, onToggle, onEdit, onDelete, project }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const secondsProgress = ((task.time || 0) % 60) / 60;
    const strokeDashoffset = circumference - secondsProgress * circumference;

    return (
        <Card className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 ${borderColorMap[task.color] || 'border-transparent'} ${bgColorMap[task.color] || ''} transition-all duration-300 hover:shadow-xl hover:border-indigo-500`}>
            <div className="flex-grow min-w-0 w-full">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
                    {project && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            <Icon name={project.icon || 'Briefcase'} className="w-3 h-3" />
                            {project.name}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{task.description}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                    {task.tags.map(tag => (
                        <span key={tag} className={`text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300`}>{tag}</span>
                    ))}
                </div>
            </div>
            <div className="w-full sm:w-auto flex items-center justify-between shrink-0 mt-4 sm:mt-0">
                <p className={`font-mono text-slate-900 dark:text-slate-100 text-left transition-all duration-300 ${isActive ? 'text-2xl font-semibold text-indigo-500 dark:text-indigo-400' : 'text-lg'}`}>{formatTime(task.time || 0)}</p>
                
                <div className="flex items-center gap-1">
                    <div className="relative w-10 h-10">
                        {isActive && (
                            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                <circle
                                    cx="20"
                                    cy="20"
                                    r={radius}
                                    strokeWidth="3"
                                    className="stroke-slate-200 dark:stroke-slate-700"
                                    fill="transparent"
                                />
                                <circle
                                    cx="20"
                                    cy="20"
                                    r={radius}
                                    strokeWidth="3"
                                    className="stroke-indigo-500"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                                />
                            </svg>
                        )}
                        <Button 
                            size="icon" 
                            variant={isActive ? 'destructive' : 'secondary'} 
                            onClick={onToggle} 
                            aria-label={isActive ? "Pause timer" : "Start timer"}
                            className="w-full h-full"
                        >
                            <Icon name={isActive ? 'Pause' : 'Play'} className="w-5 h-5" />
                        </Button>
                    </div>
                    
                    <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Edit task" className="text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400">
                        <Icon name="Edit" className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete task" className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400">
                        <Icon name="Trash" className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

// --- Main Dashboard Component ---
interface DashboardProps {
  user: User | null;
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  activeTaskId: string | null;
  onToggleTimer: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onLoadMore?: (page: number, limit: number) => Promise<any>;
  onOpenProjectDialog: (project: Project | null) => void;
}
export const Dashboard: React.FC<DashboardProps> = (props) => {
    const { user, tasks, projects, goals, timeframe, setTimeframe, activeTaskId, onToggleTimer, onEditTask, onDeleteTask, onLoadMore, onOpenProjectDialog } = props;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const tasksInTimeframe = useMemo(() => filterTasksByTimeframe(tasks, timeframe), [tasks, timeframe]);
    const filteredGoals = useMemo(() => goals.filter(g => timeframe === 'Daily' ? false : g.timeframe === timeframe), [goals, timeframe]);
    
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        tasksInTimeframe.forEach(task => {
            task.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [tasksInTimeframe]);

    const handleToggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const displayedTasks = useMemo(() => {
        return tasksInTimeframe
            .filter(task =>
                searchQuery === '' ||
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .filter(task =>
                selectedTags.length === 0 ||
                selectedTags.every(tag => task.tags.includes(tag))
            )
            .filter(task =>
                selectedProjectId === '' ||
                task.projectId === selectedProjectId ||
                (selectedProjectId === 'none' && !task.projectId)
            );
    }, [tasksInTimeframe, searchQuery, selectedTags, selectedProjectId]);

    const handleLoadMore = async () => {
        if (!onLoadMore || isLoadingMore || !hasMore) return;
        
        setIsLoadingMore(true);
        try {
            const result = await onLoadMore(currentPage + 1, 20);
            setCurrentPage(result.pagination.page);
            setHasMore(result.pagination.hasMore);
        } catch (error) {
            console.error('Failed to load more tasks:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Overview of your time tracking.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenProjectDialog(null)}
                        className="flex items-center gap-2"
                    >
                        <Icon name="Briefcase" className="w-4 h-4" />
                        Manage Projects
                    </Button>
                <ToggleGroup<Timeframe>
                    value={timeframe}
                    onValueChange={setTimeframe}
                    options={[
                        { value: 'Daily', label: 'Daily' },
                        { value: 'Weekly', label: 'Weekly' },
                        { value: 'Monthly', label: 'Monthly' },
                    ]}
                />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="hidden md:block">
                        <WelcomeCard user={user} />
                    </div>
                    <div className="md:col-span-2">
                        <GoalProgress goals={filteredGoals} tasks={tasksInTimeframe} />
                    </div>
                </div>
                <HoursChart tasks={tasksInTimeframe} />

                <div className="lg:col-span-3 space-y-4">
                    <Card className="p-4 space-y-4">
                        <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Icon name="Search" className="w-5 h-5 text-slate-400" />
                            </span>
                            <Input
                                id="task-search"
                                name="task-search"
                                type="text"
                                placeholder="Search by title or description..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10"
                                autoComplete="off"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    aria-label="Clear search"
                                >
                                    <Icon name="Close" className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                                </button>
                            )}
                        </div>
                        
                        {projects.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                    Filter by Project
                                </label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:border-slate-700 dark:text-slate-50"
                                >
                                    <option value="">All Projects</option>
                                    <option value="none">No Project</option>
                                    {projects.filter(p => !p.isArchived).map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name} ({project.taskCount || 0} tasks)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {allTags.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                    Filter by Tags
                                </label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleToggleTag(tag)}
                                            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                                                selectedTags.includes(tag) 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                    {selectedTags.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="text-sm !px-2 !py-1 h-auto text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 pt-2">Tasks for {timeframe}</h2>
                    {displayedTasks.length > 0 ? (
                        <>
                            {displayedTasks.map(task => {
                                const taskProject = projects.find(p => p.id === task.projectId);
                                return (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                        project={taskProject}
                                isActive={task.id === activeTaskId} 
                                onToggle={() => onToggleTimer(task.id)}
                                onEdit={() => onEditTask(task)}
                                onDelete={() => onDeleteTask(task.id)}
                            />
                                );
                            })}
                            
                            {/* Load More Button */}
                            {onLoadMore && hasMore && !isLoadingMore && (
                                <Card className="p-6 flex justify-center">
                                    <Button 
                                        onClick={handleLoadMore}
                                        variant="outline"
                                        className="w-full max-w-md"
                                    >
                                        Load More Tasks
                                    </Button>
                                </Card>
                            )}
                            
                            {/* Loading Skeleton */}
                            {isLoadingMore && (
                                <Card className="p-6 flex items-center justify-center gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Loading more tasks...</span>
                                </Card>
                            )}
                            
                            {/* End of List Indicator */}
                            {!hasMore && tasks.length > 20 && (
                                <Card className="p-6 flex justify-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        You've reached the end of your task list! 🎉
                                    </p>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="p-12 flex flex-col items-center justify-center text-center">
                            {tasksInTimeframe.length > 0 ? (
                                <>
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No tasks match your filters</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or tag selection.</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No tasks tracked for this period</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Click "Add Task" to get started or switch the timeframe.</p>
                                </>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
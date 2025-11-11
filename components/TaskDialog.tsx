
import React, { useState, useEffect } from 'react';
import { Task, Project } from '../types';
import { Button, Dialog, Input, Label } from './ui';
import { useToast } from './Toast';
import { Icon } from './icons';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>, id?: string) => void;
  taskToEdit: Task | null;
  projects?: Project[];
}

const TASK_COLORS = ['blue-500', 'green-500', 'purple-500', 'pink-500', 'yellow-500', 'red-500', 'orange-500', 'teal-500'];

const bgColorMap: { [key: string]: string } = {
    'blue-500': 'bg-blue-500',
    'green-500': 'bg-green-500',
    'purple-500': 'bg-purple-500',
    'pink-500': 'bg-pink-500',
    'yellow-500': 'bg-yellow-500',
    'red-500': 'bg-red-500',
    'orange-500': 'bg-orange-500',
    'teal-500': 'bg-teal-500',
};

export const TaskDialog: React.FC<TaskDialogProps> = ({ isOpen, onClose, onSave, taskToEdit, projects = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [tags, setTags] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(TASK_COLORS[0]);
  const [errors, setErrors] = useState<{ title?: string; time?: string }>({});
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description);
            setProjectId(taskToEdit.projectId || '');
            setTags(taskToEdit.tags.join(', '));
            setTime(formatTimeForInput(taskToEdit.time));
            setNotes(taskToEdit.notes || '');
            setColor(taskToEdit.color);
        } else {
            resetForm();
        }
        setErrors({});
    }
  }, [taskToEdit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setProjectId('');
    setTags('');
    setTime('');
    setNotes('');
    setColor(TASK_COLORS[0]);
  };

  const formatTimeForInput = (seconds: number | null | undefined) => {
    // Handle null, undefined, NaN, or invalid values
    if (seconds == null || isNaN(seconds) || seconds <= 0) {
      return '';
    }
    
    // Ensure we have a valid integer
    const validSeconds = Math.floor(Number(seconds));
    
    const h = Math.floor(validSeconds / 3600);
    const m = Math.floor((validSeconds % 3600) / 60);
    const s = validSeconds % 60;
    let str = '';
    if (h > 0) str += `${h}h `;
    if (m > 0) str += `${m}m `;
    if (s > 0) str += `${s}s`;
    return str.trim();
  };

  const parseTimeToSeconds = (timeStr: string): number => {
    let totalSeconds = 0;
    const hoursMatches = timeStr.match(/(\d+)\s*h/gi) || [];
    hoursMatches.forEach(match => {
        totalSeconds += (parseInt(match, 10) || 0) * 3600;
    });
    const minutesMatches = timeStr.match(/(\d+)\s*m/gi) || [];
    minutesMatches.forEach(match => {
        totalSeconds += (parseInt(match, 10) || 0) * 60;
    });
    const secondsMatches = timeStr.match(/(\d+)\s*s/gi) || [];
    secondsMatches.forEach(match => {
        totalSeconds += (parseInt(match, 10) || 0);
    });
    return totalSeconds;
  };

  const validateForm = () => {
    const newErrors: { title?: string; time?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Task name is required.';
    }

    if (time.trim()) {
      const cleanedTime = time
        .replace(/(\d+(\.\d+)?)\s*h/gi, '')
        .replace(/(\d+(\.\d+)?)\s*m/gi, '')
        .replace(/(\d+(\.\d+)?)\s*s/gi, '')
        .replace(/\s/g, '');

      if (cleanedTime.length > 0 || /[^0-9.hms\s]/i.test(time)) {
        newErrors.time = 'Invalid format. Use "1h 30m 15s".';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSave = () => {
    if (!validateForm()) {
        return;
    }

    const newTaskData = {
      title,
      description,
      projectId: projectId || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      time: parseTimeToSeconds(time),
      color: color,
      notes,
    };
    onSave(newTaskData, taskToEdit?.id);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={taskToEdit ? 'Edit Task' : 'Add Task'}>
      <div className="space-y-4">
        {projects && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-1">
            <Label htmlFor="projectSelect">Project (optional)</Label>
            <select
              id="projectSelect"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
            >
              <option value="">No Project</option>
              {projects.filter(p => !p.isArchived).map(project => (
                <option key={project.id} value={project.id}>
                  {project.icon && '📁 '}{project.name}
                  {project.parentId && ' (Sub-project)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organize tasks by project for better tracking
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="taskName">Task Name</Label>
          <Input id="taskName" value={title} onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({...prev, title: undefined}));
          }} placeholder="e.g., Update Homepage" />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>
        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="description">Description (optional)</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Update hero section and navigation" />
        </div>
        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="time">Time Spent</Label>
          <Input id="time" value={time} onChange={(e) => {
              setTime(e.target.value);
              if (errors.time) setErrors(prev => ({...prev, time: undefined}));
          }} placeholder="e.g., 1h 30m 15s" />
          {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
        </div>
        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., UI, Design" />
        </div>
        <fieldset className="grid grid-cols-1 gap-1">
            <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 mb-1">Color</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Task color selection">
                {TASK_COLORS.map(c => (
                    <button
                        key={c}
                        type="button"
                        aria-label={`Select color ${c.split('-')[0]}`}
                        aria-pressed={color === c}
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full ${bgColorMap[c] || 'bg-slate-500'} transition-transform transform hover:scale-110 focus:outline-none ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''}`}
                    />
                ))}
            </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="min-h-[100px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
            />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>{taskToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </Dialog>
  );
};
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Button, Dialog, Input, Label } from './ui';
import { Icon } from './icons';

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'taskCount' | 'totalTime'>, id?: string) => void;
  projectToEdit: Project | null;
  projects: Project[]; // For parent selection
}

const PROJECT_COLORS = ['blue-500', 'green-500', 'purple-500', 'pink-500', 'yellow-500', 'red-500', 'orange-500', 'teal-500'];
const PROJECT_ICONS = ['Briefcase', 'Code', 'Palette', 'Book', 'Zap', 'Target', 'Rocket', 'Heart'];

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

export const ProjectDialog: React.FC<ProjectDialogProps> = ({ isOpen, onClose, onSave, projectToEdit, projects }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);
  const [parentId, setParentId] = useState<string>('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isOpen) {
        if (projectToEdit) {
            setName(projectToEdit.name);
            setDescription(projectToEdit.description || '');
            setColor(projectToEdit.color || PROJECT_COLORS[0]);
            setIcon(projectToEdit.icon || PROJECT_ICONS[0]);
            setParentId(projectToEdit.parentId || '');
        } else {
            resetForm();
        }
        setErrors({});
    }
  }, [projectToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor(PROJECT_COLORS[0]);
    setIcon(PROJECT_ICONS[0]);
    setParentId('');
  };

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
        return;
    }

    const projectData = {
      name,
      description,
      color,
      icon,
      parentId: parentId || null,
      isArchived: projectToEdit?.isArchived || false
    };
    
    onSave(projectData, projectToEdit?.id);
    onClose();
  };

  // Filter out current project and its descendants to prevent circular references
  const availableParentProjects = projects.filter(p => {
    if (!projectToEdit) return true;
    if (p.id === projectToEdit.id) return false;
    // TODO: Check descendants recursively
    return true;
  });

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={projectToEdit ? 'Edit Project' : 'New Project'}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="projectName">Project Name</Label>
          <Input 
            id="projectName" 
            value={name} 
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({...prev, name: undefined}));
            }} 
            placeholder="e.g., Website Redesign" 
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="projectDescription">Description (optional)</Label>
          <textarea
            id="projectDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this project..."
            className="min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 gap-1">
          <Label htmlFor="parentProject">Parent Project (optional)</Label>
          <select
            id="parentProject"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
          >
            <option value="">None (Top Level)</option>
            {availableParentProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create sub-projects by selecting a parent
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-1">
                {PROJECT_ICONS.map(iconName => (
                    <button
                        key={iconName}
                        type="button"
                        aria-label={`Select icon ${iconName}`}
                        onClick={() => setIcon(iconName)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 focus:outline-none ${
                          icon === iconName 
                            ? 'bg-indigo-500 text-white ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        <Icon name={iconName} className="w-5 h-5" />
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 gap-1">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
                {PROJECT_COLORS.map(c => (
                    <button
                        key={c}
                        type="button"
                        aria-label={`Select color ${c.split('-')[0]}`}
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full ${bgColorMap[c] || 'bg-slate-500'} transition-transform transform hover:scale-110 focus:outline-none ${
                          color === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''
                        }`}
                    />
                ))}
            </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>{projectToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </Dialog>
  );
};


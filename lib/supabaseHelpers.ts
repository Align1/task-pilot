import { supabase } from './supabase';
import { Task, Project, User } from '../types';

// ====== AUTH HELPERS ======

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      uid: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      photoURL: profile.photo_url || `https://picsum.photos/seed/${profile.display_name}/100`,
      subscription: {
        tier: profile.subscription_tier as any,
        status: profile.subscription_status as any,
      },
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ====== TASK HELPERS ======

export async function fetchTasks(userId: string, page = 1, limit = 20): Promise<{ tasks: Task[]; totalCount: number }> {
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get tasks with pagination
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const tasks: Task[] = (data || []).map(row => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    time: Number(row.time) || 0,
    color: row.color || undefined,
    tags: row.tags ? (Array.isArray(row.tags) ? row.tags : []) : [],
    notes: row.notes || undefined,
    projectId: row.project_id || undefined,
    createdAt: row.created_at,
  }));

  return {
    tasks,
    totalCount: count || 0,
  };
}

export async function createTask(userId: string, task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title || '',
      description: task.description || null,
      time: task.time || 0,
      color: task.color || null,
      tags: task.tags || null,
      notes: task.notes || null,
      project_id: task.projectId || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    time: Number(data.time) || 0,
    color: data.color || undefined,
    tags: data.tags || [],
    notes: data.notes || undefined,
    projectId: data.project_id || undefined,
    createdAt: data.created_at,
  };
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: updates.title,
      description: updates.description || null,
      time: updates.time,
      color: updates.color || null,
      tags: updates.tags || null,
      notes: updates.notes || null,
      project_id: updates.projectId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    time: Number(data.time) || 0,
    color: data.color || undefined,
    tags: data.tags || [],
    notes: data.notes || undefined,
    projectId: data.project_id || undefined,
    createdAt: data.created_at,
  };
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

// ====== PROJECT HELPERS ======

export async function fetchProjects(userId: string, includeArchived = false): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*, tasks(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Calculate total time for each project
  const projectsWithStats = await Promise.all(
    (data || []).map(async (proj) => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('time')
        .eq('project_id', proj.id);

      const totalTime = (tasks || []).reduce((sum, task) => sum + (Number(task.time) || 0), 0);

      return {
        id: proj.id,
        name: proj.name,
        description: proj.description || undefined,
        color: proj.color || undefined,
        icon: proj.icon || undefined,
        taskCount: proj.tasks?.[0]?.count || 0,
        totalTime,
        parentId: proj.parent_id || undefined,
        isArchived: proj.is_archived || false,
        children: undefined,
      };
    })
  );

  return projectsWithStats;
}

export async function createProject(userId: string, project: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: project.name || '',
      description: project.description || null,
      color: project.color || null,
      icon: project.icon || null,
      parent_id: project.parentId || null,
      is_archived: project.isArchived || false,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    color: data.color || undefined,
    icon: data.icon || undefined,
    taskCount: 0,
    totalTime: 0,
    parentId: data.parent_id || undefined,
    isArchived: data.is_archived || false,
  };
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: updates.name,
      description: updates.description || null,
      color: updates.color || null,
      icon: updates.icon || null,
      parent_id: updates.parentId || null,
      is_archived: updates.isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;

  // Get task count and total time
  const { data: tasks } = await supabase
    .from('tasks')
    .select('time')
    .eq('project_id', projectId);

  const totalTime = (tasks || []).reduce((sum, task) => sum + (Number(task.time) || 0), 0);

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    color: data.color || undefined,
    icon: data.icon || undefined,
    taskCount: tasks?.length || 0,
    totalTime,
    parentId: data.parent_id || undefined,
    isArchived: data.is_archived || false,
  };
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}


# App.tsx Supabase Migration Patch

## Instructions:
Replace the indicated sections in App.tsx with the code below.

---

## SECTION 1: Replace handleAuthSuccess (around line 384-396)

**FIND and REPLACE:**
```typescript
const handleAuthSuccess = (data: { token: string, refreshToken: string, expiresIn: number, user: User }) => {
    const expiryTime = Date.now() + (data.expiresIn * 1000);
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setTokenExpiry(expiryTime);
    setUser(data.user);
  };
```

**WITH:**
```typescript
const handleAuthSuccess = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };
```

---

## SECTION 2: Replace handleLogout (around line 398-443)

**FIND and REPLACE:**
```typescript
const handleLogout = async () => {
    // Save active timer data before logging out
    if (activeTaskId) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask && token) {
        try {
          await apiFetch(`/tasks/${activeTaskId}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: activeTask.title,
              description: activeTask.description,
              time: activeTask.time,
              color: activeTask.color,
              tags: activeTask.tags,
              notes: activeTask.notes
            })
          });
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
    
    // Clear all localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTaskId');
    
    // Reset all state
    setToken(null);
    setRefreshToken(null);
    setTokenExpiry(null);
    setUser(null);
    setTasks([]);
    setActiveTaskId(null);
    
    addToast("You've been logged out.", 'info');
  };
```

**WITH:**
```typescript
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
```

---

## SECTION 3: REMOVE these functions entirely (lines 265-378)
- `refreshAccessToken()`
- `apiFetch()`

These are no longer needed with Supabase.

---

## SECTION 4: Replace fetchTasks (around line 445-481)

**FIND and REPLACE:**
```typescript
const fetchTasks = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      const result = await apiFetch(`/tasks?page=${page}&limit=${limit}`);
      const response = {
        items: result.tasks || [],
        pagination: result.pagination || {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasMore: false
        }
      };
      
      // Append tasks if loading more (page > 1), otherwise replace
      if (page > 1) {
        setTasks(prev => [...prev, ...response.items]);
      } else {
        setTasks(response.items);
      }
      
      return response;
    } catch (error: any) {
      addToast(`Could not load tasks: ${error.message}`, 'error');
      if (error.message.toLowerCase().includes('token')) {
        handleLogout();
      }
      throw error;
    }
  }, [apiFetch, addToast]);
```

**WITH:**
```typescript
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
```

---

## SECTION 5: Replace fetchProjects (around line 485-493)

**FIND and REPLACE:**
```typescript
const fetchProjects = useCallback(async () => {
    try {
      const fetchedProjects = await apiFetch('/projects');
      setProjects(fetchedProjects || []);
    } catch (error: any) {
      addToast(`Could not load projects: ${error.message}`, 'error');
    }
  }, [apiFetch, addToast]);
```

**WITH:**
```typescript
const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const fetchedProjects = await fetchProjectsFromSupabase(user.uid);
      setProjects(fetchedProjects);
    } catch (error: any) {
      addToast(`Could not load projects: ${error.message}`, 'error');
    }
  }, [user, addToast]);
```

---

## SECTION 6: Replace auth check useEffect (around line 495-545)

**FIND and REPLACE:**
```typescript
useEffect(() => {
    if (token) {
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
  }, [token, fetchTasks, fetchProjects]);

  // Automatic token refresh and expiration warning
  useEffect(() => {
    if (!token || !tokenExpiry) return;

    const checkTokenExpiry = () => {
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;

      // Refresh token 5 minutes before expiration (300000 ms)
      if (timeUntilExpiry <= 300000 && timeUntilExpiry > 0) {
        refreshAccessToken().catch(() => {
          addToast('Session expiring soon. Please save your work.', 'info');
        });
      }

      // Show warning 2 minutes before expiration (120000 ms)
      if (timeUntilExpiry <= 120000 && timeUntilExpiry > 60000) {
        addToast('Your session will expire in 2 minutes.', 'info');
      }

      // Token has expired
      if (timeUntilExpiry <= 0) {
        addToast('Your session has expired. Logging out...', 'error');
        setTimeout(() => handleLogout(), 2000);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);

    return () => clearInterval(interval);
  }, [token, tokenExpiry, refreshAccessToken, addToast]);
```

**WITH:**
```typescript
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
```

---

## Next: Search for all `apiFetch` calls in the file and replace them with Supabase helpers

Use find/replace for these patterns:
- `await apiFetch('/tasks', { method: 'POST', body: ... })` → `await createTaskInSupabase(user.uid, taskData)`
- `await apiFetch(\`/tasks/\${taskId}\`, { method: 'PUT', body: ... })` → `await updateTaskInSupabase(taskId, updates)`
- `await apiFetch(\`/tasks/\${taskId}\`, { method: 'DELETE' })` → `await deleteTaskFromSupabase(taskId)`
- Similar for projects

---

## Finally: Update the render section

**FIND:**
```typescript
if (!token) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }
```

**REPLACE WITH:**
```typescript
if (isLoadingUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }
```


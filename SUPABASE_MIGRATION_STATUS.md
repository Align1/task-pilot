# 🔄 Supabase Migration Status

## ✅ Completed Steps

### 1. Supabase Setup
- ✅ Created Supabase client configuration (`lib/supabase.ts`)
- ✅ Created database helper functions (`lib/supabaseHelpers.ts`)
- ✅ Installed `@supabase/supabase-js` package
- ✅ Updated `env.example` with Supabase credentials

### 2. Authentication Refactor
- ✅ Refactored `components/Auth.tsx` to use Supabase Auth
- ⚠️ **Auth.tsx now expects:** `onAuthSuccess: (user: User) => void` instead of token data

## ⏳ In Progress

### 3. App.tsx Refactoring
Large file with many interdependencies. Needs systematic replacement:

#### Changes Needed:
1. **Remove JWT State** (Lines 218-223) - DONE ✅
   - Removed: `token`, `refreshToken`, `tokenExpiry`
   - Added: `isLoadingUser`

2. **Remove JWT Functions** (Lines 265-388)
   - Need to remove: `refreshAccessToken()`, `apiFetch()`
   - Replace with: Direct Supabase calls via helpers

3. **Replace handleAuthSuccess** (Lines ~392-402)
   ```typescript
   // OLD:
   const handleAuthSuccess = (data: { token, refreshToken, user }) => { ... }
   
   // NEW:
   const handleAuthSuccess = (user: User) => {
     setUser(user);
     localStorage.setItem('user', JSON.stringify(user));
   };
   ```

4. **Replace handleLogout** (Lines ~404-449)
   ```typescript
   // OLD: Clear tokens, etc.
   
   // NEW:
   const handleLogout = async () => {
     // Save active timer if needed
     if (activeTaskId && user) {
       const activeTask = tasks.find(t => t.id === activeTaskId);
       if (activeTask) {
         try {
           await updateTaskInSupabase(activeTaskId, activeTask);
         } catch (error) {
           console.error('Failed to save timer:', error);
         }
       }
     }

     // Clear timer
     if (timerIntervalRef.current) {
       clearInterval(timerIntervalRef.current);
       timerIntervalRef.current = undefined;
     }

     // Sign out from Supabase
     await signOut();
     
     // Clear state
     setUser(null);
     setTasks([]);
     setProjects([]);
     setActiveTaskId(null);
     localStorage.clear();
     
     addToast("You've been logged out.", 'info');
   };
   ```

5. **Replace fetchTasks** (Lines ~452-481)
   ```typescript
   const fetchTasks = useCallback(async (page: number = 1, limit: number = 20) => {
     if (!user) return;
     
     try {
       const { tasks: newTasks, totalCount } = await fetchTasksFromSupabase(user.uid, page, limit);
       
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

6. **Replace fetchProjects** (Lines ~486-493)
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

7. **Add Supabase Session Check** (Replace lines ~495-545)
   ```typescript
   // Check auth on mount
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

     // Listen for auth changes
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

   // Load data when user logs in
   useEffect(() => {
     if (user) {
       const fetchInitialData = async () => {
         try {
           await Promise.all([
             fetchTasks(1, 20),
             fetchProjects()
           ]);
         } catch (error: any) {
           // Errors already handled
         }
       };
       fetchInitialData();
     }
   }, [user, fetchTasks, fetchProjects]);
   ```

8. **Replace CRUD Operations**
   - **handleAddTask**: Use `createTaskInSupabase(user.uid, task)`
   - **handleUpdateTask**: Use `updateTaskInSupabase(taskId, updates)`
   - **handleDeleteTask**: Use `deleteTaskFromSupabase(taskId)`
   - **handleAddProject**: Use `createProjectInSupabase(user.uid, project)`
   - **handleUpdateProject**: Use `updateProjectInSupabase(projectId, updates)`
   - **handleDeleteProject**: Use `deleteProjectFromSupabase(projectId)`

## 📋 Next Steps

### Immediate (Critical):
1. Complete App.tsx refactoring (in progress)
2. Test authentication flow
3. Test task/project CRUD operations

### Then:
4. Remove Express backend files (server.js, etc.)
5. Clean up package.json dependencies
6. Update Vercel with Supabase environment variables
7. Deploy to Vercel

## 🎯 Environment Variables Needed

Add to your `.env` file:
```env
VITE_SUPABASE_URL=https://ezqaqqbseabrtbvuovnh.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Then add the same to Vercel:
1. Vercel Dashboard → Settings → Environment Variables
2. Add both variables
3. Redeploy

## ⚠️ Breaking Changes

1. **Auth callback changed**: Auth component now calls `onAuthSuccess(user)` instead of `onAuthSuccess({token, refreshToken, user})`
2. **No more JWT tokens**: All auth handled by Supabase sessions
3. **No more API_URL**: All data operations use Supabase client directly

## 📝 Testing Checklist

After migration:
- [ ] Can sign up new account
- [ ] Can login
- [ ] Can create tasks
- [ ] Can update tasks
- [ ] Can delete tasks
- [ ] Can create projects
- [ ] Can update projects
- [ ] Can delete projects
- [ ] Timer works correctly
- [ ] Logout works
- [ ] Session persists on refresh



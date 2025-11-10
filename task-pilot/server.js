// server.js
// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// --- Security Configuration ---
// JWT_SECRET is REQUIRED and must be strong
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '1h'; // Access token expires in 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token expires in 7 days

// Validate JWT_SECRET before starting server
function validateSecretKey() {
  if (!JWT_SECRET) {
    console.error('\n❌ CRITICAL SECURITY ERROR: JWT_SECRET is not set!\n');
    console.error('🔒 Security Requirements:');
    console.error('   • JWT_SECRET environment variable is REQUIRED');
    console.error('   • Must be at least 32 characters long');
    console.error('   • Should be cryptographically random\n');
    console.error('💡 How to fix:');
    console.error('   1. Create a .env file in the project root');
    console.error('   2. Add: JWT_SECRET=your_secure_random_string_here');
    console.error('   3. Generate a secure secret with Node.js:');
    console.error('      node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    console.error('📖 See .env.example for reference\n');
    process.exit(1);
  }

  if (JWT_SECRET.length < 32) {
    console.error('\n⚠️  SECURITY WARNING: JWT_SECRET is too short!\n');
    console.error('🔒 Current length:', JWT_SECRET.length, 'characters');
    console.error('✅ Required length: At least 32 characters\n');
    console.error('💡 Generate a secure secret:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    process.exit(1);
  }

  // Warn about common weak secrets
  const weakSecrets = [
    'secret',
    'your-secret-key',
    'your-super-secret-key',
    'your-super-secret-key-that-should-be-in-env',
    'mysecret',
    'jwt-secret',
    'change-me',
    'changeme',
    'default',
    '123456'
  ];

  if (weakSecrets.some(weak => JWT_SECRET.toLowerCase().includes(weak))) {
    console.error('\n⚠️  SECURITY WARNING: JWT_SECRET appears to be a default/weak value!\n');
    console.error('🔒 Never use default or predictable secrets in production.\n');
    console.error('💡 Generate a secure secret:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    process.exit(1);
  }

  console.log('✅ JWT_SECRET validated successfully');
}

// Run validation before starting server
validateSecretKey();

const SECRET_KEY = JWT_SECRET;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Add user payload to request
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token is not valid' });
  }
};


// --- Helper to format user object for frontend ---
const formatUserForFrontend = (prismaUser) => {
    if (!prismaUser) return null;
    return {
        uid: prismaUser.id,
        email: prismaUser.email,
        displayName: prismaUser.displayName,
        photoURL: prismaUser.photoURL,
        subscription: {
            tier: prismaUser.subscriptionTier,
            status: prismaUser.subscriptionStatus
        }
    };
};

// --- Helper to safely parse time from string to number ---
const parseTimeToNumber = (timeValue) => {
    // Handle null, undefined, or empty string
    if (timeValue == null || timeValue === '') {
        return 0;
    }
    
    // Convert to string and parse
    const parsed = parseInt(String(timeValue), 10);
    
    // Return 0 if NaN or negative, otherwise return the parsed value
    return (isNaN(parsed) || parsed < 0) ? 0 : parsed;
};

// --- API Routes ---

// Public Routes
app.get('/api', (req, res) => {
  res.status(200).send('Hello from the API!');
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = await prisma.user.create({
        data: {
            email,
            passwordHash,
            displayName,
            photoURL: `https://picsum.photos/seed/${encodeURIComponent(displayName)}/100`,
        }
    });

    const tokenPayload = { id: newUser.id, email: newUser.email };
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
    const refreshToken = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
    
    res.status(201).json({ 
        token, 
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
        user: formatUserForFrontend(newUser)
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const tokenPayload = { id: user.id, email: user.email };
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
        const refreshToken = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });

        res.status(200).json({
            token,
            refreshToken,
            expiresIn: 3600, // 1 hour in seconds
            user: formatUserForFrontend(user)
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Token Refresh Route
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, SECRET_KEY);
        
        // Check if user still exists
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new tokens
        const tokenPayload = { id: user.id, email: user.email };
        const newToken = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
        const newRefreshToken = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });

        res.status(200).json({
            token: newToken,
            refreshToken: newRefreshToken,
            expiresIn: 3600, // 1 hour in seconds
            user: formatUserForFrontend(user)
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }
        console.error('Token Refresh Error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
});

// Protected Routes
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalCount = await prisma.task.count({
            where: { userId: req.user.id }
        });

        // Fetch paginated tasks
    const userTasks = await prisma.task.findMany({
        where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: limit
        });
        
        // Convert data types for frontend
        const formattedTasks = userTasks.map(task => ({
            ...task,
            time: parseTimeToNumber(task.time),
            tags: task.tags ? JSON.parse(task.tags) : []
        }));
        
        // Return with pagination metadata
        res.json({
            tasks: formattedTasks,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: skip + userTasks.length < totalCount
            }
        });
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { title, description, time, color, tags, notes, projectId } = req.body;
        const newTask = await prisma.task.create({
            data: {
                userId: req.user.id,
                projectId: projectId || null,
                title,
                description,
                time: time ? String(time) : null,
                color,
                tags: tags ? JSON.stringify(tags) : null,
                notes
            }
        });
        
        // Convert back to frontend format
        const formattedTask = {
            ...newTask,
            time: parseTimeToNumber(newTask.time),
            tags: newTask.tags ? JSON.parse(newTask.tags) : []
        };
        
        res.status(201).json(formattedTask);
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ message: 'Server error creating task' });
    }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findFirst({
            where: { id: id, userId: req.user.id }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }

        const { title, description, time, color, tags, notes, projectId } = req.body;
        const updatedTask = await prisma.task.update({
            where: { id: id },
            data: { 
                title, 
                description, 
                time: time !== undefined ? String(time) : undefined,
                color, 
                tags: tags ? JSON.stringify(tags) : undefined,
                notes,
                projectId: projectId !== undefined ? (projectId || null) : undefined
            }
        });

        // Convert back to frontend format
        const formattedTask = {
            ...updatedTask,
            time: parseTimeToNumber(updatedTask.time),
            tags: updatedTask.tags ? JSON.parse(updatedTask.tags) : []
        };

        res.json(formattedTask);
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ message: 'Server error updating task' });
    }
});


app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await prisma.task.deleteMany({
             where: { id: id, userId: req.user.id }
        });
        
        if (result.count === 0) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        
        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({ message: 'Server error deleting task' });
    }
});

// --- Project Routes ---
app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        
        const projects = await prisma.project.findMany({
            where: {
                userId: req.user.id,
                ...(includeArchived ? {} : { isArchived: false })
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        // Get task counts and total time for each project
        const projectsWithStats = await Promise.all(projects.map(async (project) => {
            const tasks = await prisma.task.findMany({
                where: { projectId: project.id },
                select: { time: true }
            });

            const totalTime = tasks.reduce((sum, task) => {
                return sum + parseTimeToNumber(task.time);
            }, 0);

            return {
                ...project,
                taskCount: project._count.tasks,
                totalTime,
                children: undefined // Will be populated in frontend if needed
            };
        }));

        res.json(projectsWithStats);
    } catch (error) {
        console.error('Get Projects Error:', error);
        res.status(500).json({ message: 'Server error fetching projects' });
    }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
        const { name, description, color, icon, parentId } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const newProject = await prisma.project.create({
            data: {
                userId: req.user.id,
                name,
                description: description || null,
                color: color || null,
                icon: icon || null,
                parentId: parentId || null
            }
        });

        res.status(201).json({
            ...newProject,
            taskCount: 0,
            totalTime: 0
        });
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ message: 'Server error creating project' });
    }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await prisma.project.findFirst({
            where: { id: id, userId: req.user.id }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        const { name, description, color, icon, parentId, isArchived } = req.body;

        const updatedProject = await prisma.project.update({
            where: { id: id },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined,
                color: color !== undefined ? color : undefined,
                icon: icon !== undefined ? icon : undefined,
                parentId: parentId !== undefined ? parentId : undefined,
                isArchived: isArchived !== undefined ? isArchived : undefined
            }
        });

        res.json(updatedProject);
    } catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({ message: 'Server error updating project' });
    }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await prisma.project.findFirst({
            where: { id: id, userId: req.user.id }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found or unauthorized' });
        }

        // Delete project (tasks will have projectId set to null due to onDelete: SetNull)
        await prisma.project.delete({
            where: { id: id }
        });

        res.status(200).json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Delete Project Error:', error);
        res.status(500).json({ message: 'Server error deleting project' });
    }
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
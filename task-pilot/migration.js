// Migration script to convert existing tasks to project-based structure
// Run this AFTER running: npx prisma migrate dev --name add_projects

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateExistingTasksToProjects() {
  console.log('🔄 Starting migration of existing tasks to projects...\n');

  try {
    // Get all tasks
    const tasks = await prisma.task.findMany({
      include: { user: true }
    });

    if (tasks.length === 0) {
      console.log('✅ No tasks to migrate. You can delete this script.\n');
      return;
    }

    console.log(`📊 Found ${tasks.length} tasks to process\n`);

    // Group tasks by userId and title (old project name)
    const projectMap = new Map();
    const tasksByUserAndTitle = new Map();

    tasks.forEach(task => {
      const key = `${task.userId}-${task.title}`;
      if (!tasksByUserAndTitle.has(key)) {
        tasksByUserAndTitle.set(key, []);
      }
      tasksByUserAndTitle.get(key).push(task);
    });

    console.log(`📁 Identified ${tasksByUserAndTitle.size} unique project names\n`);

    let projectCount = 0;
    let taskCount = 0;

    // Create projects and update tasks
    for (const [key, tasksGroup] of tasksByUserAndTitle.entries()) {
      const firstTask = tasksGroup[0];
      const projectName = firstTask.title;
      const userId = firstTask.userId;

      // Create project from task title
      const project = await prisma.project.create({
        data: {
          userId: userId,
          name: projectName,
          description: `Migrated from existing tasks`,
          color: firstTask.color || 'blue-500',
          icon: 'Briefcase'
        }
      });

      projectMap.set(key, project.id);
      projectCount++;

      console.log(`✅ Created project: "${projectName}" (${tasksGroup.length} tasks)`);

      // Update all tasks in this group
      for (const task of tasksGroup) {
        // Use description as new task name, fallback to "Task"
        const newTitle = task.description || `${projectName} - Task`;
        
        await prisma.task.update({
          where: { id: task.id },
          data: {
            projectId: project.id,
            title: newTitle,
            description: newTitle === task.description ? null : task.description
          }
        });

        taskCount++;
      }
    }

    console.log('\n✨ Migration complete!\n');
    console.log(`📈 Statistics:`);
    console.log(`   • Projects created: ${projectCount}`);
    console.log(`   • Tasks migrated: ${taskCount}`);
    console.log(`   • Users affected: ${new Set(tasks.map(t => t.userId)).size}\n`);
    console.log('✅ All existing tasks now have projects!\n');
    console.log('🎯 Next steps:');
    console.log('   1. Restart your server: node server.js');
    console.log('   2. Refresh your frontend');
    console.log('   3. Verify projects in Dashboard\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure Prisma migration ran first:');
    console.error('      npx prisma migrate dev --name add_projects');
    console.error('   2. Check database connection');
    console.error('   3. Restore backup if needed:\n');
    console.error('      cp prisma/dev.db.backup prisma/dev.db\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateExistingTasksToProjects()
  .then(() => {
    console.log('👋 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


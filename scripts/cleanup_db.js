const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log('Starting database cleanup...');

    try {
        // Order matters because of foreign keys
        // Feedback belongs to User
        // Report belongs to User and Topic
        // Topic is parent of Report

        console.log('Deleting Feedbacks...');
        await prisma.feedback.deleteMany({});

        console.log('Deleting Reports...');
        await prisma.report.deleteMany({});

        console.log('Deleting Topics...');
        await prisma.topic.deleteMany({});

        console.log('Cleanup complete. User accounts preserved.');

        const userCount = await prisma.user.count();
        console.log(`Remaining users: ${userCount}`);

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();

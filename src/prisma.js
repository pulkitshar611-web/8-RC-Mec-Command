const { PrismaClient } = require('@prisma/client');

// Use DATABASE_URL from environment OR reconstruct it from individual DB_ variables
const dbUrl = process.env.DATABASE_URL ||
    `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl,
        },
    },
});

try {
    const urlParts = dbUrl.split('@');
    const hostInfo = urlParts[urlParts.length - 1] || 'unknown';
    console.log(`Prisma Client initialized targeting: ${hostInfo}`);
} catch (e) {
    console.log('Prisma Client initialized with an encrypted URL');
}

module.exports = prisma;

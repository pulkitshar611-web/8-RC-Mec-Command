const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- REPORTS ---");
        const reports = await prisma.report.findMany({
            include: { user: true }
        });
        console.log(JSON.stringify(reports, null, 2));

        console.log("\n--- TOPICS ---");
        const topics = await prisma.topic.findMany({
            include: { reports: true }
        });
        console.log(JSON.stringify(topics, null, 2));
    } catch (err) {
        console.error("DB Error:", err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

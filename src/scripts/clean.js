const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('--- SYSTEM PURGE INITIATED (PRESERVING USERS) ---');
    console.log('Clearing operational data (Reports, Topics, Feedbacks)...');

    // Delete functional data but keep Users
    await prisma.feedback.deleteMany();
    await prisma.report.deleteMany();
    await prisma.topic.deleteMany();

    // We can also reset stats in SystemSettings without deleting the record
    await prisma.systemSettings.updateMany({
        data: {
            personnelScore: 100.0,
            fleetScore: 100.0,
            supplyScore: 100.0
        }
    });

    console.log('--- PURGE COMPLETE ---');
    console.log('All reports and topics removed. User accounts preserved.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

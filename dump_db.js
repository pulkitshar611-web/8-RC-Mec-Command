const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const models = ['user', 'report', 'topic', 'feedback'];

    let sql = "";

    for (const modelName of models) {
        // Prisma client model names are camelCase (e.g. prisma.user)
        const data = await prisma[modelName].findMany();

        // Capitalize for SQL table name assumption (User, Report, etc.)
        // Note: Adjust if your actual table names differ (e.g. lowercase)
        const tableName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

        sql += `-- Data for ${tableName}\n`;

        for (const row of data) {
            const keys = Object.keys(row);
            const cols = keys.join(', ');

            const vals = keys.map(k => {
                const val = row[k];
                if (val === null) return 'NULL';
                if (typeof val === 'number') return val;
                if (typeof val === 'boolean') return val ? 1 : 0;
                if (val instanceof Date) return `'${val.toISOString()}'`;
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
                return `'${JSON.stringify(val)}'`; // Fallback
            }).join(', ');

            sql += `INSERT INTO ${tableName} (${cols}) VALUES (${vals});\n`;
        }
        sql += "\n";
    }

    fs.writeFileSync('dev_db.sql', sql);
    console.log('Database dump created at dev_db.sql');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Seeding database...');

    // Clear existing data (though --force-reset did it, just in case)
    await prisma.feedback.deleteMany();
    await prisma.report.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemSettings.deleteMany();

    // Create Admin
    const adminEmail = 'admin@example.com';
    const adminPassword = await bcrypt.hash('admin123', 8);

    const admin = await prisma.user.create({
        data: {
            id: 1,
            email: adminEmail,
            name: 'Commander Shepard',
            password: adminPassword,
            role: 'ADMIN',
            avatar: 'https://i.pravatar.cc/150?u=admin'
        },
    });
    console.log({ admin });

    // Create Staff
    const staffEmail = 'staff@example.com';
    const staffPassword = await bcrypt.hash('staff123', 8);

    const staff = await prisma.user.create({
        data: {
            id: 2,
            email: staffEmail,
            name: 'Pvt. Jenkins',
            password: staffPassword,
            role: 'STAFF',
            avatar: 'https://i.pravatar.cc/150?u=staff'
        },
    });
    console.log({ staff });

    // Create Topics
    const topics = [
        {
            id: 1,
            title: 'Manutenção de Viaturas - Esquadrão B',
            impactType: 'Segurança',
            aiSummary: 'Falhas hidráulicas recorrentes nas viaturas do Esquadrão B. Possível descuido na manutenção preventiva identificado no Setor 4.',
            suggestions: JSON.stringify([
                { text: 'Aumentar frequência de verificação de pressão', author: 'Sgt. Oliveira' },
                { text: 'Substituir kits de vedação das unidades do Setor 4' },
                { text: 'Upgrade para fluido de alta performance', author: 'Cb. Mendes' }
            ]),
            priority: 'high',
            status: 'validated',
        },
        {
            id: 2,
            title: 'Falha de Comunicação - Ala Norte',
            impactType: 'Eficiência',
            aiSummary: 'Atenuação de sinal reportada durante horários de pico operacional. Provável interferência de redes externas.',
            suggestions: JSON.stringify([
                { text: 'Instalar repetidores de sinal a cada 50m' },
                { text: 'Mudar para frequência criptografada 7', author: 'Ten. Costa' },
                { text: 'Reorientar antenas das torres de guarda' }
            ]),
            priority: 'medium',
            status: 'validated',
        },
        {
            id: 3,
            title: 'Atraso no Suprimento Médico',
            impactType: 'Moral',
            aiSummary: 'Atraso na distribuição de kits de trauma primário. Erro de sincronização no sistema de inventário da enfermaria.',
            suggestions: JSON.stringify([
                { text: 'Autorizar distribuição manual de emergência', author: 'Maj. Rocha' },
                { text: 'Reiniciar logs de sincronização do banco de dados' },
                { text: 'Aumentar estoque de kits nas zonas de deslocamento rápido' }
            ]),
            priority: 'high',
            status: 'priority_alert',
        },
        {
            id: 4,
            title: 'Erro de Protocolo - Reserva de Armamento',
            impactType: 'Segurança',
            aiSummary: 'Desalinhamento do sensor no portão biométrico. Rejeição incorreta de pessoal autorizado detectada.',
            suggestions: JSON.stringify([
                { text: 'Recalibrar sensores biométricos' },
                { text: 'Implementar protocolo temporário de liberação manual', author: 'Subten. Almeida' },
                { text: 'Atualizar logs de acesso de pessoal' }
            ]),
            priority: 'low',
            status: 'validated',
        }
    ];

    for (const t of topics) {
        await prisma.topic.create({
            data: {
                id: t.id,
                title: t.title,
                aiSummary: t.aiSummary,
                status: t.status,
                suggestions: t.suggestions,
                priority: t.priority,
                impactType: t.impactType,
                // Create a dummy report to link (so count > 0)
                reports: {
                    create: {
                        id: t.id, // Using same id for simplicity in this seed
                        category: 'General',
                        subcategory: 'Issue',
                        description: 'Automated report for topic ' + t.title,
                        priority: t.priority === 'high' ? 'High' : 'Low',
                        userId: staff.id
                    }
                }
            }
        });
    }

    // Default settings
    await prisma.systemSettings.create({
        data: {
            id: 1,
            institutionName: "8º Regimento de Cavalaria Mecanizado",
            personnelScore: 45.0,
            fleetScore: 68.0,
            supplyScore: 92.0
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

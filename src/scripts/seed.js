const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Seeding database with comprehensive data...');

    // Clear existing data
    await prisma.feedback.deleteMany();
    await prisma.report.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemSettings.deleteMany();

    const salt = 8;
    const adminPassword = await bcrypt.hash('admin123', salt);
    const staffPassword = await bcrypt.hash('staff123', salt);

    // Create Users
    console.log('Creating users...');
    const users = [
        {
            id: 1,
            email: 'admin@example.com',
            name: 'Commander Shepard',
            password: adminPassword,
            role: 'ADMIN',
            rank: 'Ten Cel',
            status: 'Ativo',
            avatar: 'https://i.pravatar.cc/150?u=admin',
            phone: '555-0199',
            location: 'Comando de Regimento',
            unit: '8º RC Mec',
            sector: 'A-124'
        },
        {
            id: 4,
            email: 'admin@gmail.com',
            name: 'Admin User',
            password: await bcrypt.hash('123', salt),
            role: 'ADMIN',
            rank: 'Gen Ex',
            status: 'Ativo',
            avatar: 'https://i.pravatar.cc/150?u=admin2',
            phone: '555-0000',
            location: 'HQ',
            unit: '8º RC Mec',
            sector: 'ADM'
        },
        {
            id: 2,
            email: 'staff@example.com',
            name: 'Pvt. Jenkins',
            password: staffPassword,
            role: 'STAFF',
            rank: 'Sd EP',
            status: 'Ativo',
            avatar: 'https://i.pravatar.cc/150?u=staff',
            phone: '555-0101',
            location: '4º Esquadrão',
            unit: '8º RC Mec',
            sector: 'B-202'
        },
        {
            id: 3,
            email: 'sgt.oliveira@example.com',
            name: 'Sgt. Oliveira',
            password: staffPassword,
            role: 'STAFF',
            rank: '2º Sgt',
            status: 'Ativo',
            avatar: 'https://i.pravatar.cc/150?u=sgt',
            phone: '555-0155',
            location: 'Garagem de Viaturas',
            unit: '8º RC Mec',
            sector: 'V-10'
        }
    ];

    for (const u of users) {
        await prisma.user.create({ data: u });
    }

    // Create Topics
    console.log('Creating topics and reports...');
    const topicData = [
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
            status: 'validated'
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
            status: 'validated'
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
            status: 'priority_alert'
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
            status: 'validated'
        }
    ];

    for (const t of topicData) {
        await prisma.topic.create({
            data: {
                ...t,
                reports: {
                    create: [
                        {
                            category: 'Infraestrutura',
                            subcategory: 'Manutenção',
                            description: 'Relatório inicial identificando problemas em ' + t.title,
                            priority: t.priority === 'high' ? 'High' : (t.priority === 'medium' ? 'Medium' : 'Low'),
                            userId: 2,
                            status: 'Approved'
                        },
                        {
                            category: 'Operacional',
                            subcategory: 'Campo',
                            description: 'Confirmação de impacto em campo referente a ' + t.title,
                            priority: t.priority === 'high' ? 'High' : 'Low',
                            userId: 3,
                            status: 'Pending'
                        }
                    ]
                }
            }
        });
    }

    // Create Feedbacks
    console.log('Creating feedback...');
    await prisma.feedback.createMany({
        data: [
            { userId: 2, type: 'Notice', message: 'Manutenção da Viatura 102 concluída com sucesso.' },
            { userId: 3, type: 'Commendation', message: 'Excelente desempenho na coordenação da Ala Norte.' },
            { userId: 1, type: 'Notice', message: 'Reunião de comando agendada para amanhã às 08:00.' }
        ]
    });

    // Default settings
    console.log('Creating settings...');
    await prisma.systemSettings.create({
        data: {
            id: 1,
            institutionName: "8º Regimento de Cavalaria Mecanizado",
            personnelScore: 94.2,
            fleetScore: 82.5,
            supplyScore: 89.8,
            lightProtocol: true,
            aiTriage: true,
            emailNotifications: true
        }
    });

    console.log('Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

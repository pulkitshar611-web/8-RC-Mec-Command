const prisma = require('../prisma');

/**
 * Intelligent AI Triage & Consolidation Service
 * Groups incoming tactical reports into strategic topics for the Commander.
 */
exports.processReportWithAI = async (reportId) => {
    try {
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { user: true }
        });

        if (!report) return;

        console.log(`[Strategic AI] Analyzing report ${reportId}: "${report.description.substring(0, 50)}..."`);

        // 1. Determine Urgency & Priority
        let priority = report.priority.toLowerCase();
        const keywordsHigh = [
            'falta', 'grave', 'urgente', 'parado', 'crítico', 'sem', 'não há',
            'lack', 'no more', 'urgent', 'critical', 'missing', 'broken', 'failed'
        ];
        const descLower = report.description.toLowerCase();

        if (keywordsHigh.some(kw => descLower.includes(kw)) || priority === 'high') {
            priority = 'high';
        }

        // 2. Look for existing ACTIVE topic to consolidate
        // Search criteria: same category/subcategory and status is active (pending/validated/priority_alert)
        let topic = await prisma.topic.findFirst({
            where: {
                status: { in: ['pending', 'validated', 'priority_alert'] },
                reports: {
                    some: {
                        category: report.category,
                        subcategory: report.subcategory
                    }
                }
            },
            include: { reports: true }
        });

        if (topic) {
            console.log(`[Strategic AI] Consolidating Report ${reportId} into existing Topic ${topic.id}`);

            // Update topic with new data
            const totalReports = topic.reports.length + 1;

            // Re-evaluate priority: if more than 3 reports, elevate to high
            let newPriority = topic.priority;
            if (totalReports >= 3 || priority === 'high') {
                newPriority = 'high';
            }

            const newStatus = newPriority === 'high' ? 'priority_alert' : 'validated';

            // Append to AI Summary
            const updatedSummary = topic.aiSummary + `\n\n[Atualização ${new Date().toLocaleDateString('pt-BR')}]: Novo relato de ${report.user?.name || 'Militar'} confirma agravamento em ${report.subcategory}.`;

            topic = await prisma.topic.update({
                where: { id: topic.id },
                data: {
                    priority: newPriority,
                    status: newStatus,
                    aiSummary: updatedSummary
                }
            });
        } else {
            console.log(`[Strategic AI] Creating new Strategic Topic for Report ${reportId}`);

            // Create strategic title (Mocking AI extraction)
            // e.g., "Logística: Falta de Motoristas" if description contains "motoristas"
            let strategicTitle = `${report.category}: ${report.subcategory}`;
            if (descLower.includes('motorista') || descLower.includes('condutor') || descLower.includes('driver')) {
                strategicTitle = `Pessoal: Escassez de Motoristas / Drivers (1º Esqd)`;
            } else if (descLower.includes('manutenção') || descLower.includes('quebrado') || descLower.includes('maintenance') || descLower.includes('broken')) {
                strategicTitle = `Manutenção: Indisponibilidade de Meios / Maintenance`;
            }

            const status = priority === 'high' ? 'priority_alert' : 'validated';

            topic = await prisma.topic.create({
                data: {
                    title: strategicTitle,
                    aiSummary: `Análise Estratégica: Identificado novo ponto de atenção em ${report.category}. Relato inicial indica impacto direto em ${report.subcategory}. Recomendado monitoramento de recorrência para validação de padrão operacional.`,
                    status: status,
                    priority: priority,
                    impactType: report.category === 'Logística' ? 'Logística' :
                        report.category === 'Segurança' ? 'Segurança' :
                            report.category === 'Manutenção' ? 'Eficiência' : 'Moral',
                    suggestions: JSON.stringify([
                        { text: 'Avaliar redistribuição de recursos nas seções adjacentes', author: 'Consultor IA' },
                        { text: 'Solicitar relatório circunstanciado do S-4', author: 'Consultor IA' }
                    ])
                }
            });
        }

        // 3. Link report to topic
        await prisma.report.update({
            where: { id: report.id },
            data: { topicId: topic.id }
        });

        return topic;
    } catch (error) {
        console.error(`[AI Triage Error]`, error);
    }
};

const prisma = require('../prisma');

/**
 * Strategic AI Triage & Consolidation Service
 * 
 * Flow:
 *  1. Receives a newly created report ID
 *  2. Analyzes priority from keywords
 *  3. Finds an existing open topic in same CATEGORY (loose match) to consolidate into
 *     - Checks reports within topics
 *     - OR checks topic titles
 *     OR creates a new validated topic visible on Commander Dashboard
 *  4. Links the report to the topic
 *  5. Updates topic priority/status if escalation threshold is met
 */
exports.processReportWithAI = async (reportId) => {
    try {
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { user: true }
        });

        if (!report) {
            console.error(`[Strategic AI] Report #${reportId} NOT FOUND. Cannot process.`);
            return;
        }

        console.log(`[Strategic AI] ▶ START for Report #${reportId} | Category: "${report.category}" | User: ${report.user?.name || 'Unknown'}`);

        // ═══════════════════════════════════════════════════════
        // STEP 1: Priority Analysis (Portuguese + English keywords)
        // ═══════════════════════════════════════════════════════
        const descLower = (report.description || '').toLowerCase();

        const highPriorityKeywords = [
            // Portuguese
            'falta', 'sem ', 'não há', 'nao ha', 'escassez', 'insuficiente',
            'urgente', 'crítico', 'critico', 'grave', 'parado', 'paralisado',
            'quebrado', 'danificado', 'falha', 'falhou', 'emergência', 'emergencia',
            'acidente', 'ferido', 'lesão', 'lesao', 'perigo', 'risco',
            'impossível', 'impossivel', 'bloqueado', 'impedido',
            // English
            'no more', 'no drivers', 'missing', 'lack', 'critical', 'urgent',
            'broken', 'failed', 'emergency', 'danger', 'risk', 'injured',
            'not enough', 'insufficient', 'none left', 'out of', 'depleted'
        ];

        let priority = (report.priority || 'low').toLowerCase();
        const isHighUrgency = highPriorityKeywords.some(kw => descLower.includes(kw));

        if (isHighUrgency || priority === 'high' || priority === 'critical') {
            priority = 'high';
            console.log(`[Strategic AI] ⚠ High priority detected for Report #${reportId}`);
        }

        // ═══════════════════════════════════════════════════════
        // STEP 2: Smart Topic Title Generation
        // ═══════════════════════════════════════════════════════
        const generateStrategicTitle = (category, desc, subcategory) => {
            const d = desc.toLowerCase();

            // Personnel / Manpower
            if (d.includes('motorista') || d.includes('condutor') || d.includes('driver') || d.includes('drivers'))
                return `Pessoal: Escassez de Motoristas`;
            if (d.includes('efetivo') || d.includes('personnel') || d.includes('manpower') || d.includes('tropa') || d.includes('soldiers'))
                return `Pessoal: Insuficiência de Efetivo`;

            // Logistics / Vehicles / Equipment
            if (d.includes('veículo') || d.includes('veiculo') || d.includes('viatura') || d.includes('vehicle'))
                return `Logística: Viaturas Inoperantes`;
            if (d.includes('combustível') || d.includes('combustivel') || d.includes('fuel') || d.includes('gasolina'))
                return `Logística: Abastecimento de Combustível`;
            if (d.includes('manutenção') || d.includes('manutencao') || d.includes('maintenance') || d.includes('reparo'))
                return `Manutenção: Meios Inoperantes em ${subcategory || 'Seção'}`;

            // Safety/Security
            if (d.includes('segurança') || d.includes('seguranca') || d.includes('security') || d.includes('safety') || d.includes('perigo'))
                return `Segurança: Vulnerabilidade em ${subcategory || category}`;

            // Operations
            if (d.includes('comunicação') || d.includes('comunicacao') || d.includes('communication') || d.includes('radio'))
                return `Operações: Falha de Comunicação em ${subcategory || category}`;

            // Fallback — ALWAYS group by category prefix for easier consolidation
            return `${category}: Observação Operacional em ${subcategory || 'Seção Geral'}`;
        };

        const strategicTitle = generateStrategicTitle(report.category, report.description, report.subcategory);

        // ═══════════════════════════════════════════════════════
        // STEP 3: Find Existing Open Topic (Smart Matching)
        // ═══════════════════════════════════════════════════════

        // 1. First, search for ANY topic that already has a report with this category
        let topic = await prisma.topic.findFirst({
            where: {
                status: { in: ['pending', 'validated', 'priority_alert'] },
                reports: {
                    some: { category: report.category }
                }
            },
            orderBy: { updatedAt: 'desc' },
            include: { reports: true }
        });

        // 2. If not found, search by Title prefix (e.g., "Logística: ...")
        if (!topic) {
            topic = await prisma.topic.findFirst({
                where: {
                    status: { in: ['pending', 'validated', 'priority_alert'] },
                    title: { startsWith: `${report.category}:` }
                },
                orderBy: { updatedAt: 'desc' },
                include: { reports: true }
            });
        }

        if (topic) {
            // ── CONSOLIDATE into existing topic ──
            console.log(`[Strategic AI] ✅ Consolidating Report #${reportId} → Topic #${topic.id} ("${topic.title}")`);

            const currentReports = topic.reports || [];
            const totalReportsCount = currentReports.length + 1;

            let newPriority = topic.priority === 'high' ? 'high' : priority;

            // Auto-escalation based on volume
            if (totalReportsCount >= 3) {
                newPriority = 'high';
                console.log(`[Strategic AI] 🔺 Escalating Topic #${topic.id} to HIGH priority due to volume (${totalReportsCount} reports)`);
            }

            const newStatus = (newPriority === 'high') ? 'priority_alert' : 'validated';
            const updateLine = `\n\n📍 [${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}] Novo relato de ${report.user?.rank || ''} ${report.user?.name || 'Militar'}: "${report.description.substring(0, 100)}..."`;

            await prisma.topic.update({
                where: { id: topic.id },
                data: {
                    priority: newPriority,
                    status: newStatus,
                    aiSummary: ((topic.aiSummary || '') + updateLine).substring(0, 5000),
                    updatedAt: new Date()
                }
            });

        } else {
            // ── CREATE new Topic ──
            console.log(`[Strategic AI] 🆕 Creating new Topic for Category: "${report.category}"`);

            const impactType =
                report.category === 'Logística' ? 'Logística' :
                    report.category === 'Segurança' ? 'Segurança' :
                        report.category === 'Manutenção' ? 'Eficiência' :
                            report.category === 'Armamento' ? 'Segurança' :
                                report.category === 'Operações' ? 'Eficiência' : 'Moral';

            const aiSummary = `⚡ DIRETRIZ ESTRATÉGICA IA — ${new Date().toLocaleDateString('pt-BR')}
            
SITUAÇÃO: ${report.description.substring(0, 300)}
CATEGORIA: ${report.category.toUpperCase()} | IMPACTO AJUSTADO: ${impactType.toUpperCase()}
ORIGEM: ${report.user?.rank || 'Militar'} ${report.user?.name || 'Não identificado'} (Setor: ${report.subcategory || 'Diversos'})

ANÁLISE DE IMPACTO:
O relato indica uma potencial degradação na ${impactType.toLowerCase()} regimental. A prioridade foi definida como ${priority.toUpperCase()} baseada em análise de palavras-chave críticas e recorrência histórica.

💡 RECOMENDAÇÕES DO COMANDO (IA):
• Monitoramento imediato da seção de ${report.category}
• Solicitação de esclarecimento técnico via canal de comando
• Avaliação de contingência para mitigação de riscos operacionais`;

            const status = priority === 'high' ? 'priority_alert' : 'validated';

            topic = await prisma.topic.create({
                data: {
                    title: strategicTitle,
                    aiSummary,
                    status,        // CRITICAL: 'validated' or 'priority_alert' makes it visible
                    priority,      // 'high', 'medium', 'low'
                    impactType,
                    suggestions: JSON.stringify([
                        { text: 'Avaliar redistribuição de recursos nas seções adjacentes', author: 'IA Estratégica' },
                        { text: 'Solicitar relatório detalhado da seção responsável', author: 'IA Estratégica' }
                    ])
                }
            });

            console.log(`[Strategic AI] ✅ New Topic #${topic.id} created | Title: "${strategicTitle}" | Status: ${status}`);
        }

        // ═══════════════════════════════════════════════════════
        // STEP 4: Link Report → Topic & ensure visibility
        // ═══════════════════════════════════════════════════════
        await prisma.report.update({
            where: { id: report.id },
            data: {
                topicId: topic.id,
                status: 'Sent' // Marks as processed from Staff perspective
            }
        });

        console.log(`[Strategic AI] ✅ DONE — Total reports in Topic #${topic.id}: ${(topic.reports?.length || 0) + 1}`);
        return topic;

    } catch (error) {
        console.error(`[Strategic AI] ❌ FATAL ERROR for Report #${reportId}:`, error);
        // We log it but we don't crash. Controller will still return 201 to the staff.
    }
};

const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');

exports.getStats = async (req, res) => {
    try {
        // System Settings & Metrics
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: {} });
        }

        // Consolidated Topics Logic
        // In "Dashboard", activeTab "consolidated" shows topics with status 'validated'
        const consolidatedTopicsCount = await prisma.topic.count({ where: { status: 'validated' } });

        // Priority Alerts Logic
        // Dashboard shows (priority === 'high' || status === 'priority_alert')
        const priorityAlertsCount = await prisma.topic.count({
            where: {
                OR: [
                    { priority: 'high' },
                    { status: 'priority_alert' }
                ]
            }
        });

        // AI System Status
        const totalReports = await prisma.report.count();
        const totalTopics = await prisma.topic.count();
        const resolvedTopics = await prisma.topic.count({
            where: { status: { in: ['approved', 'archived'] } }
        });

        const convergence = totalTopics > 0
            ? ((resolvedTopics / totalTopics) * 100).toFixed(1)
            : 0;

        // Monthly Trends (Last 6 Months)
        const monthlyTrends = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const count = await prisma.report.count({
                where: {
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            const monthName = startOfMonth.toLocaleString('default', { month: 'short' }).toUpperCase();
            monthlyTrends.push({ month: monthName, value: count });
        }

        const stats = {
            personnelScore: settings.personnelScore,
            fleetScore: settings.fleetScore,
            supplyScore: settings.supplyScore,
            tacticalInputs: totalReports,
            convergence: convergence,
            consolidated_topics: consolidatedTopicsCount,
            critical_alerts: priorityAlertsCount,
            trends: monthlyTrends
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTopics = async (req, res) => {
    try {
        const { status } = req.query;
        const where = status ? { status } : {};

        const topics = await prisma.topic.findMany({
            where,
            include: {
                _count: {
                    select: { reports: true }
                },
                reports: {
                    include: {
                        user: {
                            select: { rank: true }
                        }
                    }
                }
            }
        });

        // Formatting to match frontend expectations
        const formattedTopics = topics.map(topic => {
            // Aggregate origin stats
            const originStats = {
                'Sd/Cb EV': 0,
                'Sd/Cb EP': 0,
                'Sgt/St': 0
            };

            topic.reports.forEach(report => {
                const rank = report.user?.rank || '';
                if (rank.includes('EV')) originStats['Sd/Cb EV']++;
                else if (rank.includes('EP')) originStats['Sd/Cb EP']++;
                else if (rank.includes('Sgt') || rank.includes('St')) originStats['Sgt/St']++;
                else originStats['Sd/Cb EV']++; // Defaulting to EV for simplicity if unknown
            });

            return {
                id: topic.id,
                title: topic.title,
                report_count: topic._count.reports,
                aiSummary: topic.aiSummary,
                suggestions: topic.suggestions ? JSON.parse(topic.suggestions) : [],
                status: topic.status,
                priority: topic.priority,
                impactType: topic.impactType,
                createdAt: topic.createdAt,
                originStats: Object.entries(originStats).map(([label, val]) => ({ label, val }))
            };
        });

        res.status(200).json(formattedTopics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.topicAction = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { action, final_solution, feedback_message } = req.body;

        // Update Topic
        let newStatus = 'approved';
        if (action === 'archive') newStatus = 'archived';
        if (action === 'hold') newStatus = 'validated'; // Keep it active but with a note

        const updatedTopic = await prisma.topic.update({
            where: { id },
            data: {
                status: newStatus,
                action,
                finalSolution: final_solution,
                feedbackMessage: feedback_message
            }
        });

        // Notify original reporters (Staff)
        const involvingReports = await prisma.report.findMany({
            where: { topicId: id },
            select: { userId: true }
        });

        const uniqueUserIds = [...new Set(involvingReports.map(r => r.userId))];

        if (uniqueUserIds.length > 0 && feedback_message) {
            await prisma.feedback.createMany({
                data: uniqueUserIds.map(userId => ({
                    userId,
                    message: feedback_message,
                    type: action === 'approve' ? 'Commendation' : 'Notice'
                }))
            });
        }

        res.status(200).json({ message: "Action processed successfully", topic: updatedTopic });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createTopic = async (req, res) => {
    try {
        const { title, aiSummary, status, priority, impactType } = req.body;

        const newTopic = await prisma.topic.create({
            data: {
                title,
                aiSummary, // Maps to 'description' from frontend or AI Summary
                status, // 'validated' or 'priority_alert'
                priority,
                impactType,
                suggestions: JSON.stringify([]) // Default empty suggestions
            }
        });

        res.status(201).json(newTopic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addSuggestion = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { text, author } = req.body;

        const topic = await prisma.topic.findUnique({ where: { id } });
        if (!topic) {
            return res.status(404).json({ message: "Topic not found" });
        }

        let suggestions = topic.suggestions ? JSON.parse(topic.suggestions) : [];
        if (!Array.isArray(suggestions)) suggestions = []; // Safety check

        suggestions.unshift({ text, author: author || "Anônimo" }); // Add to beginning

        const updatedTopic = await prisma.topic.update({
            where: { id },
            data: {
                suggestions: JSON.stringify(suggestions)
            }
        });

        res.status(200).json(updatedTopic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = req.body;

        const updatedTopic = await prisma.topic.update({
            where: { id },
            data: data
        });

        res.status(200).json(updatedTopic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Settings ---
exports.getSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: {} });
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: {} });
        }
        const updated = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: req.body
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Staff Management ---
exports.getStaff = async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true
            }
        });
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createStaff = async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'STAFF',
                status: status || 'Ativo'
            }
        });

        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, email, role, password, status } = req.body;

        const data = { name, email, role, status };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "Staff deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportTopicPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const topic = await prisma.topic.findUnique({
            where: { id },
            include: {
                reports: {
                    include: {
                        user: {
                            select: { name: true, rank: true }
                        }
                    }
                }
            }
        });

        if (!topic) {
            return res.status(404).json({ message: "Topic not found" });
        }

        const doc = new PDFDocument();
        let filename = `Relatorio_Decisao_${id}.pdf`;

        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('8º REGIMENTO DE CAVALARIA MECANIZADO', { align: 'center' });
        doc.fontSize(16).text('ESTADO-MAIOR - SEÇÃO DE INTELIGÊNCIA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text('RELATÓRIO DE DECISÃO DE COMANDO', { align: 'center', underline: true });
        doc.moveDown();

        // Topic Info
        doc.fontSize(12).font('Helvetica-Bold').text(`PROTOCOLO: #${topic.id.toString().padStart(6, '0')}`);
        doc.text(`ASSUNTO: ${topic.title.toUpperCase()}`);
        doc.text(`DATA DE GERAÇÃO: ${new Date().toLocaleString('pt-BR')}`);
        doc.text(`STATUS: ${topic.status.toUpperCase()}`);
        doc.moveDown();

        doc.fontSize(14).text('SUMÁRIO EXECUTIVO (IA):', { underline: true });
        doc.font('Helvetica').fontSize(11).text(topic.aiSummary || 'N/A');
        doc.moveDown();

        // Action taken
        doc.fontSize(14).font('Helvetica-Bold').text('DECISÃO REGIMENTAL:', { underline: true });
        doc.font('Helvetica').fontSize(11).text(`Ação: ${topic.action || 'Pendente'}`);
        doc.text(`Solução Consolidada: ${topic.finalSolution || 'N/A'}`);
        doc.moveDown();

        // Reports used
        doc.fontSize(14).font('Helvetica-Bold').text('RELATOS VINCULADOS:', { underline: true });
        topic.reports.forEach((report, index) => {
            doc.font('Helvetica-Bold').fontSize(10).text(`${index + 1}. ${report.category} - ${report.subcategory}`);
            doc.font('Helvetica').fontSize(9).text(`Origem: ${report.user?.name || 'Identificado'} (${report.user?.rank || 'N/A'})`);
            doc.text(`Descrição: ${report.description}`);
            doc.moveDown(0.5);
        });

        // Signatures
        doc.moveDown(4);
        doc.fontSize(11).text('________________________________________________', { align: 'center' });
        doc.text('COMANDANTE DO 8º RC MEC', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error("PDF Export Error", error);
        res.status(500).json({ message: error.message });
    }
};

exports.exportReportPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                user: {
                    select: { name: true, rank: true }
                }
            }
        });

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        const doc = new PDFDocument();
        let filename = `Relato_Tatico_${id}.pdf`;

        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('8º REGIMENTO DE CAVALARIA MECANIZADO', { align: 'center' });
        doc.fontSize(16).text('MEMORANDO DE INTELIGÊNCIA TÁTICA', { align: 'center' });
        doc.moveDown();

        // Report Info
        doc.fontSize(12).font('Helvetica-Bold').text(`PROTOCOLO: #RPT-${report.id.toString().padStart(6, '0')}`);
        doc.text(`IDENTIFICAÇÃO: ${report.user?.name || 'ANÔNIMO'} (${report.user?.rank || 'N/A'})`);
        doc.text(`CATEGORIA: ${report.category} / ${report.subcategory}`);
        doc.text(`DATA: ${new Date(report.createdAt).toLocaleString('pt-BR')}`);
        doc.text(`PRIORIDADE: ${report.priority.toUpperCase()}`);
        doc.moveDown();

        doc.fontSize(14).text('CONTEÚDO DA MANIFESTAÇÃO:', { underline: true });
        doc.font('Helvetica').fontSize(11).text(report.description);
        doc.moveDown();

        const metadata = report.metadata ? JSON.parse(report.metadata) : {};
        if (metadata.solution) {
            doc.fontSize(14).font('Helvetica-Bold').text('SUGESTÃO DE SOLUÇÃO:', { underline: true });
            doc.font('Helvetica').fontSize(11).text(metadata.solution);
            doc.moveDown();
        }

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

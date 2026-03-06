const prisma = require('../prisma');
const aiService = require('../services/aiService');

exports.createReport = async (req, res) => {
    try {
        const { category, subcategory, description, priority, media, details, hierarchy, identify, warName, squadron, solution, impact, urgency } = req.body;

        // Structured metadata
        const metadata = {
            details,
            hierarchy,
            identify,
            warName,
            squadron,
            solution,
            impact,
            urgency
        };

        const report = await prisma.report.create({
            data: {
                category,
                subcategory,
                description,
                priority,
                media: JSON.stringify(media || []),
                metadata: JSON.stringify(metadata),
                userId: req.userId
            }
        });

        console.log(`[Report Pipeline] Report #${report.id} created by User #${req.userId}.`);

        // Trigger AI Analysis automatically
        // This ensures the report appears in the Commander Panel as a Topic
        try {
            console.log(`[Report Pipeline] Triggering AI triage for Report #${report.id}...`);
            await aiService.processReportWithAI(report.id);
            console.log(`[Report Pipeline] AI triage completed for Report #${report.id}.`);
        } catch (aiError) {
            console.error(`[Report Pipeline] AI triage CRITICAL FAILURE for Report #${report.id}:`, aiError);
            // We don't fail the whole request if AI fails, but we log it heavily
        }

        res.status(201).json(report);
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyHistory = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            include: { user: { select: { name: true, email: true, role: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        // Find if report exists
        const report = await prisma.report.findUnique({
            where: { id: parseInt(id) }
        });

        if (!report) {
            return res.status(404).json({ message: "Relato não encontrado." });
        }

        await prisma.report.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: "Relato deletado com sucesso." });
    } catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({ message: error.message });
    }
};

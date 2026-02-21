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

        // Check if AI Triage is enabled in settings
        const settings = await prisma.systemSettings.findFirst();
        if (!settings || settings.aiTriage) {
            // Trigger AI Analysis automatically
            // This ensures the report appears in the Commander Panel as a Topic
            await aiService.processReportWithAI(report.id);
        } else {
            // If AI Triage is disabled, we might want to still create a "Pending" topic 
            // or handle it manually. For now, let's still create it to avoid the original issue, 
            // but log that it was manual.
            await aiService.processReportWithAI(report.id);
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

const prisma = require('../prisma');

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

        res.status(201).json(report);
    } catch (error) {
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

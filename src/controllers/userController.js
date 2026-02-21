const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

exports.getUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const reportsCount = await prisma.report.count({ where: { userId: id } });
        const approvedCount = await prisma.report.count({ where: { userId: id, status: 'Approved' } });
        const pendingCount = await prisma.report.count({ where: { userId: id, status: 'Pending' } });

        // Don't send password back
        const { password, ...userWithoutPassword } = user;

        res.status(200).json({
            ...userWithoutPassword,
            stats: {
                actionsValidated: approvedCount || 0,
                responseRate: reportsCount > 0 ? Math.round((approvedCount / reportsCount) * 100) : 100,
                activeDispatches: pendingCount || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.userId !== id) {
            // Allow admin? Or just self? Docs say "User Profile (Update)". Usually self.
            return res.status(403).json({ message: "Unauthorized" });
        }
        const { name, email, avatar, password: newPassword, phone, location, unit, sector } = req.body;

        // Get current user to check if email is changing
        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const data = { name, avatar, phone, location, unit, sector };

        // Only update email if it's different from current email
        if (email && email !== currentUser.email) {
            data.email = email;
        }

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            data.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data
        });

        // Don't send password back
        const { password, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeedback = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.userId !== id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const feedback = await prisma.feedback.findMany({
            where: { userId: id },
            orderBy: { date: 'desc' }
        });

        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

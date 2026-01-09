import prisma from '../../prismaClient.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        // Default: Last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // 1. Total Sales (Revenue)
        const sales = await prisma.sale.findMany({
            where: {
                organizationId,
                date: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                total: true
            }
        });

        const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.total), 0);

        // 2. Total Restocking Cost (Expenses)
        // Only "IN" movements count as expenses. Ideally we filter by Reason = 'Purchase' but for now all IN is cost.
        // We rely on new field unitCost * quantity.
        const restockMovements = await prisma.stockMovement.findMany({
            where: {
                organizationId,
                type: 'IN',
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                quantity: true,
                unitCost: true
            }
        });

        const totalExpenses = restockMovements.reduce((acc, mov) => {
            return acc + (mov.quantity * Number(mov.unitCost));
        }, 0);

        // 3. Profit (Gross)
        const grossProfit = totalRevenue - totalExpenses;

        res.json({
            period: {
                start: thirtyDaysAgo.toISOString(),
                end: now.toISOString()
            },
            totalRevenue,
            totalExpenses, // Estimated from Stock IN
            grossProfit
        });

    } catch (error) {
        logger.error('Get stats error', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

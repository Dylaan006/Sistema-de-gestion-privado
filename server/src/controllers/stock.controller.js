import prisma from '../../prismaClient.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const adjustStockSchema = z.object({
    productId: z.number().int(),
    type: z.enum(['IN', 'OUT', 'ADJUST']),
    quantity: z.number().int().min(1),
    reason: z.string().optional()
});

export const adjustStock = async (req, res) => {
    try {
        const { productId, type, quantity, reason } = adjustStockSchema.parse(req.body);
        const organizationId = req.user.organizationId;
        const userId = req.user.id;

        // Verify product exists and belongs to organization
        const product = await prisma.product.findFirst({
            where: { id: productId, organizationId }
        });

        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Calculate new stock
        let newStock = product.stock;
        if (type === 'IN') {
            newStock += quantity;
        } else if (type === 'OUT') {
            if (product.stock < quantity) {
                return res.status(400).json({ error: 'Stock insuficente' });
            }
            newStock -= quantity;
        } else if (type === 'ADJUST') {
            // Adjust implies setting the absolute value or correcting?
            // Usually ADJUST in this context might mean "Correction". 
            // If type is ADJUST, quantity represents the DELTA or the FINAL value?
            // To keep it consistent with StockMovement (which logs quantity changed), let's say ADJUST adds/removes to match a real count?
            // Complication: Often User counts 50, system says 48. Delta is +2.
            // Let's assume the frontend calculates the delta OR we treat ADJUST as a direct fix.
            // Simplest for now: ADJUST behaves like IN/OUT but with a different label?
            // Better: ADJUST implies we might be adding or removing. 
            // Let's stick to strict IN/OUT for adding/removing. 
            // If user wants to "Set Stock to 50", frontend calculates delta.
            // OR we handle it here. Let's make ADJUST = we add/substract this quantity. 
            // Wait, if I find 5 expired yogurts, I do OUT -> 5, Reason: "Expired".
            // Use cases for "ADJUST": fixing errors. 
            // Let's stick to standard algebra:
            // IN: Stock + Q
            // OUT: Stock - Q
            // ADJUST: Stock + Q (where Q can be negative? Schema says Int).
            // Schema quantity is Int. 
            // Let's trust logic: 
            // If type IN -> add.
            // If type OUT -> subtract.
            // If type ADJUST -> add (allow negative quantity? zod min(1) prevents negative).
            // Let's keep it simple: IN adds, OUT removes. ADJUST isn't a math operation, it's a Label.
            // WE WILL INTERPRET 'ADJUST' as 'IN' but logged as Correction? No.
            // Let's restrict to IN and OUT for math. ADJUST is just a tag? No.

            // Revised Logic:
            // IN: Adds to stock.
            // OUT: Subtracts from stock.
            // The type is just for classification in history.
            // If I count 50 and system has 40. I add 10 (Type: ADJUST (IN)).
            // If I count 30 and system has 40. I remove 10 (Type: ADJUST (OUT)).
            // So Type in DB is enum: IN, OUT, ADJUST.
            // But functionally, we only add or subtract. 
            // Let's change schema enum to just IN/OUT? No, existing schema has ADJUST.

            // Let's say:
            // IN -> +Quantity
            // OUT -> -Quantity
            // ADJUST -> +Quantity (can be negative).

            // But schema has Quantity Int. Zod min(1).
            // Let's disable ADJUST as a logic operator for now, or treat it as an alias for IN?
            // Let's treat ADJUST as "Set to specific value"? No, tricky with concurrency.

            // Decision: We will only support IN and OUT for now in the API for simplicity and robustness.
            // If user selects "Correction", they choose IN or OUT.

            if (type === 'ADJUST') {
                return res.status(400).json({ error: 'Use IN or OUT for adjustments' });
            }
        }

        // Transactional update
        const [updatedProduct, movement] = await prisma.$transaction([
            prisma.product.update({
                where: { id: productId },
                data: { stock: newStock }
            }),
            prisma.stockMovement.create({
                data: {
                    type,
                    quantity,
                    reason,
                    productId,
                    userId,
                    organizationId
                }
            })
        ]);

        res.json({
            stock: updatedProduct.stock,
            movementId: movement.id
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error('Stock adjust error', error);
        res.status(500).json({ error: 'Error al ajustar stock' });
    }
};

export const getMovements = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { productId } = req.query;

        const where = { organizationId };
        if (productId) where.productId = parseInt(productId);

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                product: { select: { name: true, barcode: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit history
        });

        res.json(movements);
    } catch (error) {
        logger.error('Get movements error', error);
        res.status(500).json({ error: 'Error al obtener movimientos' });
    }
};

import prisma from '../../prismaClient.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const productSchema = z.object({
    name: z.string().min(1),
    barcode: z.string().optional(),
    description: z.string().optional(),
    price: z.number().min(0),
    cost: z.number().min(0),
    stock: z.number().int().default(0), // Initial stock
    minStock: z.number().int().min(0).default(0),
    categoryId: z.number().int().optional(),
    supplierId: z.number().int().optional()
});

export const createProduct = async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const organizationId = req.user.organizationId;

        // Check barcode uniqueness WITHIN organization
        if (data.barcode) {
            const existing = await prisma.product.findFirst({
                where: {
                    organizationId,
                    barcode: data.barcode
                }
            });
            if (existing) {
                return res.status(400).json({ error: 'El código de barras ya existe en esta organización' });
            }
        }

        // Creating product. 
        // Note: Initial stock should ideally create a StockMovement, but for simplicity in "Create Product" we just set the number.
        // Enhanced version: If stock > 0, create movement. Let's keep it simple for now or do it right?
        // Let's do it right: define stock as 0 initially or create movement.
        // For this Create Endpoint, we'll allow setting initial stock directly.

        const product = await prisma.product.create({
            data: {
                ...data,
                organizationId
            }
        });

        // If initial stock > 0, we could create an IN movement (Initial Inventory)
        if (data.stock > 0) {
            await prisma.stockMovement.create({
                data: {
                    type: 'IN',
                    quantity: data.stock,
                    reason: 'Inventario Inicial',
                    productId: product.id,
                    userId: req.user.id,
                    organizationId
                }
            });
        }

        res.status(201).json(product);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        // DEBUG LOG TO FILE
        try {
            const fs = await import('fs');
            fs.writeFileSync('product-error.txt', `Date: ${new Date().toISOString()}\nError: ${error.stack || error.message}\n`);
        } catch (e) { console.error(e) }

        logger.error('Create product error', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

export const getProducts = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { categoryId, supplierId, search } = req.query;

        // Filter by Active Only
        const where = { organizationId, isActive: true };

        if (categoryId) where.categoryId = parseInt(categoryId);
        if (supplierId) where.supplierId = parseInt(supplierId);
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { barcode: { contains: search } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                supplier: true
            },
            orderBy: { name: 'asc' }
        });

        res.json(products);

    } catch (error) {
        logger.error('Get products error', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;
        const data = productSchema.partial().parse(req.body);

        const existing = await prisma.product.findFirst({
            where: { id: parseInt(id), organizationId, isActive: true }
        });

        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        if (data.barcode && data.barcode !== existing.barcode) {
            const barcodeExists = await prisma.product.findFirst({
                where: { organizationId, barcode: data.barcode, isActive: true }
            });
            if (barcodeExists) return res.status(400).json({ error: 'Código de barras en uso' });
        }

        delete data.stock; // Stock managed via adjustments

        const updated = await prisma.product.update({
            where: { id: parseInt(id) },
            data
        });

        res.json(updated);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error('Update product error', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;
        const productId = parseInt(id);

        // Fetch product with counts of history
        const existing = await prisma.product.findFirst({
            where: { id: productId, organizationId, isActive: true },
            include: {
                _count: {
                    select: {
                        saleItems: true,
                        movements: true
                    }
                }
            }
        });

        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        const hasHistory = existing._count.saleItems > 0 || existing._count.movements > 0;

        if (hasHistory) {
            // Soft Delete: Preserve data, but mark inactive and free up barcode
            await prisma.product.update({
                where: { id: productId },
                data: {
                    isActive: false,
                    barcode: existing.barcode ? `${existing.barcode}_DEL_${Date.now()}` : null
                }
            });
            res.json({ message: 'Producto archivado (tiene historial)' });
        } else {
            // Hard Delete: Safe to remove completely
            await prisma.product.delete({
                where: { id: productId }
            });
            res.json({ message: 'Producto eliminado definitivamente' });
        }

    } catch (error) {
        logger.error('Delete product error', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};

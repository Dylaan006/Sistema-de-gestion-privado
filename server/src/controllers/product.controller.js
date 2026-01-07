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
        logger.error('Create product error', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

export const getProducts = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        // Optional filters
        const { categoryId, supplierId, search } = req.query;

        const where = { organizationId };

        if (categoryId) where.categoryId = parseInt(categoryId);
        if (supplierId) where.supplierId = parseInt(supplierId);
        if (search) {
            where.OR = [
                { name: { contains: search } }, // Case insensitive usually depends on DB, SQLite is distinct
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
        const data = productSchema.partial().parse(req.body); // Allow partial updates

        // Ensure product belongs to user's organization
        const existing = await prisma.product.findFirst({
            where: { id: parseInt(id), organizationId }
        });

        if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

        // Barcode check if changing
        if (data.barcode && data.barcode !== existing.barcode) {
            const barcodeExists = await prisma.product.findFirst({
                where: { organizationId, barcode: data.barcode }
            });
            if (barcodeExists) return res.status(400).json({ error: 'Código de barras en uso' });
        }

        // Don't update stock directly here? Or allow it? 
        // Plan said: "No vamos a editar el stock a mano en la tabla de productos solamente".
        // So we should remove 'stock' from update payload to force using Adjustment endpoint.
        delete data.stock;

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

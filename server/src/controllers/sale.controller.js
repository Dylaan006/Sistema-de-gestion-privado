import prisma from '../../prismaClient.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import pdfService from '../services/pdf.service.js';
import afipService from '../services/afip.service.js';

export const getAllSales = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const sales = await prisma.sale.findMany({
            where: { organizationId },
            orderBy: { date: 'desc' },
            include: { client: true }
        });
        res.json(sales);
    } catch (error) {
        logger.error('Get all sales error', error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
};

export const getSalePdf = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;

        const sale = await prisma.sale.findUnique({
            where: { id: Number(id) },
            include: {
                items: { include: { product: true } },
                client: true,
                organization: true
            }
        });

        if (!sale || sale.organizationId !== organizationId) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Generate PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="factura-${sale.invoiceType}-${sale.number}.pdf"`);



        pdfService.generateInvoice(sale, sale.organization, res);

    } catch (error) {
        logger.error('Error generating PDF', error);
        res.status(500).json({ error: 'Error al generar PDF' });
    }
};

const saleItemSchema = z.object({
    productId: z.number().int(),
    quantity: z.number().int().min(1)
});

const saleSchema = z.object({
    items: z.array(saleItemSchema).min(1),
    clientId: z.number().int().optional(),
    clientCuit: z.string().optional(),
    clientName: z.string().optional(),
    invoiceType: z.enum(['A', 'B', 'C', 'X']).default('X')
});

export const createSale = async (req, res) => {
    try {
        const { items, clientId, clientCuit, clientName, invoiceType } = saleSchema.parse(req.body);
        const organizationId = req.user.organizationId;
        const userId = req.user.id;

        // 0. Resolve Client
        let finalClientId = clientId;

        if (clientCuit) {
            // "On the Fly" logic: Find or Create by CUIT
            let client = await prisma.client.findFirst({
                where: { organizationId, cuit: clientCuit }
            });

            if (!client) {
                // Create new client
                client = await prisma.client.create({
                    data: {
                        name: clientName || `Cliente ${clientCuit}`,
                        cuit: clientCuit,
                        taxCondition: invoiceType === 'A' ? 'RESPONSABLE_INSCRIPTO' : 'CONSUMIDOR_FINAL', // Default assumption
                        organizationId
                    }
                });
            }
            finalClientId = client.id;
        }

        // Validation for Factura A
        if (invoiceType === 'A') {
            if (!finalClientId) return res.status(400).json({ error: 'Falta cliente para Factura A' });

            // Re-fetch to ensure we have CUIT if passed just ID
            const clientCheck = await prisma.client.findUnique({ where: { id: finalClientId } });
            if (!clientCheck || !clientCheck.cuit) {
                return res.status(400).json({ error: 'El cliente seleccionado no tiene CUIT valido para Factura A' });
            }
        }

        if (!finalClientId) finalClientId = 1; // Default to Consumer if nothing matches

        // 1. Validate Stock & Calculate Total
        let total = 0;
        const preparedItems = [];

        // Fetch all products involved (same as before)
        const productIds = items.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                organizationId
            }
        });

        if (products.length !== items.length) {
            return res.status(400).json({ error: 'Algunos productos no existen' });
        }

        const productMap = new Map(products.map(p => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.productId);

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Stock insuficiente para ${product.name}. Disponibles: ${product.stock}`
                });
            }

            const itemTotal = Number(product.price) * item.quantity;
            total += itemTotal;

            preparedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price
            });
        }

        // 2. Fiscal Integration (AFIP)
        // If invoiceType is NOT 'X', we assume they want a fiscal invoice.
        // Or we can add an explicit "isFiscal" flag.
        // For now, let's use the invoiceType. If A, B, C => Fiscal. X => Internal.

        let caeData = {};

        if (['A', 'B', 'C'].includes(invoiceType)) {
            try {
                // Calculate net/vat properly in real app
                const afipResult = await afipService.createVoucher({
                    total,
                    invoiceType,
                    client: clientId // We need the client info! Pass it properly.
                    // Actually we have clientId in the body.
                });

                caeData = {
                    cae: afipResult.cae,
                    caeExpiration: afipResult.caeExpiration,
                    invoiceNumber: afipResult.invoiceNumber // We should store this
                };
            } catch (error) {
                logger.error('AFIP Error', error);
                return res.status(500).json({ error: 'Error al facturar en AFIP. Venta cancelada.' });
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // 3. Get Next Invoice Number (Tenant Scoped)
            const lastSale = await tx.sale.findFirst({
                where: { organizationId, invoiceType },
                orderBy: { number: 'desc' }
            });
            const nextNumber = (lastSale?.number || 0) + 1;

            // Create Sale Header
            const sale = await tx.sale.create({
                data: {
                    total,
                    invoiceType,
                    number: nextNumber, // Save custom number
                    userId,
                    clientId: finalClientId,
                    organizationId,
                    cae: caeData.cae,
                    caeExpiration: caeData.caeExpiration,
                    invoiceNumber: caeData.invoiceNumber, // Store AFIP invoice number
                    items: {
                        create: preparedItems
                    }
                },
                include: { items: true }
            });

            // Update Stock for each item
            for (const item of items) {
                // Decrement Stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });

                // Log Movement
                await tx.stockMovement.create({
                    data: {
                        type: 'OUT',
                        quantity: item.quantity,
                        reason: `Venta #${sale.id}`,
                        productId: item.productId,
                        userId,
                        organizationId
                    }
                });
            }

            return sale;
        });

        res.status(201).json(result);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        // DEBUG: Write error to file to read it
        try {
            const fs = await import('fs');
            fs.writeFileSync('last-error.txt', `Date: ${new Date().toISOString()}\nError: ${error.stack || error.message}\n`);
        } catch (e) { console.error('Failed to write error log', e); }

        logger.error('Create sale error', error);
        res.status(500).json({ error: `Error al procesar la venta: ${error.message}` });
    }
};

export const createCreditNote = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;
        const userId = req.user.id;

        // 1. Fetch Original Sale
        const sale = await prisma.sale.findUnique({
            where: { id: Number(id) },
            include: { items: true, creditNotes: true }
        });

        if (!sale || sale.organizationId !== organizationId) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // 2. Validate: Is it already refunded?
        if (sale.creditNotes.length > 0) {
            return res.status(400).json({ error: 'Esta venta ya tiene una Nota de Crédito asociada' });
        }

        // 3. Determine NC Type
        let ncType = 'NCB'; // Default
        if (sale.invoiceType === 'A') ncType = 'NCA';
        if (sale.invoiceType === 'X') ncType = 'NCX';

        // 4. AFIP Integration (Mock/Real)
        let caeData = {};
        if (['NCA', 'NCB'].includes(ncType)) {
            try {
                const afipResult = await afipService.createVoucher({
                    total: Number(sale.total),
                    invoiceType: ncType,
                    client: sale.clientId
                });

                caeData = {
                    cae: afipResult.cae,
                    caeExpiration: afipResult.caeExpiration,
                    invoiceNumber: afipResult.invoiceNumber
                };
            } catch (error) {
                logger.error('AFIP NC Error', error);
                return res.status(500).json({ error: 'Error al generar Nota de Crédito en AFIP.' });
            }
        }

        // 5. Transaction: Create NC & Restore Stock
        const creditNote = await prisma.$transaction(async (tx) => {

            // Get Next Number for NC Type
            const lastNc = await tx.sale.findFirst({
                where: { organizationId, invoiceType: ncType },
                orderBy: { number: 'desc' }
            });
            const nextNcNumber = (lastNc?.number || 0) + 1;

            // Create NC
            const nc = await tx.sale.create({
                data: {
                    total: sale.total,
                    invoiceType: ncType,
                    number: nextNcNumber,
                    relatedSaleId: sale.id,
                    userId,
                    clientId: sale.clientId,
                    organizationId,
                    cae: caeData.cae,
                    caeExpiration: caeData.caeExpiration,
                    invoiceNumber: caeData.invoiceNumber,
                    items: {
                        create: sale.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice
                        }))
                    }
                }
            });


            // Restore Stock
            for (const item of sale.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });

                await tx.stockMovement.create({
                    data: {
                        type: 'IN', // Refund puts stock back in
                        quantity: item.quantity,
                        reason: `Devolución Sale #${sale.id} (NC #${nc.id})`,
                        productId: item.productId,
                        userId,
                        organizationId
                    }
                });
            }

            return nc;
        });

        res.status(201).json(creditNote);

    } catch (error) {
        logger.error('Create Credit Note error', error);
        res.status(500).json({ error: 'Error al anular venta: ' + error.message });
    }
};

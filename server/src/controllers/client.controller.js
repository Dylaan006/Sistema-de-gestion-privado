import prisma from '../../prismaClient.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const clientSchema = z.object({
    name: z.string().min(1),
    cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$|^\d{11}$/, 'Invalid CUIT format').optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    taxCondition: z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'CONSUMIDOR_FINAL', 'EXENTO']).default('CONSUMIDOR_FINAL')
});

export const getClients = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { search } = req.query;

        // Filter active
        const where = { organizationId, isActive: true };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { cuit: { contains: search } }
            ];
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        res.json(clients);
    } catch (error) {
        logger.error('Get clients error', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};

export const createClient = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const data = clientSchema.parse(req.body);

        // Check duplicate CUIT if active
        if (data.cuit) {
            const existing = await prisma.client.findFirst({
                where: { organizationId, cuit: data.cuit, isActive: true }
            });
            if (existing) {
                return res.status(400).json({ error: 'Ya existe un cliente con ese CUIT' });
            }
        }

        const client = await prisma.client.create({
            data: {
                ...data,
                organizationId
            }
        });

        res.status(201).json(client);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error('Create client error', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;
        const data = clientSchema.partial().parse(req.body);

        const client = await prisma.client.findUnique({
            where: { id: Number(id) }
        });

        if (!client || client.organizationId !== organizationId || !client.isActive) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const updated = await prisma.client.update({
            where: { id: Number(id) },
            data
        });

        res.json(updated);
    } catch (error) {
        logger.error('Update client error', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organizationId;

        const client = await prisma.client.findUnique({
            where: { id: Number(id) }
        });

        if (!client || client.organizationId !== organizationId || !client.isActive) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Soft delete: Set isActive false.
        // Release CUIT?

        await prisma.client.update({
            where: { id: Number(id) },
            data: {
                isActive: false,
                // Optionally append DEL to cuit to allow reuse
                cuit: client.cuit ? `${client.cuit}_DEL_${Date.now()}` : null
            }
        });

        res.json({ message: 'Cliente eliminado (archivado)' });
    } catch (error) {
        logger.error('Delete client error', error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
};

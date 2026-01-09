import prisma from '../../prismaClient.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const updateSchema = z.object({
    name: z.string().optional(),
    cuit: z.string().optional(),
    salesPoint: z.number().int().optional(),
    grossIncome: z.string().optional(),
    startActivity: z.string().optional(), // Expecting ISO date string
    afipCrt: z.string().optional(),
    afipKey: z.string().optional()
});

export const getSettings = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!org) {
            return res.status(404).json({ error: 'Organización no encontrada' });
        }

        // Don't send sensitive key back, or strictly controlled?
        // For now, let's just send everything so the UI knows it exists, but maybe mask the key?
        // Let's send it masked.
        const response = {
            ...org,
            afipKey: org.afipKey ? '*** HIDDEN ***' : null,
            afipCrt: org.afipCrt ? '*** CERTIFICATE LOADED ***' : null
        };

        res.json(response);
    } catch (error) {
        logger.error('Get settings error', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const data = updateSchema.parse(req.body);

        const updatedOrg = await prisma.organization.update({
            where: { id: organizationId },
            data: {
                ...data,
                startActivity: data.startActivity ? new Date(data.startActivity) : undefined
            }
        });

        res.json({ message: 'Configuración actualizada', org: updatedOrg });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        logger.error('Update settings error', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

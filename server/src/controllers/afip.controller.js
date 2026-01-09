import afipService from '../services/afip.service.js';
import logger from '../utils/logger.js';

export const checkCuit = async (req, res) => {
    try {
        const { cuit } = req.params;

        // Basic format check
        if (!cuit || cuit.length !== 11) {
            return res.status(400).json({ error: 'CUIT inválido (debe tener 11 dígitos)' });
        }

        const data = await afipService.getPersona(cuit);
        res.json(data);

    } catch (error) {
        logger.error('Check CUIT error', error);
        res.status(500).json({ error: error.message || 'Error al consultar AFIP' });
    }
};

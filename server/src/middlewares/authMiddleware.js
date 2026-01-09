import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token mal formado' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Attach minimal user info to request
    req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        organizationId: decoded.organizationId
    };

    next();
};

export const authenticateToken = authMiddleware;

export const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        const rolesHierarchy = {
            'READ_ONLY': 1,
            'STAFF': 2,
            'ADMIN': 3
        };

        const userRoleValue = rolesHierarchy[req.user.role] || 0;
        const requiredRoleValue = rolesHierarchy[requiredRole] || 100;

        if (userRoleValue < requiredRoleValue) {
            return res.status(403).json({ error: 'Permisos insuficientes' });
        }

        next();
    };
};

export const requireAdmin = roleMiddleware('ADMIN');
export const requireStaff = roleMiddleware('STAFF');
export const requireReadOnly = roleMiddleware('READ_ONLY');

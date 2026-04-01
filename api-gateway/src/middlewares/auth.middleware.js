import jwt from 'jsonwebtoken';

const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health' // Health check endpoint
];

const verifyToken = (req, res, next) => {
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    if (isPublicRoute) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access Denied: No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.headers['x-user-id'] = decoded.id;
        req.headers['x-user-role'] = decoded.role; 
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

export default verifyToken;
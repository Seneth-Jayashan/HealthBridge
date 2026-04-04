import ApiError from '../utils/ApiError.js';

// Checks if the request came through the Gateway with a valid user ID
export const requireAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || !userRole) {
        return next(new ApiError(401, "Unauthorized: Missing user context from Gateway"));
    }

    // Attach to the request object for easy access in your controllers
    req.user = { id: userId, role: userRole };
    next();
};

// Checks if the logged-in user has the specific role needed
export const requireRole = (...roles) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'];
        
        if (!userRole || !roles.includes(userRole)) {
            return next(new ApiError(403, `Forbidden: Requires one of roles: ${roles.join(', ')}`));
        }
        next();
    };
};
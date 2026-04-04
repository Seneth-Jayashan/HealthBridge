const errorHandler = (err, req, res, next) => {
    console.error(`[Gateway Error]: ${err.message}`);

    const statusCode = err.status || 500;
    const message = err.message || 'Internal Gateway Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

export default errorHandler;
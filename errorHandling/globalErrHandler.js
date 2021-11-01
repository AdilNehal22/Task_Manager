const AppError = require('./AppError');

module.exports = (err, req, res, next)=>{

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, res);
    }

    else if(process.env.NODE_ENV === 'production'){
        if(err.name === 'CastError') err = handleCastErrorDB(err);
        if(err.code === 11000) err = handleDuplicateFieldsDB(err);
        if(err.name === 'ValidationError') err = handleValidationErrorDB(err);
        // if(err.name === 'JsonWebTokenError') err = handleJWTError(err);
        // if(err.name === 'TokenExpiredError') err = handleExpiredTokenErr(err);
        sendErrorProd(err, res);
    };

};

const sendErrorDev = (err, res)=>{
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }else{
        // Programming or other unknown error: don't send details to client
        //1_console err
        console.log('error: ', err);

        //2_send generic message to client
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    };
};

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data ${errors.join('. ')}`;
    return new AppError(message, 400);
};
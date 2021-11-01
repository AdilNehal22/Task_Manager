const express = require('express');
const morgan = require('morgan');
const taskRouter = require('./routes/taskRouter');
const userRouter = require('./routes/userRouter');
const AppError = require('./errorHandling/AppError');
const globalErrHandler = require('./errorHandling/globalErrHandler');





const app = express();

app.use(express.json());

if(process.env.NODE_ENV === 'development'){
    morgan('dev');
};

app.use('/api/v1/my-tasks', taskRouter);
app.use('/api/v1/users', userRouter);

app.use('*', (req, res, next)=>{
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrHandler);


module.exports = app;


const User = require('./../models/userModel');
const Task = require('./../models/taskModel');
const catchAsync = require('./../errorHandling/catchAsync');
const AppError = require('./../errorHandling/AppError');


exports.getUser = catchAsync(async(req, res, next)=>{
    const user = await User.findById(req.params.id);
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});






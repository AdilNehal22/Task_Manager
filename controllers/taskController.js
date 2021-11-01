const Task = require('./../models/taskModel');
const User = require('./..//models/userModel');

const catchAsync = require('./../errorHandling/catchAsync');
const mailer = require('./../utils/mailer');



exports.createTask = catchAsync(async (req, res, next)=>{

    const user = await User.findById(req.user.id);

    const newTask = await Task.create({
        task: req.body.task,
        remindMe: req.body.remindMe,
        taskDate: req.body.taskDate,
        description: req.body.description
    });

    user['tasks'].push(newTask._id);
    await user.save({validateBeforeSave: false});

    const message = `your task named : ${newTask.task} is created and you'll be remined on ${newTask.remindMe}`;

    try{

        await mailer({
            email: req.user.email,
            subject: 'New Task created',
            message
        });
    
    
        res.status(200).json({
            status: 'success',
            message: `you will be reminded about the task on ${newTask.remindMe}`,
            yourTask: newTask
    
        });

    }catch(err){
        console.log(err)
    };

    next();
    
});

exports.getAllTasks = catchAsync(async(req, res, next)=>{

    const user = await User.findById(req.user.id).populate('tasks');

    res.status(200).json({
        status: 'success',
        data: {
            yourTasks: user
        }
    });
    
    next();  

});

exports.getATask = catchAsync(async(req, res, next) => {
      
    const task = await Task.findOne({task: req.params.task});
    res.status(200).json({
        status: 'success',
        message: `This is the task you have to do on ${task.taskDate}`,
        data: {
            task
        }
    });

    next();
    
});

exports.updateATask = catchAsync(async(req, res, next) => {
     
    const task = await Task.findOneAndUpdate({task: req.params.task}, {new: true});

    res.status(200).json({
        status: 'success',
        message: 'Task updated successfully',
        data: {
            task
        }
    });

    next();
    
});

exports.deleteTask = catchAsync(async(req, res, next) => {
   
    const taskToDelete = await Task.findOneAndDelete({task: req.params.task});

    res.status(204).json({
        status: 'success',
        message: 'Task deleted successfully'
    });

    next();
});


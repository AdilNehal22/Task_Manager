const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({

    task: {
        type: String,
        required: [true, 'THe task must have a name!']
    },

    remindMe: {
        type: Date,
        required: [true, 'Please also give a date on which you will be reminded about the task!']
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    taskDate: {
        type: Date,
        required: [true, 'Please also give a date on which you have to perform the task']
    },

    description: String,

    // user: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'User',
    // }


});

const Task = mongoose.model('Task', taskSchema);

// taskSchema.post('save', function(next){
//     this.set({taskDate: taskDate.sort({date: 1})});
//     next();
// });

module.exports = Task;


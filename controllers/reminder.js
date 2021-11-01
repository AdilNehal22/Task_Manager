const mailer = require('./../utils/mailer');
const Task = require('./../models/taskModel');
const cron = require('cron');
const catchAsync = require('./../errorHandling/catchAsync');


const remindUsers = catchAsync(async () => {
    const todayDate = new Date.now().toISOString();
    const users = await Task.find({'remindMe': {$eq: new Date()}});

    cron.schedule('* * 07 * * *', ()=>{
        users.forEach(el => {
            if(users[el].remindMe === todayDate){
                await mailer({
                    email: users[el].email,
                    subject: 'your upcoming task',
                    message: `your task named ${users[el].task} will be performed on ${users[el].taskDate}`
                });
            };
        });
    });

});


remindUsers();

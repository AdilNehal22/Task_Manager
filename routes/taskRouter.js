const express = require('express');
const taskController = require('./../controllers/taskController');
const authController = require('./../controllers/authController');

const router = express.Router();


router.use(authController.protect)

router.route('/')
.post(taskController.createTask)

router.get('/myTask', taskController.getAllTasks)

router.route('/:task')
.get(taskController.getATask)
.patch(taskController.updateATask)
.delete(taskController.deleteTask);

module.exports = router;


const express = require('express');
const userController = require('./../controllers/userController');
const taskController = require('./../controllers/taskController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

router.get('/:id', userController.getUser);

router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe', authController.updateMe);
router.delete('/deleteMe', authController.deleteMe);

module.exports = router;


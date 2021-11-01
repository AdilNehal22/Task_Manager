const {promisify} = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../errorHandling/catchAsync');
const AppError = require('./../errorHandling/AppError');
const jwt = require('jsonwebtoken');
const mailer = require('./../utils/mailer');
const crypto = require('crypto');
const filterObj = require('./../utils/filterObj');

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const cookieOptions = {
        expire: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', signToken, cookieOptions);
    //to hide user password on creation of new user
    user.password = undefined;

    const token = signToken(user._id);
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signUp = catchAsync(async(req, res, next) => {
    //getting the data desired to make the user doc
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    });

    const message = 'Your account is created now, you can manage your tasks easily.'

    await mailer({
        email: newUser.email,
        subject: 'your account created',
        message
    });

    //sending the jwt along with cookie and response
    createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async(req, res, next)=>{
    //getting the user email and password from the re body
    const { email, password } = req.body;

    if(!email || !password){
        return next(new AppError('please provide email and password to login', 400));
    };
    //then checking if the provided info is in the doc
    const user = await User.findOne({email}).select('+password');

    if(!user || !await user.correctPassword(password, user.password)){
        return next(new AppError('Please provide correct email or password', 401));
    };

    //sending res, cookie+token
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async(req, res, next)=>{
    let token;
    //from the req headers getting the authorization bearer token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    };

    if(!token){
        return next(new AppError('you are not logged in, please log in to get access', 401));
    };
    //decoding that token and verifying it
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //finding the user by using the payload user id
    const thisUser = await User.findById(decoded.id);

    if(!thisUser){
        return next(new AppError('This user does not exist', 401));
    };
    //some change password after jwt issued that's not good that they are still logged in, so
    //here they will login again
    if(thisUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('You recently changed your password, please login again!', 401));
    };
    //if all the conditions satisfy then this user will be put into req.user
    req.user = thisUser;

    next();
});

exports.forgotPassword = catchAsync(async(req, res, next)=>{
    //geting the user email from req.body
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new AppError('There is no user with such email', 404));
    };
    //making the reset token
    const resetToken = user.createPasswordResetToken();
    //saving that token in databse for next time to verify
    await user.save({ validateBeforeSave: false});
    //making the link and url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password?Follow the link to reset your password: ${resetUrl}\nIf you did'nt forget your password, please ignore this email`;

    try{

        await mailer({
            email: user.email,
            subject: 'your password reset link, valid for only 10 minutes',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'link to reset password send on email'
        });

    }catch(err){
        console.log(err);
        user.createPasswordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return next(new AppError('There was an error sending the email please try again later'), 500);
    }

});

exports.resetPassword = catchAsync(async(req, res, next)=>{
    //hashing the token recieved in url params that user will give
    const userToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: userToken, passwordResetExpires: {$gt: Date.now()}});
    //finding that user using that hashed token
    if(!user){
        return next(new AppError('The link is invalid or maybe expired', 400));
    };

    //update user model

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);

});

exports.updatePassword = catchAsync(async(req, res, next)=>{
    console.log(req.user)
    //getting the user from req.user and his password as the user is currently logged in
    const user = await User.findById(req.user.id).select('+password');
    //checking if the password is correct
    if(!(await user.correctPassword(req.body.currentPassword, user.password))){
        return next(new AppError('please provide correct password', 401))
    };
    //updating the password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    createSendToken(user, 200, res);

});

exports.updateMe = catchAsync(async(req, res, next)=>{

    if(req.body.password || req.body.confirmPassword){
        return next(new AppError('You cannot update your password here, its just for email and name', 400));
    };

    const filteredBody = filterObj(req.body, 'email', 'name');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            updatedUser
        }
    });

});

exports.getMe = catchAsync(async(req, res, next)=>{
    req.params.id = req.user.id;
    next();
});

exports.deleteMe = catchAsync(async(req, res, next)=>{
    await User.findByIdAndDelete(req.user.id);
    res.status(204).json({
        status: 'success',
        message: 'user deleted successfully'
    })
});




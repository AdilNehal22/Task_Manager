const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'A user must have a name']
    },

    email: {
        type: String,
        unique: true,
        required: [true, 'A user must have an email'],
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email']
    },

    password: {
        type: String,
        required: [true, 'A user must have a password'],
        minlength: 8,
        select: false
    },

    confirmPassword: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            validator: function(el){
                return el === this.password
            },
            message: 'password is not same'
        }   
    },
    
    passwordChangedAt: Date,

    passwordResetToken : String,

    passwordResetExpires: Date,

    tasks: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Task',
        }
    ]

});



userSchema.pre('save', async function(next){
    //only hashing when password is updated new, if user want to update anyother then just return
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JwtTimestamp){
    if(this.passwordChangedAt){
        const timestampChangedFormat = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JwtTimestamp < timestampChangedFormat;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

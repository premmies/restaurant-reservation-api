// controllers/auth.js
const User = require('../models/User');
const { sendNotifications } = require('../utils/notifications');

//@desc      Register user
//@route     POST /api/v1/auth/register
//@access    Public
exports.register=async (req, res, next)=>{
    try{
        const {name, tel, email, password}=req.body || {};
        if ([name, tel, email, password].some(value => typeof value !== 'string' || !value.trim())) {
            return res.status(400).json({success:false, message:'Name, telephone, email and password are required'});
        }

        //Create user
        const user= await User.create({
            name,
            email,
            password,
            tel
        });
        //const token=user.getSignedJwtToken();
        //res.status(200).json({success:true,token});
        sendTokenResponse(user,200,res);
    } catch(err){
        res.status(400).json({success:false});
        
    }

};
// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    const { email, password } = req.body || {};

    // Validate email & password
    if (!email || !password) {
        return res.status(400).json({ success: false, msg: 'Please provide an email and password' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(401).json({ success: false, msg: 'Cannot convert email or password to string' });
    }

    // Check for user
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
        return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    // Create token
    //const token = user.getSignedJwtToken();

    //res.status(200).json({ success: true, token });
    sendTokenResponse(user,200,res);

};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        token
    });
};
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
}

exports.changeEmail = async (req, res) => {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Provide a valid email address' });
    }

    const oldEmail = req.user.email;
    const newEmail = email.trim().toLowerCase();
    if (newEmail === oldEmail) {
        return res.status(400).json({ success: false, message: 'New email must differ from the current email' });
    }

    let updatedUser;
    try {
        updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id },
            { $set: { email: newEmail } },
            { returnDocument: 'after', runValidators: true }
        );
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email address is already registered' });
        }
        throw err;
    }
    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    const { failedCount } = await sendNotifications([
        {
            to: oldEmail,
            subject: 'Restaurant account email changed',
            text: `The email address for your restaurant account was changed to ${newEmail}. If you did not make this change, contact support.`
        },
        {
            to: newEmail,
            subject: 'Email address added to your restaurant account',
            text: `This address is now associated with your restaurant account. The previous address was ${oldEmail}. If you did not make this change, contact support.`
        }
    ]);

    if (failedCount) {
        return res.status(502).json({
            success: false,
            emailUpdated: true,
            message: 'Email was updated, but one or more notification emails could not be sent',
            notificationFailures: failedCount
        });
    }
    res.status(200).json({ success: true, data: { email: updatedUser.email } });
};

//@desc      Log user out / clear cookie
//@route     GET /api/v1/auth/logout
//@access    Private
exports.logout = async (req, res, next) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({ success: true, data: {} });
};
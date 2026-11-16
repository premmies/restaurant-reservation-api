// routes/auth.js

const express= require('express');
const
{register , login, getMe, logout, changeEmail}=require('../controllers/auth');

const router=express.Router();
const {protect} = require('../middleware/auth');
router.post('/register',register);
router.post('/login',login);
router.get('/me',protect, getMe);
router.patch('/email',protect, changeEmail);
router.get('/logout',protect,logout);
module.exports=router;
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next)=>{
  const { 
    phonenumber, 
    fullname, 
    password, 
    transportType,
    transportGovNumber,
    baggageVolume,
    volumeType
  } = req.body;

  if(!req.files){
    return next(
      new ErrorResponse(`Пожалуйста загрузите файлы`, 400)
    );
  }

  const passportPhoto = req.files.passportPhoto;
  const techPassportPhoto = req.files.techPassportPhoto;

  // Make sure the image is a photo
  if(!passportPhoto.mimetype.startsWith('image') && !techPassportPhoto.mimetype.startsWith('image')){
    return next(new ErrorResponse(`Пожалуйста загрузите файлы типа изображения`, 400));
  }

  // Check the file size of image
  if(passportPhoto.size > process.env.MAX_FILE_UPLOAD || techPassportPhoto.size > process.env.MAX_FILE_UPLOAD){
    return next(new ErrorResponse(`Максимально допустимый размер изображения ${process.env.MAX_FILE_UPLOAD}`, 400));
  }

  // Create custom filename
  passportPhoto.name = `photo_${new Date().getTime()}${path.parse(passportPhoto.name).ext}`;
  techPassportPhoto.name = `photo_${new Date().getTime()}${path.parse(techPassportPhoto.name).ext}`;

  passportPhoto.mv(`${process.env.FILE_UPLOAD_PATH}/${passportPhoto.name}`, async err =>{
    if(err){
      console.error(err);
      return next(new ErrorResponse(`Проблема с загрузкой файлов`, 500));
    }
  });
  techPassportPhoto.mv(`${process.env.FILE_UPLOAD_PATH}/${techPassportPhoto.name}`, async err =>{
    if(err){
      console.error(err);
      return next(new ErrorResponse(`Проблема с загрузкой файлов`, 500));
    }
  });

  //Create user
  const user = await User.create({
    phonenumber, 
    fullname, 
    password, 
    transportType,
    transportGovNumber,
    baggageVolume,
    volumeType,
    passportPhoto: passportPhoto.name,
    techPassportPhoto: techPassportPhoto.name
  });

  sendTokenResponse(user, 200, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next)=>{
  const { phonenumber, password } = req.body;

  // Validate email & password
  if(!phonenumber || !password){
    return next(new ErrorResponse('Пожалуйста введите номер телефона и пароль', 400));
  }

  //Check for the user
  const user = await User.findOne({ phonenumber }).select('+password');

  if(!user) {
    return next(new ErrorResponse('Некорректные данные', 401));
  }

  // Check passwords
  const isMatch = await user.matchPassword(password);

  if(!isMatch){
    return next(new ErrorResponse('Некорректные данные', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Get user
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next)=>{
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Update user data details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if(!(await user.matchPassword(req.body.currentPassword))){
    return next(new ErrorResponse('Parol xato kiritildi', 401));
  }

  user.password = req.body.newPassword;
  user.fullname = req.body.fullname;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Update user status
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    status: req.body.status,
    location: req.body.location,
    timeOfStatus: req.body.timeOfStatus
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  let role;

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if(process.env.NODE_ENV === 'production'){
    options.secure = true;
  }

  if(user.role === 'admin'){
    role = 'admin';
  } else {
    role = 'driver';
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role
    });
};
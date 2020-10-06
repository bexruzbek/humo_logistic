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

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if(process.env.NODE_ENV === 'production'){
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
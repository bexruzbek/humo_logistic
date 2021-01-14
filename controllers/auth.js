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
    typeOfCar,
    transportGovNumber,
    baggageVolume,
    baggageMass,
    location,
    oneID
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
  techPassportPhoto.name = `photo_${new Date().getTime() + 5}${path.parse(techPassportPhoto.name).ext}`;

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
    typeOfCar,
    transportGovNumber,
    baggageVolume,
    baggageMass,
    location,
    passportPhoto: passportPhoto.name,
    techPassportPhoto: techPassportPhoto.name,
    oneID: [oneID]
  });

  sendTokenResponse(user, 200, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next)=>{
  const { phonenumber, password, oneID } = req.body;

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

  let arrOfIds = [...user.oneID];
  const index = user.oneID.indexOf(oneID);

  if(index < 0){
    arrOfIds.push(oneID);
    await User.findByIdAndUpdate(user.id, {oneID: arrOfIds}, {
      new: true,
      runValidators: true
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Logout user
// @route     POST /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next)=>{
  const { oneID } = req.body;

  const user = await User.findById(req.user.id);

  let arrOfIds = [...user.oneID];
  const index = user.oneID.indexOf(oneID);

  if(index > -1){
    arrOfIds.splice(index,1);
    await User.findByIdAndUpdate(user.id, {oneID: arrOfIds}, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({ success: true, data: {} });

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

  if(req.body.phonenumber){
    user.phonenumber = req.body.phonenumber;
  }
  if(req.body.fullname){
    user.fullname = req.body.fullname;
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc      Edit user profile
// @route     PUT /api/v1/auth/editprofile
// @access    Private
exports.editProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if(req.files){
    if(!req.files.passportPhoto && req.files.techPassportPhoto){
      const techPassportPhoto = req.files.techPassportPhoto;
    
      // Make sure the image is a photo
      if(!techPassportPhoto.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Пожалуйста загрузите файлы типа изображения`, 400));
      }
    
      // Check the file size of image
      if(techPassportPhoto.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Максимально допустимый размер изображения ${process.env.MAX_FILE_UPLOAD}`, 400));
      }
    
      // Create custom filename
      techPassportPhoto.name = `photo_${new Date().getTime() + 5}${path.parse(techPassportPhoto.name).ext}`;
    
      techPassportPhoto.mv(`${process.env.FILE_UPLOAD_PATH}/${techPassportPhoto.name}`, async err =>{
        if(err){
          console.error(err);
          return next(new ErrorResponse(`Проблема с загрузкой файлов`, 500));
        }
      });
  
      user.techPassportPhoto = techPassportPhoto.name; 
    } else if(!req.files.techPassportPhoto && req.files.passportPhoto){
      const passportPhoto = req.files.passportPhoto;
    
      // Make sure the image is a photo
      if(!passportPhoto.mimetype.startsWith('image')){
        return next(new ErrorResponse(`Пожалуйста загрузите файлы типа изображения`, 400));
      }
    
      // Check the file size of image
      if(passportPhoto.size > process.env.MAX_FILE_UPLOAD){
        return next(new ErrorResponse(`Максимально допустимый размер изображения ${process.env.MAX_FILE_UPLOAD}`, 400));
      }
    
      // Create custom filename
      passportPhoto.name = `photo_${new Date().getTime()}${path.parse(passportPhoto.name).ext}`;
    
      passportPhoto.mv(`${process.env.FILE_UPLOAD_PATH}/${passportPhoto.name}`, async err =>{
        if(err){
          console.error(err);
          return next(new ErrorResponse(`Проблема с загрузкой файлов`, 500));
        }
      });
  
      user.passportPhoto = passportPhoto.name; 
      
    } else if(req.files.passportPhoto && req.files.techPassportPhoto){
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
      techPassportPhoto.name = `photo_${new Date().getTime() + 5}${path.parse(techPassportPhoto.name).ext}`;
    
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
      user.passportPhoto = passportPhoto.name; 
      user.techPassportPhoto = techPassportPhoto.name; 
    }
  }
  
  if(req.body.fullname){
    user.fullname = req.body.fullname; 
  }
  if(req.body.phonenumber){
    user.phonenumber = req.body.phonenumber; 
  }
  if(req.body.transportType){
    user.transportType = req.body.transportType; 
  }
  if(req.body.typeOfCar){
    user.typeOfCar = req.body.typeOfCar; 
  }
  if(req.body.transportGovNumber){
    user.transportGovNumber = req.body.transportGovNumber; 
  }
  if(req.body.baggageMass){
    user.baggageMass = req.body.baggageMass; 
  }
  if(req.body.baggageVolume){
    user.baggageVolume = req.body.baggageVolume; 
  }
    
  const edited = await user.save();

  res.status(200).json({
    success: true,
    data: edited
  });
});

// @desc      Update user status
// @route     PUT /api/v1/auth/updatestatus
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
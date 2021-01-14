const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc      Get all users
// @route     GET /api/v1/users
// @access    Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc      Search all users
// @route     POST /api/v1/users/search?search
// @access    Private/Admin
exports.searchUsers = asyncHandler(async (req, res, next) => {
  const search = req.query.search;

  if(search === ""){
    res.send([]);
    return;
  }

  User.search(search, function(err, data) {
    if(err){
      console.log(err);
    }
    res.status(200).json(data);
  });

    
});

// @desc      Get one user
// @route     GET /api/v1/users/:id
// @access    Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Update user
// @route     PUT /api/v1/users/:id
// @access    Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Delete user
// @route     DELETE /api/v1/users/:id
// @access    Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Push Notification for drivers
// @route     POST /api/v1/users/sendmessage
// @access    Private/Admin
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { baggageMass, textMessage } = req.body;
  let oneIds = [];
  let users; 
  users = await User.find({ baggageMass }, 'oneID');

  if(baggageMass === 'ALL'){
    users = await User.find({}, 'oneID');
  }

  for(let i = 0; i < users.length; i++){
    if(users[i].oneID !== null){
      oneIds.push(...users[i].oneID);
    }
  }

  const sendNotification = function(data) {
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Basic NTRlMTc3YjgtODE1MS00YmNhLTllMmMtMWI3NGU2OTAwMzVj"
    };
    
    
    const options = {
      host: "onesignal.com",
      port: 443,
      path: "/api/v1/notifications",
      method: "POST",
      headers: headers
    };
    
    const https = require('https');
    const req = https.request(options, function(res) {  
      res.on('data', function(data) {
        console.log("Response:");
        console.log(JSON.parse(data));
      });
    });
    
    req.on('error', function(e) {
      console.log("ERROR:");
      console.log(e);
    });
    
    req.write(JSON.stringify(data));
    req.end();
  };
  
  var message = { 
    app_id: "140a7409-c287-4ff0-98a4-3dd919a3fb36",
    headings: {"en": "Logistic Notification"},
    contents: {"en": `${req.body.textMessage}`},
    include_player_ids: oneIds
  };
  
  sendNotification(message);
  console.log(oneIds);
  res.status(200).json({
    success: true,
    data: {}
  });
});
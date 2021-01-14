const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  phonenumber: {
    type: String,
    required: [true, 'Пожалуйста введите номер телефона'],
    unique: true
  },
  fullname: {
    type: String,
    required: [true, 'Пожалуйста введите ваше Ф.И.О']
  },
  password: {
    type: String,
    required: [true, 'Пожалуйста введите пароль'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['driver', 'admin'],
    default: 'driver'
  },
  transportType: {
    type: String,
    required: [true, 'Пожалуйста выберите тип транспорта']
  },
  typeOfCar: {
    type: String,
    required: [true, 'Пожалуйста выберите тип транспорта']
  },
  transportGovNumber: {
    type: String,
    required: [true, 'Пожалуйста введите государственный номер вашего транспорта']
  },
  baggageVolume: {
    type: Number,
    required: [true, 'Пожалуйста укажите объем вашего багажа']
  },
  baggageMass: {
    type: Number,
    required: [true, 'Пожалуйста укажите грузаподемность вашего багажа']
  },
  passportPhoto: {
    type: String,
    default: 'no-photo.jpg'
  },
  techPassportPhoto: {
    type: String,
    default: 'no-photo.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  timeOfStatus: {
    type: String
  },
  location: {
    type: String
  },
  status: {
    type: String,
    enum: ['Свободен', 'Занят'],
    default: 'Свободен'
  },
  oneID: [String]
});

//Creating indexes
UserSchema.index({ 
  fullname: 'text', 
  location: 'text', 
  transportType: 'text', 
  typeOfCar: 'text', 
  transportGovNumber: 'text' 
});

//Custom partial search method
UserSchema.statics = {
  searchPartial: function(q, callback) {
      return this.find({
          $or: [
              { "fullname": new RegExp(q, "gi") },
              { "location": new RegExp(q, "gi") },
              { "transportType": new RegExp(q, "gi") },
              { "typeOfCar": new RegExp(q, "gi") },
              { "transportGovNumber": new RegExp(q, "gi") },
          ]
      }, callback);
  },

  searchFull: function (q, callback) {
      return this.find({
          $text: { $search: q, $caseSensitive: false }
      }, callback);
  },

  search: function(q, callback) {
      this.searchFull(q, (err, data) => {
          if (err) return callback(err, data);
          if (!err && data.length) return callback(err, data);
          if (!err && data.length === 0) return this.searchPartial(q, callback);
      });
  },
};

// Hashing password with bcrypt
UserSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign & Get JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password with hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
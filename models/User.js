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
    required: [true, 'Пожалуста введите ваше Ф.И.О']
  },
  password: {
    type: String,
    required: [true, 'Пожалуйста введите пароль'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'driver'],
    default: 'user'
  },
  transportType: {
    type: String,
    required: [true, 'Пожалуста выберите тип транспорта']
  },
  transportGovNumber: {
    type: String,
    required: [true, 'Пожалуста введите государственный номер вашего транспорта']
  },
  baggageVolume: {
    type: String,
    required: [true, 'Пожалуста укажите объем вашего багажа']
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
  activity: {
    type: Boolean,
    default: false
  },
  location: {
    type: String
  },
  status: {
    type: String,
    enum: ['Свободен', 'Занят'],
    default: 'Свободен'
  }
});

// Hashing password with bcrypt
UserSchema.pre('save', async function(next){
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
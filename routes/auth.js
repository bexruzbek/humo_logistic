const { Router } = require('express');
const { 
  register,
  login,
  logout,
  getMe,
  updateDetails,
  editProfile,
  updateStatus
} = require('../controllers/auth');
const router = Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/updatedetails', protect, updateDetails);
router.put('/editprofile', protect, editProfile);
router.put('/updatestatus', protect, updateStatus);

module.exports = router;
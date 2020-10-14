const { Router } = require('express');
const { 
  register,
  login,
  getMe,
  updateDetails,
  updateStatus
} = require('../controllers/auth');
const router = Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatestatus', protect, updateStatus);

module.exports = router;
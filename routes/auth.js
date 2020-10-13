const { Router } = require('express');
const { 
  register,
  login,
  getMe,
  updateDetails
} = require('../controllers/auth');
const router = Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);

module.exports = router;
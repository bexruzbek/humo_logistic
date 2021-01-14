const { Router } = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  searchUsers,
  sendMessage
} = require('../controllers/users');

const User = require('../models/User');

const router = Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(advancedResults(User), getUsers);
  
router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.route('/search').post(searchUsers);
router.route('/sendmessage').post(sendMessage);
  
module.exports = router;
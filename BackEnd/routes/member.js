// routes/member.js
const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { auth, authorize } = require('../middleware/auth');

// Member update information
router.put('/update-profile', auth, authorize('member'), memberController.updateProfile);


module.exports = router;
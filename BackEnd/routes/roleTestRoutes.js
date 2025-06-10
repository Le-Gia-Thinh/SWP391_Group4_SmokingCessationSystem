// routes/roleTestRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Admin truy cập
router.get('/admin', auth, authorize('admin'), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.name}` });
});

// Coach truy cập
router.get('/coach', auth, authorize('coach'), (req, res) => {
  res.json({ message: `Welcome Coach ${req.user.name}` });
});

// Member truy cập
router.get('/member', auth, authorize('member'), (req, res) => {
  res.json({ message: ` Welcome member ${req.user.name}` });
});

module.exports = router;
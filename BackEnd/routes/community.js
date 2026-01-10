// routes/community.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const communityController = require('../controllers/communityPostController');

router.post('/', auth, communityController.createPost);
router.get('/', communityController.getAllPosts);
router.put('/:id', auth, communityController.updatePost);
router.delete('/:id', auth, communityController.deletePost);

// Admin duyệt
router.put('/:id/approve', auth, authorize('admin'), communityController.approvePost);

// Admin routes
router.get('/pending', auth, authorize('admin'), communityController.getPendingPosts);
router.delete('/admin/:id', auth, authorize('admin'), communityController.adminDeletePost);

module.exports = router;
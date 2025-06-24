// routes/community.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const communityController = require('../controllers/communityPostController');

router.post('/', auth, communityController.createPost);
router.get('/', communityController.getAllPosts);
router.put('/:id', auth, communityController.updatePost);
router.delete('/:id', auth, communityController.deletePost);

module.exports = router;
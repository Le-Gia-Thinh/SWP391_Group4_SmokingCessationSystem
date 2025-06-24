// routes/comment.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// Thêm comment
router.post('/', auth, commentController.createComment);

// Lấy danh sách comment theo bài viết
router.get('/:postId', commentController.getCommentsByPost);

// Update comment
router.put('/:id', auth, commentController.updateComment);

// Delete comment
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

// Gửi tin nhắn (POST /chat/:session_id/message)
router.post('/:session_id/message', auth, chatController.sendMessage);

// Lấy tin nhắn (GET /chat/:session_id/messages?before=&limit=)
router.get('/:session_id/messages', auth, chatController.getMessages);

// Đánh dấu đã dọc tin nhắn
router.put('/:session_id/read', auth, chatController.markAsRead);

module.exports = router;
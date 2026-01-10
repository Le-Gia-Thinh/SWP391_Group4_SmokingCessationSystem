const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const upload = require('../utils/chatUpload');

// Gửi tin nhắn hỗ trợ liên tục (POST /chat/guided/send)
router.post('/guided/send', auth, upload.single('file'), chatController.sendGuidedMessage);

// Lấy tin nhắn theo partner_id (GET /chat/guided/:partner_id)
router.get('/guided/:partner_id', auth, chatController.getGuidedMessages);

// Lấy tin nhắn theo thread_id (GET /chat/thread/:thread_id)
router.get('/thread/:thread_id', auth, chatController.getMessagesByThreadId);

// API thay thế - lấy tin nhắn trực tiếp theo thread_id (GET /chat/guided/:thread_id/messages)
router.get('/guided/:thread_id/messages', auth, chatController.getMessagesByThreadId);

// Tìm thread_id dựa trên coach_id (GET /chat/find-thread-by-coach/:coach_id)
router.get('/find-thread-by-coach/:coach_id', auth, chatController.findThreadByCoach);

// Đánh dấu đã đọc (PUT /chat/guided/:thread_id/mark-read)
router.put('/guided/:thread_id/mark-read', auth, chatController.markGuidedAsRead);

// Lấy danh sách tất cả các cuộc trò chuyện của người dùng
router.get('/guided', auth, chatController.getChatThreads);

module.exports = router;
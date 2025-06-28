const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/topicChatController');

router.post('/topics', auth, controller.createTopic);
router.get('/topics', auth, controller.getTopics);
router.post('/messages', auth, controller.sendTopicMessage);
router.get('/messages/:topicId', auth, controller.getTopicMessages);

module.exports = router;

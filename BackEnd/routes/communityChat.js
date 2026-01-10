const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const controller = require('../controllers/communityChatController');

router.post('/', auth, controller.sendMessage);

router.get('/', auth, controller.getMessages);

module.exports = router;    
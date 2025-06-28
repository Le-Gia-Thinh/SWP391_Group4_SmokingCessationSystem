
// routes/subscription.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

router.get('/packages', subscriptionController.getPackages);
router.post('/', auth, subscriptionController.createSubscription);
router.get('/current', auth, subscriptionController.getUserSubscription);
router.get('/history', auth, subscriptionController.getSubscriptionHistory);

module.exports = router;

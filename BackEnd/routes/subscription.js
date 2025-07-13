/**
 * routes/subscription.js
 *
 * Router cho chức năng đăng ký gói dịch vụ.
 */
const express  = require('express');
const router   = express.Router();

/*  Import đúng dạng *named export*  */
const { auth } = require('../middleware/auth');

const subCtl   = require('../controllers/subscriptionController');

/* ----- Packages ----- */
router.get('/packages', subCtl.getAllPackages);

/* ----- Subscription của user (cần đăng nhập) ----- */
router.get('/current',   auth, subCtl.getCurrentSubscription);
router.get('/history',   auth, subCtl.getHistory);

/* ----- Tổng số ngày còn lại ----- */
router.get('/remaining', auth, subCtl.getRemainingDays);

module.exports = router;

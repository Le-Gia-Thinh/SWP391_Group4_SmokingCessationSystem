const express = require("express");
const router = express.Router();
const { getUserNotifications } = require("../controllers/notificationController");
const { auth } = require("../middleware/auth");

router.get("/", auth, getUserNotifications);

module.exports = router;
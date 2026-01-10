// routes/user.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const userController = require("../controllers/userController");
const userStatsController = require("../controllers/userStatsController");
const { sql, dbConfig } = require('../config/database');

router.get('/savings', auth, userStatsController.getUserSavings);
router.get('/saving-per-day', auth, userStatsController.getUserSavingsPerDay);
router.get('/achievements', auth, userStatsController.getUserAchievements);
router.get('/progress-summary', auth, userStatsController.getUserProgressSummary);
router.get("/me", auth, userController.getMe);
router.put("/profile", auth, userController.updateProfile);
router.get("/plan", auth, userController.getUserPlan);

module.exports = router;
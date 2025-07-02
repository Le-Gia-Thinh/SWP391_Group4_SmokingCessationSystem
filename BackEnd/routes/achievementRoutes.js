const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const middleware = require("../middleware/auth");
const authMiddleware = middleware.auth;

router.get("/", achievementController.getAllAchievements);
router.get("/unlocked", authMiddleware, achievementController.getUnlockedAchievements);
module.exports = router;

const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");

router.get("/", achievementController.getAllAchievements);
// Tự động mở khóa các thành tựu
router.get("/unlocked", auth, achievementController.getUnlockedAchievements);
module.exports = router;

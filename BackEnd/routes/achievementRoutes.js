const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");

router.get("/", achievementController.getAllAchievements);

module.exports = router;

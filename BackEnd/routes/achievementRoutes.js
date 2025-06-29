const express = require("express");
const router = express.Router();
const { checkDailyNoSmoking } = require("../controllers/achievementController");
const { auth } = require("../middleware/auth");

router.post("/check-daily", auth, checkDailyNoSmoking);

module.exports = router;

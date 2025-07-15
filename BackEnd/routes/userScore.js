// routes/userScore.js
const express = require("express");
const router = express.Router();
const {
  getRanking,
  getMyRanking,
  updateUserScore,
} = require("../controllers/userScoreController");
const { auth } = require("../middleware/auth");

router.get("/ranking", getRanking);
router.get("/ranking/me", auth, getMyRanking);
router.post("/update", updateUserScore);

module.exports = router;

// routes/userScore.js
const express = require("express");
const router = express.Router();
const { getRanking, updateUserScore } = require("../controllers/userScoreController");

router.get("/ranking", getRanking);
router.post("/update", updateUserScore);

module.exports = router;

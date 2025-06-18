// routes/userScore.js
const express = require("express");
const router = express.Router();
const { getRanking } = require("../controllers/userScoreController");

router.get("/ranking", getRanking);

module.exports = router;

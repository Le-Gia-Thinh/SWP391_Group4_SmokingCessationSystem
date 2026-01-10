// routes/userScore.js
const express = require("express");
const router = express.Router();
const {
  getRanking,
  getMyRanking,
  updateUserScore,
  getRankingStats,
  getTopPerformersByLevel,
} = require("../controllers/userScoreController");
const { auth } = require("../middleware/auth");

// Middleware để log requests
router.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Public routes - không cần authentication
router.get("/ranking", getRanking);
router.get("/stats", getRankingStats);
router.get("/top/:level", getTopPerformersByLevel);

// Protected routes - cần authentication
router.get("/ranking/me", auth, getMyRanking);
router.post("/update", auth, updateUserScore);

// Alternative route for updating score (có thể gọi từ cron job hoặc admin)
router.put("/update/:userId", updateUserScore);

module.exports = router;
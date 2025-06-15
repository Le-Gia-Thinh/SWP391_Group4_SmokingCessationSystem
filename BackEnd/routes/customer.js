const express = require("express");
const router = express.Router();
const ftndController = require("../controllers/ftndController");

// Lấy mức độ FTND của user
router.get("/ftnd-level/:userId", ftndController.getFtndLevel);

module.exports = router;

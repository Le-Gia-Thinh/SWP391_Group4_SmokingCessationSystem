// routes/ftnd.js
const express = require("express");
const router = express.Router();
const ftndController = require("../controllers/ftndController");

router.get("/exists/:userId", ftndController.checkFTNDExists);
router.post("/result", ftndController.submitFTNDResult);

module.exports = router;
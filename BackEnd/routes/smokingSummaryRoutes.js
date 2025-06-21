const express = require("express");
const router = express.Router();
const { submitSingleSmokingSummary,getAllSmokingSummary, } = require("../controllers/smokingSummaryController.js");
const { auth } = require("../middleware/auth");

router.post("/single", auth, submitSingleSmokingSummary);
router.get("/all/:user_id", getAllSmokingSummary);

module.exports = router;
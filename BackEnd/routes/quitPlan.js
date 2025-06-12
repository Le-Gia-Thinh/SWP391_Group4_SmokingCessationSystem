// routes/quitPlan.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/quitPlanController");

router.get("/exists/:userId", controller.checkPlanExists);
router.post("/save", controller.savePlan);
router.post("/reset", controller.resetPlan);

module.exports = router;
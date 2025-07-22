const express = require("express");
const router = express.Router();
const phaseController = require("../controllers/phaseController");

// Route để lấy tất cả phases
router.get("/phases", phaseController.getPhases);

// Route để lấy tất cả behavior phases với tasks
router.get("/behavior-phases", phaseController.getBehaviorPhases);

// Route để lấy tasks cho một giai đoạn cụ thể
router.get("/behavior-phases/:phaseId", phaseController.getTasksByPhase);

module.exports = router;

// taskRoutes.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

router.get("/", taskController.getAllTasks);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

router.get("/phases", taskController.getBehaviorPhaseList);
router.get("/main-phases", taskController.getPhases);
router.get(
  "/behavior-phases-with-tasks",
  taskController.getBehaviorPhasesWithTasks
);

module.exports = router;

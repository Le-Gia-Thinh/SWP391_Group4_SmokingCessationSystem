// routes/achievementRoutes.js
const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const { auth, authorize } = require("../middleware/auth");

// --- Các route cũ ---
router.get("/", achievementController.getAllAchievements);
router.get("/unlocked", auth, achievementController.getUnlockedAchievements);

// --- Các route mới chỉ dành cho admin ---
// Xem chi tiết 1 achievement
router.get(
    "/:id",
    auth,               // nếu bạn muốn bắt buộc login mới xem chi tiết
    authorize("admin"), // hoặc bỏ authorize nếu ai cũng xem được
    achievementController.getAchievementById
);

// Tạo mới achievement
router.post(
    "/",
    auth,
    authorize("admin"),
    achievementController.createAchievement
);

// Cập nhật achievement
router.put(
    "/:id",
    auth,
    authorize("admin"),
    achievementController.updateAchievement
);

// Xóa achievement
router.delete(
    "/:id",
    auth,
    authorize("admin"),
    achievementController.deleteAchievement
);

module.exports = router;

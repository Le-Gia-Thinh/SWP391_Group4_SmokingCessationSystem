const express = require("express");
const router = express.Router();
const adminMemberController = require("../controllers/adminMemberController");
const { auth, authorize } = require("../middleware/auth");

// 📦 QUẢN LÝ MEMBER (chỉ Admin mới được dùng)

// Lấy danh sách Member
router.get(
  "/",
  auth,
  authorize("admin"),
  adminMemberController.getAllMembers
);

// Cập nhật thông tin Member
router.put(
  "/:user_id",
  auth,
  authorize("admin"),
  adminMemberController.updateMember
);

// Khóa tài khoản Member
router.patch(
  "/:user_id/lock",
  auth,
  authorize("admin"),
  adminMemberController.lockMember
);

// Mở khóa tài khoản Member
router.patch(
  "/:user_id/unlock",
  auth,
  authorize("admin"),
  adminMemberController.unlockMember
);

// Xóa mềm Member
router.delete(
  "/:user_id",
  auth,
  authorize("admin"),
  adminMemberController.softDeleteMember
);

module.exports = router;
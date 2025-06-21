// routes/user.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const userController = require("../controllers/userController");

router.get("/me", auth, userController.getMe);

module.exports = router;
router.get("/plan", auth, async (req, res) => {
    const pool = await sql.connect(dbConfig);
    const { recordset } = await pool
        .request()
        .input("uid", sql.Int, req.user.id)
        .query("SELECT plan_type FROM CUSTOMER WHERE user_id = @uid");
    res.json({ plan: recordset[0]?.plan_type || "member" });
});
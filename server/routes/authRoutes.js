const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginLimiter = require("../middlewares/loginLimiter");

// Register route
router.route("/register").post(authController.register);

// Login route
router.route("/").post(loginLimiter, authController.login);

// Refresh route
router.route("/refresh").get(authController.refresh);

// Logout route
router.route("/logout").post(authController.logout);

module.exports = router;

const express = require("express");
const authController = require("../controllers/usercontroller");

const router = express.Router();
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);
// router.use(authController.authorizedRoute);

module.exports = router;

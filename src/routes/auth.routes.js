const express = require("express")
const authController = require("../controller/auth.controller") 
const route = express.Router();

/**
 * POST /api/auth/register
 */
route.post("/register",authController.userRegisterConltroller)

/**
 *  POST /api/auth/login 
 */
route.post("/login",authController.userLoginController)

/**
 * - POST /api/auth/logout
 */
route.post("/logout", authController.userLogoutController)

module.exports = route
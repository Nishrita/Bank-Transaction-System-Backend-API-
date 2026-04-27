const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountColtroller = require("../controller/account.controller")


const Router = express.Router()



/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
Router.post("/",authMiddleware.authMiddleware,accountColtroller.createAccountController);


/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
Router.get("/",authMiddleware.authMiddleware,accountColtroller.getUserAccountsController)


/**
 * - GET /api/accounts/balance/:accountId
 */
Router.get("/balance/:accountId", authMiddleware.authMiddleware, accountColtroller.getAccountBalanceController)


module.exports = Router

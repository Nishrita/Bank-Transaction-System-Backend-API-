const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controller/transaction.controller");
const transactionModel = require("../models/transaction.model");
const transactionRoutes = express.Router();

/**
 * - POST api/transaction
 * - Create a new transaction
 */

transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction);

/**
 * - POST api/transaction/system/initial-funds
 * - Create initial funds transaction from system user
 */

transactionRoutes.post("/system/initial-funds",authMiddleware.authMiddleware,transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;
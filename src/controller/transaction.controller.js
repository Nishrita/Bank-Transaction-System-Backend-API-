const transactionModel = require("../models/transaction.model")
const ledger = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")
const ledgerModel = require("../models/ledger.model")
/**
 * Create a new transaction
 *
 * THE 10-STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
 */


async  function  createTransaction(req,res){

    /**
     * - 1. Validate Request
     */
    const {fromAccount, toAccount, amount, idempotencyKey} =  req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message : "fromAccount, toAccount, amount and idempotencyKey is required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id : fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id : toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
         message: "Invalid fromAccount or toAccount"
        })
    }


    /**
     * - 2.Validate idempotencyKey
     */
    const transactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    }) 

    if(transactionAlreadyExists){

        if(transactionAlreadyExists.status === "COMPLETE"){
            return res.status(200).json({
                message: "Transaction Already COMPLETE",
                transaction:transactionAlreadyExists
            })
        }

        if(transactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message: "Transaction  still Processing",
            })
        }

        if(transactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message: "Transaction  processing faild. Please ,try again",
                
            })
        }

        if(transactionAlreadyExists.status === "REVERSED"){
            return res.status(500).json({
                message: "Transaction  was reversed. Please ,try again",
                
            })
        }
    }


    /**
     * - 3.Check Account Status
     */
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * - 4. Derive sender balance from ledger
     */

    const balance = await fromUserAccount.getBalance();

    if(balance <amount){
        return res.status(400).json({
            message:`Insufficient Balance. Current balance is ${balance}.Requested amount is ${amount}`
        })
    }

    /**
     * - 5. Create transaction (PENDING)
     */
    

    const session = await mongoose.startSession()
    session.startTransaction()

    let transaction;

    try{
     transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING"
    }],{session}))[0]
    

    /**
     * - 6. Create DEBIT ledger entry
     */
    const createDebitLedgerEntry = await ledgerModel.create([{
        account:fromAccount,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    }],{session})


    await (()=>{
        return  new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })()

    /**
     * - 7. Create CREDIT ledger entry
     */
    const createCreditLedgerEntry = await ledgerModel.create([{
        account:toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    }],{session})


    
    /**
     * - 8. Mark transaction COMPLETED
     */
    await transactionModel.findOneAndUpdate(
        {_id:transaction._id},
        {status:"COMPLETE"},
        {session}

    )

     /**
     * -  9. Commit MongoDB session
     */
    await session.commitTransaction()
    session.endSession()

   }catch(error){
         return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })
   }
   
    /**
     * - 10. Send email notification
     */
    await emailService.sendTransactionEmail(req.user.email,req.user.name, amount,toAccount);
    return res.status(200).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
} 

async function createInitialFundsTransaction(req,res){

    const {toAccount, amount, idempotencyKey} = req.body 
    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message: " toAccount, amount and idempotency key is required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id : toAccount
    })

    if(!toUserAccount){
       return  res.status(400).json({
            message:"Invalid Account"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        
        user: req.user._id
    })

    if(!fromUserAccount){
       return res.status(400).json({
            message:"System user account not found"
        })
    }

    const session  = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING"
    })
    
    await transaction.save({ session })

     const createDebitLedgerEntry = await ledgerModel.create([{
        account:fromUserAccount._id,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    }],{session})

    const createCreditLedgerEntry = await ledgerModel.create([{
        account:toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    }],{session})

    transaction.status = "COMPLETE"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

     return res.status(200).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction

}
const userModel = require("../models/user.model")
const jwt =  require("jsonwebtoken")
const emailServices = require("../services/email.service")
const tokenBlacklistModel = require("../models/blacklist.model")
// - user register controller
// - POST /api/auth/register

async function userRegisterConltroller (req,res){

    const {username,email,password} = req.body

    const isExist = await userModel.findOne({
          email : email
    })

    if(isExist){
       return  res.status(422).json({
          message : "User already exist with email"
       })
    }

    const user = await userModel.create({
        username,email,password
    })

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)
    res.status(201).json({
        user: {
            _id: user._id,
            email:user.email,
            username:user.username
        },
        token
    })
    await emailServices.sendRegistrationEmail(user.email,user.username);
}


// - user login controller
// - POST /api/auth/login
async function userLoginController(req,res){

    const {username, email, password} = req.body;
    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        res.status(401).json({
            message:"Email or password is Invalid"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        res.status(401).json({
            message:"Email or password is Invalid"
        })
    }

     const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)
    res.status(200).json({
        user: {
            _id: user._id,
            email:user.email,
            username:user.username
        },
        token
    })


}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }



    await tokenBlacklistModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}

module.exports = {
    userRegisterConltroller ,
    userLoginController,
    userLogoutController
} 
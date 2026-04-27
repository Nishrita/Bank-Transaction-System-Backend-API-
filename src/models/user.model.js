const mongoose = require("mongoose")
const bcrypt  = require("bcryptjs")

const userSchema = new mongoose.Schema({

    email : {
        type : String,
        required : [true,"Email is required"],
        trim: true,
        lowercase : true,
        match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ ],
        unique : [true, "Email already exists"]
    },
    username: {
        type: String,
        required : [true,"Name is required for  creating account"],
    },
    password: {
        type :String,
        required : [true,"Password is required for creating an account"],
        minlength :[6,"Password should contain more than 6 charecters"],
        select: false
    },

    systemUser:{
        type: Boolean,
        default : false,
        select : false,
        immutable: true 
    }

},{
    timestamps : true
})


userSchema.pre("save",async function(){

    if(!this.isModified("password")){
        return 
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return 
})

userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password,this.password)
}

const userModel = mongoose.model("user",userSchema);

module.exports = userModel;
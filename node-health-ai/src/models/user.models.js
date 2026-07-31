import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
},
{
    timestamps:true
})



//hash password 
userSchema.pre("save", async function (){
    if(!this.isModified("password")) return ;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);

})

//compare password 

userSchema.methods.comparePassword = async function (password){
    return bcrypt.compare(password , this.password)
}

export default mongoose.model("User",userSchema)

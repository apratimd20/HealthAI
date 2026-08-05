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
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    profileImage: {
        type: String,
        default: null,
    },
    lastActiveAt: {
        type: Date,
        default: null,
    },
    suspendedAt: {
        type: Date,
        default: null,
    },
},
{
    timestamps:true
})

userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1 });



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

import mongoose , { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
    {
        userName:{
            type: String,
            required: true,
            unique: true,
            lowercase:true,
            trim:true,
            index:true
        },
        userName:{
            type: String,
            required: true,
            unique: true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type: String,
            required: true,
            trim:true,
            index:true
        },
        avatar:{
            type: String, //cloudinary url
            required: true,
            
        },
        coverImage:{
            type: String
           
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        passowrd:{
            type: String,
            required: [true, 'Password is required']
            
        },
        refreshToken:{
            type: String
        },
        
        
    },{timestamps:true}

);
userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
})
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}
userSchema.methods.generateToken = function(){
    return jwt.sign({_id: this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName,
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn:process.env.ACCESS_TOKEN_EXPIRY});
}
userSchema.methods.generateToken = function(){
    return jwt.sign({_id: this._id,
        email:this.email,
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn:process.env.REFRESH_TOKEN_EXPIRY});
}
export const User = mongoose.model('User', userSchema);
import {asyncHandler} from "../utils/Asynchandler.js"
import jwt from 'jsonwebtoken'
import {User} from '../models/user.model.js'
import { ApiError } from '../utils/Apierror.js'
export const verifyJWT= asyncHandler(
    async (req,_,next)=>{
        try{

        
        const token = req.cookies?.accessToken ||  req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(404,"Inavlid access token")
        }

        req.user=user;
        next()
    }catch(error){  
        throw new ApiError(401,error?.message || "invalid access token")
    }

         

    }
)
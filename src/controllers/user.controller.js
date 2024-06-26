import { asyncHandler } from '../utils/Asynchandler.js';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/Apierror.js';
import { ApiResponse } from '../utils/Apiresponse.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const  generateAccessAndRefreshTokens=(async(userId)=>{
    try{
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken 
        const refreshToken=user.generateRefreshToken

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    }catch(error){
        throw new ApiError(500,"Error generating tokens")
    }
})
const registerUser = (async (req,res)=>{
    //get user details from frontend
    const {fullName,email,password,userName} = req.body;
    console.log(email);
    //validation

    if(!fullName|| !email || !password){
        throw new ApiError(400,"Please provide email and password")
    }
    //check if user exists
    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    
    //check for images,avatar and coverImage
    const avatarLocalPath=req.files ?.avatar[0]?.path
    // const coverImageLocalPath=req.files ?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Please provide avatar")
    }   
    //upload to cloudinary
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    

    if(!avatar){
        throw new ApiError(400,"Error uploading avatar")
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
         
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    //create user object and create entry in db
    const user = await User.create({
        fullName,
        avatar:avatar.url ,
        coverImage:coverImage?.url  || "",
        email,
        password,
        userName:userName

    })
    //check if user created
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Error creating user")
    }
    //return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User created successfully")
    )
    





})
const loginUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const { email, password ,userName} = req.body;
    //username or eamil
    if(!email && !userName){
        throw new ApiError(400,"Please provide email or username")
    }
    const user= await User.findOne({
        $or: [{userName},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not found")
    }
    
    
    // check password
    const passwordValid = await user.isPasswordCorrect(password)
    if(!passwordValid){
        throw new ApiError(401,"Invalid password")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    //send in cookies
    const loggedinUser=await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options) 
    .json(new ApiResponse(200,
        {
        user:loggedinUser,accessToken,refreshToken
        },
        "User logged in successfully"
    ))


  
   
})
const logOutUser= asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken:1
            }
        },{
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookes.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request") 
    }
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user  = User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token expired/used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json ( 
            new ApiResponse(200,
                {accessToken,refreshToken:newrefreshToken},
                "Token refreshed successfully"
                
    
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
        
    }

})
const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user =await User.findById(req.user?._id)

    const passwordValid=await user.isPasswordCorrect(oldPassword)
    if(!passwordValid){
        throw new ApiError(401,"Invalid password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"User fetched successfully")
})
const updateAccountDetails=asyncHandler(async(req,res)=>{   
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"Please provide full name and email")
    }
    const user=User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .json(new ApiResponse(200,user,"User details updated successfully"))


})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user, "Avatar image updated successfully")
    )

})
const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }
    const cover=await uploadOnCloudinary(coverImageLocalPath)
    if(!cover.url){
        throw new ApiError(400,"error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            coverImage:cover.url
        }
    },
    {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user, "Cover image updated successfully")
    )

})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {userName}=req.params
    if(!userName?.trim()){
        throw new ApiError(400,"Please provide username")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },{
            $lookup:{
                from :"subscriptions",
                localField:"_id",
                foreignField :"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from :"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscriberCount:{$size:"$subscribers"},
                subscribedToCount:{$size:"$subscribedTo"},
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false 
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscriberCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                email:1,
                coverImage:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"Channel fetched successfully"))
})
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)

            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"uploadedBy",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1
                                    
                                    }
                                },
                                {owner:{    
                                    $first:"$owner"
                                }
                                    
                                }
                            ]
                        }
                    },
                        
                    
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0]?.watchHistory || [],"Watch history fetched successfully")
    )
})
export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory

}

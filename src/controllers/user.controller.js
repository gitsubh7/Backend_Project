// import {asyncHandler} from '../middlewares/multer.middleware.js';
// import {ApiError} from '../';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/Apierror.js';
import { ApiResponse } from '../utils/Apiresponse.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';


const generateAccessAndRefreshTokens=(async(userId)=>{
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
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Error uploading avatar")
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
         
    }

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
    if(!email || !userName){
        throw new ApiError(400,"Please provide email or username")
    }
    const user= await User.findOne({
        $or: [{userName},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not found")
    }
    //check password
    const isPasswordValid= await user.isPasswordMatch(password)
    if(!isPasswordValid){
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
            $set: {
                refreshToken:undefined
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
export {registerUser,loginUser,logOutUser}

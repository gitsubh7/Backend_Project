// import {asyncHandler} from '../middlewares/multer.middleware.js';
// import {ApiError} from '../';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/Apierror.js';
import { ApiResponse } from '../utils/Apiresponse.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
const registerUser = (async (req,res)=>{
    //get user details from frontend
    const {fullName,email,password} = req.body;
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
    const coverImageLocalPath=req.files ?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Please provide avatar")
    }   
    //upload to cloudinary
    const avatar= await uploadOnClodinary(avatarLocalPath)
    const coverImage= await uploadOnClodinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Error uploading avatar")
    }
    //create user object and create entry in db
    const user = await User.create({
        fullName,
        avatar:avatar.url ,
        coverImage:coverImage?.url  || "",
        email,
        password,
        username:username.toLowerCase()

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

export {registerUser}
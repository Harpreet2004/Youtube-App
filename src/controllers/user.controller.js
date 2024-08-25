import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
    // get user details from frontend
    // get if any field is empty or not
    // check if user already register: username,email
    // check for images, avatars
    // upload them to cloudinary
    // check if successfully uploaded on cloudinary
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // return res
    
    const {userName,email,fullName,password} = req.body;
    
    if([userName,email,fullName,password].some((field) => field?.trim() === ""))
        throw new ApiError(400,"All fields are required");
   

    const userExists = await User.findOne({
        $or: [{userName},{email}]
    })

    if(userExists) {
        throw new ApiError(409,"User with email or username already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400,"Avatar is required");
    }
    // console.log(req.body);

    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        userName: userName.toLowerCase(),
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})
export {registerUser};
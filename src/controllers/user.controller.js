import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        
        //**SAVE METHOD***
        //save method always validates before saving
        //in our case it will need password again to validate
        //as password is a required field,
        //so to make sure it does not do that we will just use
        //*validateBeforeSave* to false
        await user.save({validateBeforeSave : false});

        return {refreshToken,accessToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating the access and refresh token");
    }
}


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

const loginUser = asyncHandler(async (req,res) => {
    //get data from req body
    //check validation for all the fields
    //if valid then match the credentials with register
    //if user exist then match password
    //get access & refresh tokens 

    const {userName,email,password} = req.body;

    if(!(userName || email)) {
        throw new ApiError(400,"userName and Email is required");
    }

    //get user by userName
    // const userName = User.findOne({userName});

    //get user either by userName or email
    const user = await User.findOne({
        $or: [{userName},{email}]
    })

    if(!user) {
        throw new ApiError(404,"User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401,"Password is invalid");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        secure: true,
        httpsOnly: true
    }
    console.log(req.cookie);
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User Logged In Successfully!"
        )
    )
})

const logoutUser = asyncHandler(async (req,res) => {
    
})

export {
    registerUser,
    loginUser
};
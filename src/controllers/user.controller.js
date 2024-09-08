import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
    console.log(password);

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
    console.log(req.body);
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
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpsOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{}, "User Logged Out"))

})

const refreshAccessToken = asyncHandler( async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request");
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedRefreshToken._id);
    
        if(!user) {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly:true,
            secure:true
        }    
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})


const changePassword = asyncHandler(async(req,res) => {
    const {oldPassword,newPassword} = req.body;
    // console.log(req.body)

    const user = await User.findById(req.user?._id);

    const isPassCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPassCorrect) {
        throw new ApiError(400,"Password is not correct");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password is updated successfully")
    )
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    );
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body;

    if(!fullName || !email) {
        throw new ApiError(400,"All fields are required.");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                // fullName:fullName, can also be written as this (below is es6 syntax)
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Account details updated successfully")
    );

})


const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(400,"Error while uploading the avatar file");
    }

    const user = await User.findByIdAndUpdate(
        req.file?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )
})


const updateUserCoverImage = asyncHandler(async(req,res) => {
    const CoverImageLocalPath = req.file?.path;

    if(!CoverImageLocalPath) {
        throw new ApiError(400,"coverimage is missing");
    }

    const coverImage = await uploadOnCloudinary(CoverImageLocalPath);

    if(!coverImage.url) {
        throw new ApiError(400,"Error while uploading the coverImage file");
    }

    const user = await User.findByIdAndUpdate(
        req.file?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverImage updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {userName} = req.params;

    if(!userName?.trim()) {
        throw new ApiError(400,"Could not get the userName")
    }

    const channel = await User.aggregate([
        {
            $match:{
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                userName:1,
                email:1,
                fullName:1,
                coverImage:1,
                avatar:1,
                isSubscribed:1,
                channelsSubscribedToCount:1,
                subscribersCount:1
            }
        }
]);

    if(!channel?.length) {
        throw new ApiError(404,"channel does not exists.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    );

})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline: [
                                {
                                    $project:{
                                        userName:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
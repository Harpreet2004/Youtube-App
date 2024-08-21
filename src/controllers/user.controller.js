import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiErrors.js"
import {User} from "../models/user.models.js"

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
        throw new apiError(400,"All fields are required");
    })

    const userExists = User.findOne({
        $or: [{userName},{email}]
    })

    if(userExists) {
        throw new apiError(409,"User with email or username already exists.")
    }

export {registerUser};
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/apiErrors.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if(!content) {
        throw new ApiError(400,"Content is required");
    }
 
    const tweet = await Tweet.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            },
            pipeline: [
                {
                    $project: {
                        userName:1,
                        fullName:1,
                        avatar:1
                    }
                },
                {
                    $addFields: {
                        $first: "$owner"
                    }
                }
            ]
        }
])

    const createTweet = await Tweet.create({
        content,
        owner
    })

    if(!createTweet) {
        throw new ApiError(500,"Something went wrong while creating the tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet[0],
            "Tweet was created successfully"
        )
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userid} = req.params;

    //maybe trim required for the userid 
    //if bug happens try that too
    if(!userid) {
        throw new ApiError(400,"Could not get the userid")
    }

    // const getTweets = await Tweet.aggregate([
    //     {
    //         $match: {
    //             _id: userid
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: ""
    //         }
    //     }
    // ])

    const findUser = await Tweet.findById(userid);

    if(!findUser) {
        throw new ApiError(400,"Not able to find the user with the id");
    }

    

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
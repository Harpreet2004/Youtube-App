import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/apiErrors.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if(!content) {
        throw new ApiError(400,"Content is required");
    }
 
//     const tweet = await Tweet.aggregate([
//         {
//             $match: {
//                 _id: mongoose.Types.ObjectId
//             },
//         },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "owner"
//             },
//             pipeline: [
//                 {
//                     $project: {
//                         userName:1,
//                         fullName:1,
//                         avatar:1
//                     }
//                 },
//                 {
//                     $addFields: {
//                         $first: "$owner"
//                     }
//                 }
//             ]
//         }
// ])

    const createTweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if(!createTweet) {
        throw new ApiError(500,"Something went wrong while creating the tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createTweet,
            "Tweet was created successfully"
        )
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;

    //maybe trim required for the userid 
    //if bug happens try that too
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Could not get the userid")
    }

    const findAllUserTweets = await Tweet.find({
        owner: new mongoose.Types.ObjectId(userId)
    });

    if(!findAllUserTweets.length === 0) {
        throw new ApiError(400,"Not able to find the tweets");
    }

    return res
    .status(200)
    .json(
        200,
        findAllUserTweets,
        "All tweets fetched successfully"
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Required tweet could not be found");
    }

    if(!content) {
        throw new ApiError(400,"Tweet content is required");
    }


    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{ 
                content: content
            }
        },
        {new: true}
    ).select("-owner")

    if(!tweet){
        throw new ApiError(500,"There was some error while updating the tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet is updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params._id;

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400,"The tweet you want to delete cannot be accessed.")
    }

    const tweetDelete = await Tweet.findByIdAndDelete(tweetId);

    if(!tweetDelete) {
        throw new ApiError(500,"Something went wrong while deleting the tweet.")
    }

    return res
    .status(
        200,
        tweetDelete,
        "Tweet is deleted successfully"
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
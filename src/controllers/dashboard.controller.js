import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
// import {Subscription} from "../models/subscription.models.js"
// import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/apiErrors.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;

    if(!userId){
        throw new ApiError(404,"User does not exist");
    }

    const allStats = await Video.aggregate([
        {
            $match:{
                owner: userId
            }
        },
        //get all subscribers
        {
            $lookup:{
                from:"subscriptions",
                localField:"owner",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        //get all channels user has subscribedTo
        {
            $lookup:{
                from:"subscriptions",
                localField:"owner",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        //get all videos
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"video",
                as:"allVideos"
            }
        },
        //get all likes for user's videos
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"allLikedVideos"
            }
        },
        //get all comments for user's videos
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"allComments"
            }
        },
        //get all tweets by user
        {
            $lookup:{
                from:"tweets",
                localField:"owner",
                foreignField:"owner",
                as:"allUserTweets"
            }
        },
        //calculate Stats
        {
            $group:{
                _id: null,
                totalVidoes:{$sum:1},
                totalViews: {$sum: "$views"},
                subscriber: {$first:"$subscribers"},
                subscribedTo: {$first:"$subscribedTo"},
                totalLikes: {$sum:{$size:"$allLikedVideos"}},
                totalComments:{$sum:{$size:"$allComments"}},
                totalTweets:{$first:{$size:"$allUserTweets"}}
            }
        },
        {
            $project:{
                _id:0,
                totalViews:1,
                totalVideos:1,
                subscribers:{ $size: "$subscribers"},
                subscribedTo: { $size: "$subscribedTo"},
                totalLikes:1,
                totalComments:1,
                totalTweets:1
            }
        }
    ]);

    if(!allStats){
        throw new ApiError(500,"Something went wrong while fetching the channel Stats");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allStats,
            "Stats details fetched successfully"
        )
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(420,"Channel does not exist")
    }

    const videos = await Video.find({
        owner: userId
    })

    if(!videos[0]){
        return res.status(404)
        .json(new ApiResponse(404,[],"No videos found"))
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos[0],"Videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/apiErrors.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    //validation
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Video cannot be found!");
    }

    //check if already liked
    const checkIfLiked = await Like.findOne({
        video: videoId
    });

    if (checkIfLiked) {
        await Like.deleteOne(checkIfLiked)
        return res.status(200).json(new ApiResponse(200,{},"Like deleted Successfully"));
    }

    //create the like
    const likeCreated = await Like.create({
        video: videoId,
        likedBy: req.user?._id
    });

    //validate creation
    if(!likeCreated){
        throw new ApiError(500,"Something went wrong while creating the like");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {likeCreated},
            "Like created Successfully!"
        )
    );

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    //validate
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"Comment cannot be found!");
    }

    //check if liked already
    const foundLikeOnComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    });

    if(foundLikeOnComment){
       await Like.deleteOne(foundLikeOnComment);
       return res.status(200).json(new ApiResponse(200,{},"Like removed from comment successfully"));
    }

    //if not then create
    const createdLikeOnComment = await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    });

    if(!createdLikeOnComment) {
        throw new ApiError(504,"Something went wrong while adding like in comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {createdLikeOnComment},
            "Like added Successfully"
        )
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    
    //validate
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"Tweet cannot be found!");
    }

    //check if liked already
    const foundLikeOnTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    });

    if(foundLikeOnTweet){
       await Like.deleteOne(foundLikeOnTweet);
       return res.status(200).json(new ApiResponse(200,{},"Like removed from Tweet successfully"));
    }


    //if not then create
    const createdLikeOnTweet = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    });

    if(!createdLikeOnTweet) {
        throw new ApiError(504,"Something went wrong while adding like in tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {createdLikeOnTweet},
            "Like added Successfully"
        )
    );
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    //find all the videos by user
    const likedVideos = await Like.find({
        $and: [ { likedBy: req.user?._id },{ video: {$exists: true} } ]
    });

    if(!likedVideos.length === 0){
        throw new ApiError(502,"Liked videos cannot be fetched/found");
    }

    //return the videos 
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {"Total Videos": likedVideos.length, "Videos": likedVideos},
            "Successfully fetched the liked videos!"
        )
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
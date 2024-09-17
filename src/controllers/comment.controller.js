import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    //validate id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    
    //find the video by it's id & apply queries
    const skip = (page - 1) * limit;

    const getAllComments = await Comment.find({video: videoId}.skip(skip).limit(limit));

    if(!getAllComments){
        throw new ApiError(500,"Something went wrong while loading the comments");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            getAllComments,
            "Successfully fetched all the comments"
        )
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    //check validations
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video cannot be found");
    }

    if(!content){
        throw new ApiError(400,"Content is required");
    }

    //create the comment
    const createComment = await Comment.create({
        video: videoId,
        content,
        owner: req.user?._id
    });
    
    //if not created throw error
    if(!createComment){
        throw new ApiError(500,"Something went wrong while creating your comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createComment,
            "Successfully created the comment"
        )
    );
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    //check validations
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"video cannot be found");
    }

    if(!content){
        throw new ApiError(400,"Content is required");
    }

    //findbyid and update
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content
            }
        },{new:true}
    );

    if(!updatedComment){
        throw new ApiError(500,"Something went wrong while updating the comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment is updated successfully!"
        )
    );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    //check validations
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"video cannot be found");
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if(!deleteComment) {
        throw new ApiError(500,"Something went wrong while deleting the comment")
    }

    return res
    .status(200)
    .json(200,"Comment is deleted Successfully!");
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
} 
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    
    //validate
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video cannot be found!");
    }
    
    //findbyid
    const findVideo = await Video.findById(videoId);

    if(!findVideo){
        throw new ApiError(500,"Something went wrong while fetching the video");
    }

    //return that video
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {findVideo},
            "Video fetched Successfully!"
        )
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    //validate
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video cannot be found!");
    }

    //get the update details
    const {title,description} = req.body;

    if([ title, description ].some((field) => field.trim() === "")) {
        throw new ApiError(410,"All the fields are required");
    }
    
    //find the video
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(500,"Error while finding the video");
    }

    //check if the owner is equal to the id, only user can update
    if(!video.Owner.equals( req.user?._id )) { throw new ApiError(402,"You cannot update the video");}
    
    //get the new thumbnail & upload 
    const thumbnailLocalPath = req.file?.path;

    if(!thumbnailLocalPath){
        throw new ApiError(404,"Could not get the thumbnail");
    }
    
    const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!uploadThumbnail){
        throw new ApiError(504,"Something went wrong while uploading the thumbnail");
    }

    //delete the old thumbnail after uploading the new thumbnail
    const oldThumbnailUrl = video?.thumbnail;
    const delelteOldThumbnail = await deleteFromCloudinary(oldThumbnailUrl);

    if(!delelteOldThumbnail){
        throw new ApiError(504,"Error while deleting the old thumbnail");
    }
    
    //update the other details
    video.title = title
    video.description = description
    video.thumbnail = uploadThumbnail.url
    
    await video.save();
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Successfully updated the video details!"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
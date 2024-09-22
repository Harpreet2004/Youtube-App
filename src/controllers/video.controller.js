import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/apiErrors.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId = ""} = req.query

    var video;
    try {
        video = await Video.aggregate([
            {
                $match:{
                    $or:[
                        { title: { $regex: query, $options: "i"} }, //i refers to case insensitive
                        { description: { $regex: query, $options: "i"} }
                    ]
                }
            },
            {
                $lookup:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project:{
                                userName:1,
                                avatar:"$avatar.url",
                                fullName:1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    owner:{
                        $first: "$owner"
                    },
                }
            },
            {
                $sort:{
                    [sortBy || "createdAt"]:sortType || 1
                }
            }
        ])
    } catch (error) {
        throw new ApiError(500,error.message || "Internal server error while aggregating video");
    }


    const options = {
        page,
        limit,
        customLabels: {
            totalDocs : "totalVideos",
            docs: "videos"
        },
        skip: (page - 1) * limit,
        limit: parseInt(limit)
    }

    Video.aggregatePaginate(video,options)
        .then(result => {
            if(result?.videos?.length === 0) {
                return res.status(200).json(new ApiResponse(200,[],"No vidoes found!"))
            }

            return res.status(200)
                .json(
                    new ApiResponse(
                        200,
                        [result],
                        "Video fetched successfully"
                    )
                )
        }).catch(error => {
            throw new ApiError(500, error?.message || "INTERNAL SERVER ERROR!! Something went wrong while fetching the videos");
        })
})  

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
    
    if(!title && !description) {
        throw new ApiError(504,"Title and descriptions are required!");
    }

    const videoLocalPath = req.files?.videoFile[0].path;

    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoLocalPath && !thumbnailLocalPath) {
        throw new ApiError(500,"Local path is not correct for video & thumbnail");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const videoPublished = await Video.create({
        title,
        description,
        videoFile: video?.url,
        thumbnail: thumbnail?.url,
        isPublished: true,
        duration: video?.duration,
        owner: req.user?._id
    })

    if(!videoPublished){
        throw new ApiError(503,"Something went wrong while publishing the vidoe!!");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoPublished,
            "Video Published Successfully!"
        )
    );
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
    
    //validate
    if(!isValidObjectId(videoId)){
        throw new ApiError(420,"Video does not exist");
    }

    //find if video exists
    const videoExists = await Video.findById(videoId);

    if(!videoExists){
        throw new ApiError(404,"Video cannot be found!");
    }

    //delete the video & validate
    const deleteVideo = await deleteFromCloudinary(videoExists.videoFile,"video");
    const deleteThumbnail = await deleteFromCloudinary(videoExists.thumbnail,"img");

    if(!deleteVideo && !deleteThumbnail){
        throw new ApiError(504,"Error! Video & thumbnail cannot be deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video Successfully Deleted!"
        )
    );

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(420,"Video does not exists");
    }

    const findVideo = await Video.findOne({
        _id: videoId,
        Owner: req.user?._id
    });

    if(!findVideo){
        throw new ApiError(540,"Something went wrong while finding the video!");
    }

    findVideo.isPublished = !findVideo.isPublished
    await findVideo.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            findVideo.isPublished,
            "isPublished toggled Successfully!"
        )
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
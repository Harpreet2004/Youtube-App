import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/apiErrors.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    //check if name & desc are empty or not
    if(!(name && description)) {
        throw new ApiError(400,"Name and Description are required");
    }
    //create a playlist for that 
    const playlistCreated = await Playlist.create({
        name: name,
        description: description,
        owner: new mongoose.Types.ObjectId(req.user?._id),
    })


    if(!playlistCreated){
        throw new ApiError(500,"Something went wrong while creating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistCreated,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    //TODO: get user playlists
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid userid for playlist");
    }

    const findPlaylist = await Playlist.findById(userId);

    if(findPlaylist?.length === 0) {
        throw new ApiError(400,"Playlist does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            findPlaylist,
            "Playlist fetched successfully"
        )
    );
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    //check if id valid
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist id");
    }
    //find playlist of the user
    const playlist = await Playlist.findById(playlistId)
    
    //if playlist cannot be found the error
    if(playlist?.length === 0) {
        throw new ApiError(400,"Playlist cannot be found");
    }

    return res
    .status(200)
    .json(
        200,
        playlist,
        "Playlist fetched Successfully"
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    //1.check validation of ids
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoid or playlist id");
    }
    
    //2.get the playlist to which we need to add the video
    const playlist = await Playlist.findById(playlistId)
    
    //3.validate if playlist is found
    if(!playlist) {
        throw new ApiError(400,"Error while finding the playlist by it's id.");
    }
    
    //4.if found then add the video to it
    const videoAdded = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos: videoId
            }
        }
    );
    
    //5.check if video added successfully
    if(!videoAdded) {
        throw new ApiError(500,"Something went wrong while adding the video to playlist");
    }
    //6.return the playlist & success
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoAdded,
            "Successfully added the Video to the playlist"
        )
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    //validate the ids
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(400,"Playlist and video are required for deletion");
    }

    //find if video exists in the playlist
    const playlist = await Playlist.findOne({
        _id: playlistId,
        video: videoId
    })
    
    //if video does not exist then error else remove it
    if(!playlist) {
        throw new ApiError(400,"Cannot find the specified video in the playlist");
    }

    //if exists then remove
    const deleteVideofromPlaylist = await Playlist.findByIdAndUpdate(
        videoId,
        {
            $pull:{
                videos: videoId
            }
        }
    )
    
    if(!deleteVideofromPlaylist){
        throw new ApiError(500,"Something went wrong while removing video from playlist");
    }

    //then success message
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deleteVideofromPlaylist,
            "Video is successfully removed"
        )
    );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id for deletion");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletedPlaylist){
        throw new ApiError(500,"Something went wrong while deleting the playlist");
    }

    return res
    .status(200)
    .json(
        200,
        "Playlist Succesfully deleted"
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    //check validation
    //find & update them
    //if not updated throw error
    //else success

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id for updation");
    }
    
    if(!(name && description)) {
        throw new ApiError(400,"Name and Description are required");
    }
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name:name,
                description:description
            }
        },
        {new: true}
    );
    
    if(!playlist) {
        throw new ApiError(500,"Something went wrong while updating the playlist!");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist is updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
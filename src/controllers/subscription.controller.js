import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/apiErrors.js"
import { ApiResponse } from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    
    //check if channelid exists
    if(!isValidObjectId(channelId)) {
        throw new ApiError(402,"Channel does not exist");
    }

    //check if channel has been subscribed
    const checkSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    });
    
    //if subbed then remove it
    if(checkSubscription){
        await checkSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(200,{},"Successfully removed subscription"));
    }
    
    //else create it and sub it
    const createSub = await Subscription.create({
        channel:channelId,
        subscriber: req.user?._id
    });

    if(!createSub){
        throw new ApiError(502,"Something went wrong while creating the subscription");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,createSub,"Successfully added this channel in your channels")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    //validation
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Channel does not exist");
    }

    //find and populate
    const subscriber = await Subscription.findOne({
        channel: channelId}).populate("subscriber","fullName email avatar coverImage userName");

    if(!subscriber){
        throw new ApiError(510,"Error while finding the subscriber,please try again after some time.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {subscriber},
            "Successfully fetched all the users!"
        )
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(404,"Subscriber cannot be found!");
    }

    const findSubscribedChannels = await Subscription
    .find({subscriber: subscriberId})
    .populate("channel","fullName email avatar userName coverImage");

    if(!findSubscribedChannels){
        throw new ApiError(504,"Error while fetching the subscribed list");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {findSubscribedChannels},
            "Subscribed channels details feteched successfully!"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser,
    refreshAccessToken, 
    changePassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);


//secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/current-user").get(verifyJwt, getCurrentUser);

router.route("/update-accounts").patch(updateAccountDetails);
router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router.route("/update-coverImage").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

//for params we have to use it like this 
router.route("/c/:userName").get(verifyJwt,getUserChannelProfile);

router.route("/history").get(verifyJwt,getWatchHistory);




export default router;
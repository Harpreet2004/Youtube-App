import cloudinary from "cloudinary";
// import pkg from 'cloudinary';
// const {v3: cloudinary} = pkg;
// import {fs} from "node:fs";
import * as fs from 'node:fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            // console.log("ERROR !! File path not found");   
            return null;
        }
    
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
    
        // file has been uploaded successfully
        // console.log("FILE is uploaded successfully",response.url);
        fs.unlinkSync(localFilePath);
        return response; 
    } catch (error) {
        //removing locally saved temp file as the uploading failed
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}
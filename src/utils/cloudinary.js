import {v3 as cloudinary} from "cloudinary"
import {fs} from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.log("ERROR !! File path not found");   
            return null;
        }
    
        //upload file on cloudinary
        cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
    
        // file has been uploaded successfully
        console.log("FILE is uploaded successfully"); 
    } catch (error) {
        
    }
}


const uploadResult = await cloudinary.uploader
       .upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });
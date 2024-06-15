import fs from 'fs';
 
import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async (localFilePath)=>{   
    try{
        if(!localFilePath){
            throw new Error("Please provide a valid file path");
        }
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        });
        console.log("file is uploaded succesffully",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath);
        return null;
    }

}

export {uploadOnCloudinary}
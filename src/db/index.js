// import mongoose from "mongoose";
// import {DB_NAME} from "../constants.js"
// const connectDB= async ()=>{
//     try {
//         const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         console.log(`Connected to MongoDB: ${connectionInstance.connection.host}`)
//     } catch (error) {
//         console.log("Error connecting to MongoDB", error);
//         process.exit(1);
//     }
// }

// export default connectDB;
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const dbUri = `${process.env.MONGODB_URI}${DB_NAME}`;
        
        // Log the MongoDB URI for debugging purposes
        console.log(`Connecting to MongoDB with URI: ${dbUri}`);

        const connectionInstance = await mongoose.connect(dbUri);

        console.log(`Connected to MongoDB: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
};

export default connectDB;

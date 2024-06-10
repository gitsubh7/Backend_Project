import dotenv from "dotenv";
dotenv.config({
    path: "./env"
});

import mongoose from "mongoose";
import {DB_NAME} from "./constants.js"
import express from "express";
import connectDB from "./db/index.js";
connectDB();




















/*
const app = express();
( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error", (error)=>{
        console.log("Error connecting to MongoDB", error);
        throw error
       })
       app.listen(process.env.PORT, ()=>{
              console.log(`Server is running on port ${process.env.PORT}`);
            })
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
})();

*/
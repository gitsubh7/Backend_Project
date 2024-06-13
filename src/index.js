import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import userRoute from "./routes/user.routes.js";

dotenv.config({
    path: './.env'
});

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
app.use(express.json({
    limit: "30kb",
}));
app.use(express.urlencoded({
    extended: true,
    limit: "30kb",
}));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/users", userRoute);

// Database connection
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });

export { app };

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoute from "./routes/user.routes.js";
import productRoute from "./routes/product.routes.js";
import orderRoute from "./routes/order.routes.js";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from 'cloudinary';
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT; // Use PORT from .env
const MONGO_URL = process.env.MONGO_URL;
    
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400 // 24 hours
}));


app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}));

try {
    mongoose.connect(MONGO_URL);
    console.log("Connected successfully");
} catch (error) {
    console.error("MongoDB connection error:", error);
}

app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/order", orderRoute);


cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, // Use CLOUD_API_KEY from .env
    api_secret: process.env.CLOUD_API_SECRET // Use CLOUD_API_SECRET from .env
});

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

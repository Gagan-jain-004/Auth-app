import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

import  connectDB from './config/mongodb.js'

import authRouter from './routes/authRoutes.js'
import userRouter from "./routes/userRoutes.js";

const app = express();

const port=process.env.PORT || 4000;

connectDB();



app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
     "http://localhost:5173",
    "https://auth-app-git-main-gagan-jain-004s-projects.vercel.app",
    "https://auth-app-gagan-jain-004s-projects.vercel.app",
    "https://auth-app-beta-puce.vercel.app",

  ],
  credentials: true
}));
   // to let u able to send cookie in response 


//api endpoints

app.get("/",(req,res)=> res.send("api is working "))
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter )



app.listen(port ,()=> console.log(`Server is listening on port ${port}`));

import mongoose from "mongoose";

const connectDB = async ()=>{
    mongoose.connection.on('connected',()=> console.log("Db connected successfully"));

    await mongoose.connect(`${process.env.MONGODB_URI}/mern-auth`);         //mern-auth is project name    
};

export default connectDB;

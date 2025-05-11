
import express from "express"
import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyEmail } from "../controllers/authController.js";
import userAuth from "../middlewares/userAuth.js";


const authRouter = express.Router();

authRouter.post("/register",register);       // whenever we hit register route it will hit register controller fxn
authRouter.post("/login",login);
authRouter.post("/logout",logout);
authRouter.post("/send-verify-otp",userAuth,sendVerifyOtp);
authRouter.post("/verify-account",userAuth,verifyEmail );
authRouter.get("/is-auth",userAuth,isAuthenticated );
authRouter.post("/send-reset-otp",sendResetOtp );
authRouter.post("/reset-password",resetPassword );


export default authRouter;
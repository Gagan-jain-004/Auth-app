
import bcrypt from "bcryptjs";              // to encrypt pass
import jwt from "jsonwebtoken";             // for authentication
import userModel from "../models/userModel.js";
import transporter  from "../config/nodemailer.js";



export const register = async(req,res)=>{

    
    const {name,email,password} = req.body;
    
    if(!name || !email || !password){
        return  res.json({success: false, message: "Missing Details"})
    }
    
    try{
        
        // lets chk first whether user is already present or not via email chk ,so uniqueness maintained
        const existingUser = await userModel.findOne({email})
        
        if(existingUser){
            return res.json({success: false,message: "User already exists"});
        }
        
        // if it's a new user then below one executes
        const hashedPassword = await bcrypt.hash(password,10)          //10 is length of hashed pass
        
        // now storing user to db
        const user = new userModel({name,email,password: hashedPassword});
        await user.save();                               // saving to db
        
        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn: '7d'});    //token expires in 7 days
        
        // now sending token in response via cookie
        res.cookie('token', token,{
            httpOnly: true,               // only http can access this cookie 
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000 ,            // in milisecond unit, (7days)
        })

        // sending welcome email
            const mailOptions = {
                from: process.env.SMTP_USER,
                to : email,
                subject: 'HI',
                text: `Welcome to our website. Your account has been created with email id: ${email}`,

            }

            await transporter.sendMail(mailOptions);

        return res.json({success: true});
        
        
    }catch(error){
        res.json({success: false,message: error});
    }
}



// LOGIN

export const login = async (req,res)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: "Email and password are required"})
    }

    try{
        const user = await userModel.findOne({email});
        
        if(!user){
            return res.json({success: false, message: "Invalid Email"})
        }
        
        // we would reach here only if mail matches then we go for checking pass 

        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.json({success: false, message: "Invalid Password"})
        }
   

        // if we reach here it means user is present and to authenticate ,need to generate the token
        const token = jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn: '7d'});    //token expires in 7 days

    res.cookie('token', token,{
        httpOnly: true,              
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7*24*60*60*1000 ,        
        
    });

    return res.json({success: true});

    }catch(error){
        return res.json({success: false, message: error.message });
    }

}


// ab logout ke liye toh cookie remove krdo base   as cookie name we use is token 

export const logout = async (req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"? 'none' : "strict",

        })
        return res.json({success: true,message: "Logged Out"})

    }catch(error){
        return res.json({success: false,message:error.message})
        }
}






//Send verification OTP to the User's Email

export const sendVerifyOtp = async (req,res)=>{
    try{
        const id= req.user;
        const user = await userModel.findById(id);

        if(user.isAccountVerified){
            return res.json({success: false,message: "Account is Already Verified"})
        }


        const otp = String(Math.floor(100000 + Math.random()*900000));
        
        user.verifyOtp = otp;             //db mai save krna otp
        user.verifyOtpExpireAt =  Date.now() + 24*60*60*1000;
        
        await user.save();
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to : user.email,
            subject: 'ACCOUNT Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP`,
        }
        await transporter.sendMail(mailOption);

        res.json({success: true, meassage: 'Verification OTP sent on Email'})


    }catch(error){
        res.json({success: false, message: error.message});

    }
}



//verify the email using otp 
export const verifyEmail = async (req,res)=>{
    const id =req.user;
    const {otp} = req.body;

    if(!id || !otp){
        return res.json({success: false, message: "Missing Details"})
    }

    try{
        const user = await userModel.findById(id);
    
        if(!user){
            return res.json({success: false, message: 'User not found '})
        }

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: "Invalid OTP"});
        }

        if(user.verifyOtpExpireAt <Date.now()){
            return res.json({success: false, message: "OTP Expired"});
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt=0;

        await user.save();
        return res.json({success: true, message: "Email verified successfully "})
    }catch(error){
        res.json({success: false, message: error.message});

    }
}


// checking if the user is authenticated

export const isAuthenticated = async (req,res)=>{
    try{
        return res.json({success: true});
    }catch(error){
        res.json({success: false, message: error.message});

    }
}


//send password reset otp

export const sendResetOtp = async(req,res)=>{

    const {email} = req.body;
    if(!email){
        return res.json({success: false,message: "Email is required"})
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        const otp = String(Math.floor(100000 + Math.random()*900000));
        
        user.resetOtp = otp;             //db mai save krna otp
        user.resetOtpExpiredAt =  Date.now() + 15*60*1000;
        
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to : user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}.Use this OTP to proceed with resetting your password `
        }
        await transporter.sendMail(mailOption);       // to send mail

        return res.json({success: true, message:"Otp sent to your email"})

    }catch(error){
        res.json({success: false, message: error.message});

    }
}


// reset user password after verifying the above reset otp 

export const resetPassword = async (req,res)=>{

    const {email,otp,newPassword}= req.body;
    if(!email || !otp || !newPassword){
        return res.json({success: false, message: "Email,otp and new password are required"});

    }

    try{
        const user = await userModel.findOne({email});
        console.log(user);
        
        if(!user){
            return res.json({success: false, message: "User not found"});

        }

        if(user.resetOtp === ""|| user.resetOtp != otp){
            return res.json({success: false, message: "Invalid Otp"});

        }
        if(user.resetOtpExpiredAt < Date.now()){
            return res.json({success: false, message: "Otp Expired"})
        }

        //ab new pass is coming to encrypt  to krna hoga 

        const hashedPassword = await bcrypt.hash(newPassword,10);

        user.password = hashedPassword;
        user.resetOtp= "";
        user.resetOtpExpiredAt = 0;

        await user.save();

        return res.json({success: true, message: "Password has been reset successfully"});
    }catch(error){    
           return  res.json({success: false, message: error.message});
}
}
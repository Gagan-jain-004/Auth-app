import userModel from "../models/userModel.js";

export const getUserData = async(req,res)=>{

    try{
        const id = await req.user;
        console.log(id);
        const user = await userModel.findById(id);

        if(!user){
            return res.json({success: false,message: "User Not found"})
        }

        res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        })

    }catch(error){
        return res.json({success: false, message: error.message})
    }
}
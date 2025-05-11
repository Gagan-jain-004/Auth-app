import jwt from "jsonwebtoken";

const userAuth = async (req,res,next)=>{
    const {token} = req.cookies;

    if(!token){
        return res.json({sucess: false,message: "Not Authorized. Login Again"})
    }

    try{
    const tokenDecode = jwt.verify(token,process.env.JWT_SECRET)
        console.log(tokenDecode.id);
    if(tokenDecode.id){
       req.user = tokenDecode.id;
        
    }else{
        return res.json({success: false, message: "Not Authorized . Login again"})
    }

        next();               // it will call the controller fxn to exexute 
}catch(error){
        res.json({success: false, message: error.message})
    }

}

export default userAuth;
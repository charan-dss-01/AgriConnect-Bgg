import { User } from "../models/usermodel.js"
import jwt from "jsonwebtoken"

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        console.log("Middleware token:", token);
        if (!token) {
            return res.status(401).json({ error: "No token provided, authorization denied" });
        }
        
        const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY)
        const user=await User.findById(decoded.userId); 
        if(!user){
            return res.status(404).json({error:"User not found"});
        }
        req.user=user;
        next();
    } catch (error) {
        console.error("Error occurred in the authentication middleware:", error);
        return res.status(401).json({ error: "User not authenticated" });
    }
};


export const isAdmin=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(400).json({error:`user with given ${req.user.role} role not allowed`})
        }
        next();
    }
}

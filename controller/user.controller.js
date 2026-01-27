import { User } from "../models/usermodel.js";
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs'; 
import createTokenAndSaveCookies from "../jwt/Authtoken.js";
import mongoose from "mongoose";
import { Product } from "../models/productmodel.js";
import { Cart } from "../models/cartModel.js";

// Controller function to add a product to the user's cart

// Add product to cart
export const addToCart = async (req, res) => {
    try {
        const { product, userId } = req.body;

        if (!product || !userId) {
            return res.status(400).json({ message: "Product or User information is missing" });
        }

        if (!mongoose.Types.ObjectId.isValid(product)) {
            return res.status(400).json({ message: "Invalid Product ID" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID" });
        }

        const foundProduct = await Product.findById(product);
        const user = await User.findById(userId);

        if (!foundProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Check if product already exists in cart
        const existingCartItem = await Cart.findOne({
            productId: product, // or productId
            user: userId
        });


        if (existingCartItem) {
            // Option 1: increase quantity
            existingCartItem.quantity += 1;
            await existingCartItem.save();

            return res.status(200).json({
                message: "Product quantity updated in cart",
                cart: existingCartItem
            });
        }

        // ✅ Create new cart item
        const cartItem = await Cart.create({
            product:foundProduct,
            productId:product,
            user: userId,
            quantity: 1
        });

        res.status(201).json({
            message: "Product added to cart",
            cart: cartItem
        });

    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Remove product from cart
export const removeFromCart = async (req, res) => {
    try {
        const { productId, userId } = req.body;

        if (!productId || !userId) {
            return res.status(400).json({ message: "Product ID or User ID is missing" });
        }

        if (
            !mongoose.Types.ObjectId.isValid(productId) ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return res.status(400).json({ message: "Invalid Product or User ID" });
        }

        const result = await Cart.deleteOne({
            productId: productId,
            user: userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        res.status(200).json({ message: "Product removed from cart" });
    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// Get user's cart
export const getCart = async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const cart=await Cart.find({user:userId});
        res.status(200).json({ cart: cart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




// Clear all items from the cart
export const clearCart = async (req, res) => {
    try {
        const userId = req.body.userId;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Clear the user's cart
        // user.cart = [];
        // await user.save();
        await Cart.deleteMany({user:userId})
        // Respond with the updated cart
        res.status(200).json({ message: "Cart cleared successfully"});
    } catch (error) {
        console.error("Error clearing cart:", error); // Log the error for debugging
        res.status(500).json({ message: "Server error", error });
    }
};

export const register = async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "User Photo Required" });    
    }

    const { photo } = req.files;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(photo.mimetype)) {
        return res.status(400).json({ message: "Invalid photo type. Only JPEG or PNG is allowed" });
    }
    console.log("Received MIME type:", photo.mimetype);

    const { name, email, phone, role, password } = req.body;

    if (!name || !email || !phone || !role || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email }); 
    if (user) {  
        return res.status(400).json({ message: "The user already exists" });
    }

    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(photo.tempFilePath);


        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            phone,
            role,
            password: hashedPassword, 
            photo: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url
            }
        });
        await newUser.save();
        if(newUser){
            const token=createTokenAndSaveCookies(newUser._id,res);
            res.status(201).json({ message: "User registered successfully",user:newUser,token });
        }
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ message: "Failed to upload photo" });
    }
};

export const login = async (req, res) => {
    console.log("Request body:", req.body); // Log the incoming request
    const { email, password, role } = req.body;
    
    try {
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Please fill required fields" });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (user.role !== role) {
            return res.status(403).json({ message: `Given role ${role} not found` });
        }

        const token = await createTokenAndSaveCookies(user._id, res);
        res.status(200).json({
            message: "User logged in successfully",
            user: user,
            // user: {
            //     _id: user._id,
            //     name: user.name,
            //     email: user.email,
            //     role: user.role,
            // },
            token: token,
        });
    } catch (error) {
        console.error("Error during login:", error); // Log the error
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const getMyProfile = async(req,res)=>{
    const user= await req.user;
    res.status(200).json(user);
}

export const getAdmin = async(req,res)=>{
    const admins=await User.find({role:"admin"});
    res.status(200).json(admins);
}

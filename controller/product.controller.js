import { Product } from "../models/productmodel.js";
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
    console.log("Request Body:", req.body);   // Log the body fields
    console.log("Request Files:", req.files); // Log the uploaded files
 
    

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "Product image is required" });
    }

    const { productImage } = req.files;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(productImage.mimetype)) {
        return res.status(400).json({ message: "Invalid photo type. Only JPEG or PNG is allowed" });
    }

    const { title, category, about, price } = req.body; // Destructure price from req.body
    console.log("Types in req.body:", {
        title: typeof title,
        category: typeof category,
        about: typeof about,
        price: typeof price
    });
    if (!title || !category || !about || price == null) { // Correctly check for null
        return res.status(400).json({ message: "All fields are required" });
    }

    
    const adminName = req?.user?.name;
    const adminphoto = req?.user?.photo?.url;
    const createdBy = req?.user?._id;
    
    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(productImage.tempFilePath);
        const productData = {
            title,
            about,
            category,
            price, 
            adminName,
            adminphoto,
            createdBy,
            productImage: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url
            },
        };


        const product = await Product.create(productData);
        res.status(201).json({ message: "Product created successfully", product });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        return res.status(400).json({ message: "Product not found" });
    }
    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
};

export const getAllProducts = async (req, res) => {
    const allProducts = await Product.find();
    res.status(200).json(allProducts);
};

export const getSingleProducts = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Product Id" });
    }
    const product = await Product.findById(id);
    if (!product) {
        return res.status(400).json({ message: "Product not found" });
    }
    res.status(200).json(product);
};

export const getMyProducts = async (req, res) => {
    try {
        console.log("Authenticated user:", req.user); // Check if user is being populated
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const createdBy = req.user._id; // Assuming `req.user` has the user data
        const myProducts = await Product.find({ createdBy });

        if (!myProducts || myProducts.length === 0) {
            return res.status(404).json({ message: "No products found for this user" });
        }

        res.status(200).json(myProducts);
    } catch (error) {
        console.error("Error fetching user products:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;

    // Check if the provided ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Product Id" });
    }

    // Find the existing product
    const product = await Product.findById(id);
    if (!product) {
        return res.status(400).json({ message: "Product not found" });
    }

    // Initialize an object to hold the updated data
    const updatedData = {
        title: req.body.title || product.title,
        about: req.body.about || product.about,
        category: req.body.category || product.category,
        price: req.body.price != null ? req.body.price : product.price, // Update price if provided
    };

    // Check if a new image is uploaded
    if (req.files && req.files.productImage) {
        const productImage = req.files.productImage;

        // Validate the file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(productImage.mimetype)) {
            return res.status(400).json({ message: "Invalid photo type. Only JPEG, PNG, or WEBP is allowed" });
        }

        try {
            // Upload to Cloudinary and update the product image
            const cloudinaryResponse = await cloudinary.uploader.upload(productImage.tempFilePath);
            updatedData.productImage = {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            };
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ message: "Error uploading image" });
        }
    } else {
        // If no new image, retain the existing product image
        updatedData.productImage = product.productImage;
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, { new: true });

    // Respond with the updated product data
    res.status(200).json(updatedProduct);
};

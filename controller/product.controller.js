import { Product } from "../models/productmodel.js";
import { User } from "../models/usermodel.js";
import { Order } from "../models/orderModel.js";
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
// Check if title is missing or empty
if (!title) {
  return res.status(400).json({ message: "Title is required" });
}

// Check if category is missing or empty
if (!category) {
  return res.status(400).json({ message: "Category is required" });
}

// Check if about/description is missing or empty
if (!about) {
  return res.status(400).json({ message: "About field is required" });
}

// Check if price is missing (null or undefined)
if (price === null || price === undefined) {
  return res.status(400).json({ message: "Price is required" });
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
    
    try {
        // Find the product first
        const product = await Product.findById(id);
        if (!product) {
            return res.status(400).json({ message: "Product not found" });
        }

        // Step 1: Remove product from all users' carts
        await User.updateMany(
            { "cart.product": id },
            { $pull: { "cart": { product: id } } }
        );

        // Step 2: Find all orders that contain this product
        const ordersWithProduct = await Order.find({ "items.product": id });

        // Step 3: Remove product from orders' items and handle order cleanup
        for (const order of ordersWithProduct) {
            // Remove the product item from the order
            order.items = order.items.filter(item => item.product.toString() !== id);

            // If no items left in order, delete the order and remove from user records
            if (order.items.length === 0) {
                // Remove order from buyer's orders
                await User.findByIdAndUpdate(
                    order.buyer,
                    { $pull: { "orders": order._id } }
                );

                // Remove order from farmer's myOrders (if exists)
                const farmer = await User.findOne({
                    "myOrders.orderId": order._id
                });
                if (farmer) {
                    farmer.myOrders = farmer.myOrders.filter(
                        mo => mo.orderId.toString() !== order._id.toString()
                    );
                    await farmer.save();
                }

                // Delete the empty order
                await Order.findByIdAndDelete(order._id);
            } else {
                // If order still has items, just save the updated order
                await order.save();
            }
        }

        // Step 4: Delete the product
        await product.deleteOne();

        res.status(200).json({ message: "Product deleted successfully and removed from all carts and orders" });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: "Something went wrong", error: error.message });
    }
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

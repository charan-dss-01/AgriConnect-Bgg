import mongoose from "mongoose";
import validator from "validator";

const productScheme = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        productImage: {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
        category: {
            type: String,
            required: true,
        },
        about: {
            type: String,
            required: true,
            minlength: [20, "Should contain at least 20 characters"],
        },
        adminName: {
            type: String,
        },
        adminphoto: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
        price: {
            type: Number, // Use Number type for price
            required: true, // Make it a required field
            validate: {
                validator: function (v) {
                    return v >= 0; // Validate that price is not negative
                },
                message: "Price should be a non-negative number",
            },
        },
    },
    {
        timestamps: true, // Optional: Add timestamps for createdAt and updatedAt
    }
);

export const Product = mongoose.model("Product", productScheme);

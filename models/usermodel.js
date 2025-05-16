import mongoose from "mongoose";
import validator from "validator";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: [validator.isEmail, "Please enter a valid email."],
        },
        phone: {
            type: Number,
            required: true,
            unique: true,
        },
        photo: {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
        role: {
            type: String,
            required: true,
            enum: ["user", "admin"],
        },
        password: {
            type: String,
            required: true,
            select: false,
            minlength: 8,
        },
        token: {
            type: String,
        },
        cart: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                },
            },
        ],
        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order",
            },
        ],
        myOrders: [
            {
                orderId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Order",
                },
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

export const User = mongoose.model("User", userSchema);

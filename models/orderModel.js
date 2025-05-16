// backend/models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
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
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Delivered", "Cancelled"],
            default: "Pending",
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        // farmer: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "User", // Reference to the user who created the product (farmer/admin)
        //     required: true,
        // },
        address: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Order = mongoose.model("Order", orderSchema);

import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference the User model
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference the Product model
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1, // Minimum rating
      max: 5, // Maximum rating
    },
    comment: {
      type: String,
      required: true,
      minlength: [10, "Comment should contain at least 10 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set the creation date
    },
  },
  {
    timestamps: true, // Add timestamps for createdAt and updatedAt
  }
);

export const Review = mongoose.model("Review", reviewSchema);

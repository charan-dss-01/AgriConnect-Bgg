import { Review } from "../models/review.js";
import { Product } from "../models/productmodel.js";
import { User } from "../models/usermodel.js";

// Submit a review
import {Order} from "../models/orderModel.js"; // Import the Order model

export const createReview = async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the user has purchased the product
    const order = await Order.findOne({
      buyer: userId,
      status: "Delivered",
      "items.product": productId, // This checks all objects in the array
    });

    if (!order) {
      return res.status(403).json({ message: "You can only review purchased products." });
    }

    // Print the productId and item.product for debugging
    console.log("Product ID:", productId);
    console.log("Order Items:", order.items);
    
    // Optionally: Check if product is in the order's items array
    const purchasedProduct = order.items.find(item => item.product.toString() === productId);
    console.log("Purchased Product:", purchasedProduct);

    // Create the review
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({ message: "Review submitted successfully!", review });
  } catch (error) {
    console.error(error);  // Log the error to the console for debugging
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};





// Fetch reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId }).populate(
      "user",
      "name email photo.url"
    );

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete a review (optional)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.json({ message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

import express from "express";
import { 
    createProduct, 
    deleteProduct, 
    getAllProducts, 
    getMyProducts, 
    getSingleProducts, 
    updateProduct 
} from "../controller/product.controller.js";
import { 
    createReview, 
    getProductReviews, 
    deleteReview 
} from "../controller/review.controller.js";
import { isAdmin, isAuthenticated } from "../middleware/authUser.js";

const router = express.Router();

// Product routes
router.post("/create", isAuthenticated, isAdmin("admin"), createProduct);
router.delete("/delete/:id", isAuthenticated, isAdmin("admin"), deleteProduct);
router.get("/all-products", getAllProducts);
router.get("/single-product/:id", isAuthenticated, getSingleProducts);
router.get("/my-products", isAuthenticated, isAdmin("admin"), getMyProducts);
router.put("/update/:id", isAuthenticated, isAdmin("admin"), updateProduct);

// Review routes
router.post("/:productId/review",createReview); // Submit a review
router.get("/:productId/reviews", getProductReviews); // Get all reviews for a product
router.delete("/review/:reviewId", isAuthenticated, deleteReview); // Delete a review

export default router;

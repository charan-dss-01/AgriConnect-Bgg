import express from "express";
import { 
    getAdmin, 
    getMyProfile, 
    login, 
    logout, 
    register,
    addToCart,   // Import cart-related controllers
    removeFromCart,
    getCart,
    clearCart
} from "../controller/user.controller.js";
import { isAuthenticated } from "../middleware/authUser.js"; // Authentication middleware

const router = express.Router();

// User registration and login routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);

// User profile routes
router.get("/my-profile", isAuthenticated, getMyProfile);

// Admin routes
router.get("/admin", getAdmin);

// Cart routes
router.post("/cart/add/:productId",isAuthenticated,addToCart);
router.delete("/cart/remove/:productId",  removeFromCart); // Added leading slash
router.delete('/cart/clear', clearCart);
router.get("/cart", isAuthenticated, getCart); // View user's cart

export default router;

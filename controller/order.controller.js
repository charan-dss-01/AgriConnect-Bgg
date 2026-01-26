import mongoose from 'mongoose';
import { User } from '../models/usermodel.js'; // Import the User model
import { Order } from '../models/orderModel.js'; // Import the Order model
import { Product } from '../models/productmodel.js'; // Import the Order model
import { Cart } from '../models/cartModel.js';

// Create a new order based on the user's cart
export const createOrder = async (req, res) => {
    const { userId} = req.body;

    try {
        // Fetch the user and populate their cart
        const user = await User.findById(userId);
        const userCart=await Cart.find({user:userId});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the cart is empty
        if (!userCart) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Prepare items and calculate total amount
        const items = await Promise.all(
            userCart.map(async (item) => {
                const product = await Product.findById(item.product);

                if (!product) {
                    throw new Error('Product not found');
                }

                return {
                    product: item.product,
                    quantity: item.quantity,
                   farmer: item.product.createdBy || product.seller, 
                    price: item.product.price // Store the price of the product
                };
            })
        );

        const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

        // Create the order, linking buyer and items
        const order = new Order({
            buyer: userId, // The user placing the order
            items, // Items including product and farmer references
            totalAmount,
            status: 'Pending',
        });

        await order.save();

        await Cart.deleteMany({
            user:userId,
            
        })
        await user.save();

        return res.status(201).json({ order });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createSingleItemOrder = async (req, res) => {
    const { userId, productId, quantity  ,address} = req.body; // Extract userId, productId, and quantity from request body

    try {
        // Fetch the user placing the order
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Find the product in the user's cart
        const item =await Cart.findOne({
            productId:productId,
            user:userId
        })
        if (!item) {
            return res.status(400).json({ message: 'Product not found in cart' });
        }

        // Check if requested quantity is available
        if (item.quantity < quantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock in cart' });
        }

        // Fetch the product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Prepare the order item
        const orderItem = {
            product: productId,
            quantity: quantity,
            price: product.price
        };


        const totalAmount = orderItem.price * quantity;

        // Create the order, linking buyer and items
        const order = new Order({
            buyer: userId, // The user placing the order
            items: [orderItem], // Create an array with a single item
            totalAmount,
            address:address,
            farmer: product.createdBy,
            status: 'Pending',
        });

        await order.save();

        return res.status(201).json({ order });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};



// Get all orders made by a specific user
export const getUserOrders = async (req, res) => {
    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const orders = await Order.find({ buyer: userId }).populate("items.product");

        const safeOrders = orders.map(order => ({
        ...order.toObject(),
        items: Array.isArray(order.items) ? order.items : []
        }));

        return res.status(200).json({
        message: 'User orders fetched successfully',
        orders: safeOrders
        });


        //return res.status(200).json({ message: 'User orders fetched successfully', orders:orders });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const getFarmerOrders = async (req, res) => {
    const { farmerId } = req.params;

    // Validate farmerId format
    if (!mongoose.isValidObjectId(farmerId)) {
        return res.status(400).json({ message: 'Invalid farmer ID' });
    }

    try {
        // Fetch the farmer user record
        const farmer = await User.findById(farmerId);

        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        // Populate orders based on the myOrders field
        const orders = await Order.find({
            farmer:farmerId
        }).populate('items.product');

        return res.status(200).json({ message: 'Farmer orders fetched successfully', orders });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const markOrderAsDelivered = async (req, res) => {
    const { farmerId, orderId } = req.params;

    // Validate farmerId format
    if (!mongoose.isValidObjectId(farmerId)) {
        return res.status(400).json({ message: 'Invalid farmer ID' });
    }

    // Validate orderId format
    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }

    try {
        // Fetch the farmer user record
        const farmer = await User.findById(farmerId);
        
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        // Check if the order belongs to the farmer
        const orderExists = Order.find({farmer:farmerId});
        
        if (!orderExists) {
            return res.status(404).json({ message: 'Order not found for this farmer' });
        }

        // Update the order status to 'Delivered'
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: 'Delivered' }, // Assuming 'Completed' is used for delivered orders
            { new: true } // Return the updated order
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.status(200).json({
            message: 'Order status updated to Delivered successfully',
            order: updatedOrder
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


// Remove an existing order
export const removeOrder = async (req, res) => {
    const { orderId } = req.params; // Get order ID from URL parameters
    const { userId } = req.body; // Get user ID from request body

    // Validate orderId format
    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }

    try {
        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if the order belongs to the user
        if (order.buyer.toString() !== userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this order' });
        }

        // Remove the order
        await Order.findByIdAndDelete(orderId);


        return res.status(200).json({ message: 'Order removed successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};




// Update the status of an existing order
export const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params; // Get order ID from URL parameters
    const { status } = req.body; // Get new status from request body

    try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Optional: Update the order in the user model if needed

        return res.status(200).json(updatedOrder);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get a specific order by its ID
export const getOrderById = async (req, res) => {
    const { orderId } = req.params; // Get order ID from URL parameters

    try {
        const order = await Order.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Update the payment status of an order
export const updatePaymentStatus = async (req, res) => {
    const { orderId } = req.params; // Get order ID from URL parameters
    const { paymentStatus } = req.body; // Get payment status from request body

    try {
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { paymentStatus }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Optional: Update the payment status in the user model if needed

        return res.status(200).json(updatedOrder);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

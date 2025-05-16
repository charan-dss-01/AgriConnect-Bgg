import express from 'express';
import {
    createOrder,
    getUserOrders,
    updateOrderStatus,
    getOrderById,
    updatePaymentStatus,
    createSingleItemOrder,
    removeOrder,
    getFarmerOrders,
    markOrderAsDelivered,
} from '../controller/order.controller.js';

const router = express.Router();


router.post('/orders', createOrder);
router.post('/single-order', createSingleItemOrder); 
router.put('/orders/:orderId/status', updateOrderStatus);
router.delete('/orders/remove/:orderId', removeOrder);
router.get('/orders/get/:farmerId', getFarmerOrders);
router.patch('/orders/gets/:farmerId/:orderId', markOrderAsDelivered);
router.get('/orderget/:userId', getUserOrders); 
router.put('/orders/:orderId/payment-status', updatePaymentStatus); 

export default router;

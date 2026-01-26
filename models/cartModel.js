import mongoose, { Schema } from "mongoose";


const cartModel=new Schema(
  {
    product: {
        type: Schema.Types.Mixed, // or Object
        required: true
    },
    productId:{
      type: Schema.Types.ObjectId, // or Object
        required: true
    },
      quantity: {
          type: Number,
          required: true,
          default: 1,
      },
      user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
      }
  }
)


export const Cart=mongoose.model("Cart",cartModel);
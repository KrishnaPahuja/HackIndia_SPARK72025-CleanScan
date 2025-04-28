import mongoose from 'mongoose';

export interface IFood extends mongoose.Document {
  title: string;
  description: string;
  photo: string;
  donorId: mongoose.Schema.Types.ObjectId;
  receiverId?: mongoose.Schema.Types.ObjectId;
  status: 'available' | 'claimed' | 'completed' | 'expired';
  guidelinesAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
  ngoDetails?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    pickupTime?: Date;
    notes?: string;
  };
}

const FoodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    photo: {
      type: String, // URL to the photo
      required: [true, 'Please provide a photo'],
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide donor ID'],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'claimed', 'completed', 'expired'],
      default: 'available',
    },
    guidelinesAccepted: {
      type: Boolean,
      required: [true, 'Please confirm guidelines'],
      default: false,
    },
    ngoDetails: {
      name: String,
      email: String,
      phone: String,
      address: String,
      pickupTime: Date,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create a TTL index for automatic expiration of food posts after 24 hours
FoodSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 24 * 60 * 60,
    partialFilterExpression: { status: 'available' } 
  }
);

export default mongoose.models.Food || mongoose.model<IFood>('Food', FoodSchema); 
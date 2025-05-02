import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  address: string;
  description: string;
  role: 'restaurant' | 'ngo';
  rating: number;
  ratingCount: number;
  tokens: number;
  ngoDetails?: {
    sector: string;
    certNumber: string;
    volunteers?: string;
    wasteTypes?: string;
    operationRegion?: string;
    updatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    address: {
      type: String,
      required: [true, 'Please provide an address'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    role: {
      type: String,
      enum: ['restaurant', 'ngo'],
      required: [true, 'Please specify user role'],
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    tokens: {
      type: Number,
      default: 0,
    },
    ngoDetails: {
      sector: String,
      certNumber: String,
      volunteers: String,
      wasteTypes: String,
      operationRegion: String,
      updatedAt: Date
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 
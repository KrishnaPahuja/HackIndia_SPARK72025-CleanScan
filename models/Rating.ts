import mongoose from 'mongoose';

export interface IRating extends mongoose.Document {
  foodId: mongoose.Schema.Types.ObjectId;
  raterId: mongoose.Schema.Types.ObjectId;
  ratedId: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const RatingSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: [true, 'Please provide food ID'],
    },
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide rater ID'],
    },
    ratedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide rated user ID'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [200, 'Comment cannot be more than 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema); 
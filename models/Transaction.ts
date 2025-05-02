import mongoose from 'mongoose';

export interface ITransaction extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  type: 'reward' | 'redeem';
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: ['reward', 'redeem'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be positive'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema); 
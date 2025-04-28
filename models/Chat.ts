import mongoose, { Schema } from 'mongoose';

const ChatSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  foodItemId: {
    type: Schema.Types.ObjectId,
    ref: 'Food',
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema); 
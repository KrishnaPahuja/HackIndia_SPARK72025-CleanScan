import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

// Get chat messages between current user and specified user
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const otherUserId = params.id;
    
    // Connect to database
    await dbConnect();
    
    // Find all messages between the two users
    const messages = await Chat.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('senderId', 'name role')
    .populate('recipientId', 'name role')
    .populate('foodItemId', 'title');
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
} 
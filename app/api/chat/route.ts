import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

// Get chats for the current user
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    
    // Connect to database
    await dbConnect();
    
    // Find all chats where the current user is either sender or recipient
    const chats = await Chat.find({
      $or: [
        { senderId: userId },
        { recipientId: userId }
      ]
    })
    .sort({ timestamp: -1 })
    .populate('senderId', 'name role')
    .populate('recipientId', 'name role')
    .populate('foodItemId', 'title');
    
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// Create a new chat message
export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    const { recipientId, content, foodItemId } = await req.json();
    
    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Recipient and message content are required' }, { status: 400 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Create new chat message
    const newMessage = await Chat.create({
      senderId: userId,
      recipientId,
      content,
      foodItemId,
      timestamp: new Date()
    });
    
    const populatedMessage = await Chat.findById(newMessage._id)
      .populate('senderId', 'name role')
      .populate('recipientId', 'name role')
      .populate('foodItemId', 'title');
    
    return NextResponse.json(populatedMessage);
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json({ error: 'Failed to create chat message' }, { status: 500 });
  }
} 
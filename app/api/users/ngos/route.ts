import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is a restaurant
    if ((session.user as any).role !== 'restaurant') {
      return NextResponse.json({ error: 'Only restaurants can view NGOs' }, { status: 403 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Fetch all NGOs
    const ngos = await User.find({ role: 'ngo' }).select('_id name email role createdAt');
    
    return NextResponse.json(ngos);
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    return NextResponse.json({ error: 'Failed to fetch NGOs' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Food from '@/models/Food';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    await connectToDB();
    
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to claim food' }, { status: 401 });
    }
    
    const { foodId, ngoDetails } = await req.json();
    
    if (!foodId) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 });
    }
    
    // Validate NGO details
    if (!ngoDetails || !ngoDetails.name) {
      return NextResponse.json({ error: 'NGO name is required' }, { status: 400 });
    }
    
    // Find the food item and check if it's available
    const food = await Food.findById(foodId);
    
    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }
    
    if (food.status !== 'available') {
      return NextResponse.json({ error: 'This food item is no longer available' }, { status: 400 });
    }
    
    // Update the food item with receiver ID, status, and NGO details
    food.receiverId = session.user.id;
    food.status = 'claimed';
    food.ngoDetails = ngoDetails;
    
    await food.save();
    
    return NextResponse.json({ 
      message: 'Food claimed successfully',
      food
    });
    
  } catch (error: any) {
    console.error('Error claiming food:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim food' },
      { status: 500 }
    );
  }
} 
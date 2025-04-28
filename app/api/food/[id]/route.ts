import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Food from '@/models/Food';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// Get a single food donation
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const food = await Food.findById(params.id)
      .populate('donorId', 'name address rating ratingCount')
      .populate('receiverId', 'name');
    
    if (!food) {
      return NextResponse.json(
        { error: 'Food donation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(food);
  } catch (error: any) {
    console.error('Error fetching food:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch food donation' },
      { status: 500 }
    );
  }
}

// Update a food donation (claim or complete)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update a food donation' },
        { status: 401 }
      );
    }
    
    const { status, ngoDetails } = await req.json();
    const foodId = params.id;
    
    // Find the food donation
    const food = await Food.findById(foodId);
    if (!food) {
      return NextResponse.json(
        { error: 'Food donation not found' },
        { status: 404 }
      );
    }
    
    // Verify the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const updates: any = { status };
    
    // If claiming food, set receiver and NGO details
    if (status === 'claimed') {
      updates.receiverId = currentUser._id;
      
      // Add NGO details if provided
      if (ngoDetails) {
        updates.ngoDetails = ngoDetails;
      }
    }
    
    // Handle food completion (only claiming NGO or donating restaurant can mark as completed)
    else if (status === 'completed') {
      const isReceiver = food.receiverId?.toString() === currentUser._id.toString();
      const isDonor = food.donorId.toString() === currentUser._id.toString();
      
      if (!isReceiver && !isDonor) {
        return NextResponse.json(
          { error: 'Only the receiving NGO or donating restaurant can mark this as completed' },
          { status: 403 }
        );
      }
      
      if (food.status !== 'claimed') {
        return NextResponse.json(
          { error: 'Only claimed food can be marked as completed' },
          { status: 400 }
        );
      }
    }
    // Prevent other status changes by unauthorized users
    else {
      return NextResponse.json(
        { error: 'Invalid status update' },
        { status: 400 }
      );
    }
    
    // Update the food donation
    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      updates,
      { new: true }
    ).populate('donorId', 'name address rating ratingCount')
     .populate('receiverId', 'name');
    
    return NextResponse.json(updatedFood);
  } catch (error: any) {
    console.error('Error updating food:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update food donation' },
      { status: 500 }
    );
  }
} 
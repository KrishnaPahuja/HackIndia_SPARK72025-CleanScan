import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Food from '@/models/Food';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// Get all available food donations
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    
    // Check if a specific user's donations are requested
    const userId = url.searchParams.get('userId');
    const userRole = url.searchParams.get('userRole');
    const query: any = {};
    
    // Only add status to query if it's specified
    if (status) {
      query.status = status;
    }
    
    if (userId) {
      // If user is an NGO and looking for claimed/completed items, check receiverId instead
      if (userRole === 'ngo' && (status === 'claimed' || status === 'completed')) {
        query.receiverId = userId;
      } else if (userRole === 'restaurant') {
        // For restaurants, get all donations they've made regardless of status
        query.donorId = userId;
      } else {
        // Default case
        query.donorId = userId;
      }
    }

    console.log('Query for food items:', query);

    // Find foods and populate donor information
    const foods = await Food.find(query)
      .populate('donorId', 'name address rating ratingCount')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${foods.length} food items matching the query`);

    // Calculate if foods are expired (older than 24 hours)
    const now = new Date();
    const foodsWithExpiration = foods.map(food => {
      const foodObj = food.toObject();
      const createdAt = new Date(food.createdAt);
      const timeDiff = now.getTime() - createdAt.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      foodObj.isExpired = hoursDiff >= 24;
      
      // If the food should be expired but status hasn't been updated yet
      if (foodObj.isExpired && foodObj.status === 'available') {
        // We can update it here asynchronously
        Food.findByIdAndUpdate(food._id, { status: 'expired' }).exec();
        foodObj.status = 'expired';
      }
      
      // Add claimed by information from receiverId and ngoDetails
      if ((foodObj.status === 'claimed' || foodObj.status === 'completed') && foodObj.receiverId) {
        if (!foodObj.claimedBy) {
          foodObj.claimedBy = {
            _id: foodObj.receiverId._id,
            name: foodObj.receiverId.name,
            email: foodObj.receiverId.email
          };
        }
        
        // Make sure ngoDetails is passed through to the frontend
        console.log('Food ngoDetails:', foodObj.ngoDetails);
      }
      
      return foodObj;
    });

    return NextResponse.json(foodsWithExpiration);
  } catch (error: any) {
    console.error('Error fetching foods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch food donations' },
      { status: 500 }
    );
  }
}

// Create a new food donation
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a food donation' },
        { status: 401 }
      );
    }
    
    const { title, description, photo, guidelinesAccepted } = await req.json();
    
    // Check if guidelines were accepted
    if (!guidelinesAccepted) {
      return NextResponse.json(
        { error: 'You must accept the guidelines to proceed' },
        { status: 400 }
      );
    }
    
    // Verify donor is a restaurant
    const donor = await User.findOne({ email: session.user.email });
    if (!donor || donor.role !== 'restaurant') {
      return NextResponse.json(
        { error: 'Only restaurants can create food donations' },
        { status: 403 }
      );
    }
    
    // Create new food donation
    const food = await Food.create({
      title,
      description,
      photo,
      donorId: donor._id,
      guidelinesAccepted,
    });
    
    return NextResponse.json(food, { status: 201 });
  } catch (error: any) {
    console.error('Error creating food donation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create food donation' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Rating from '@/models/Rating';
import User from '@/models/User';
import Food from '@/models/Food';
import { authOptions } from '@/lib/auth';

// Get ratings for a user
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const ratedId = url.searchParams.get('ratedId');
    
    if (!ratedId) {
      return NextResponse.json(
        { error: 'ratedId is required' },
        { status: 400 }
      );
    }
    
    const ratings = await Rating.find({ ratedId })
      .populate('raterId', 'name')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(ratings);
  } catch (error: any) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

// Create a new rating
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to rate a restaurant' },
        { status: 401 }
      );
    }
    
    const { foodId, ratedId, rating, comment } = await req.json();
    
    // Validate rating input
    if (!foodId || !ratedId || !rating) {
      return NextResponse.json(
        { error: 'foodId, ratedId, and rating are required' },
        { status: 400 }
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
    
    // Verify the food donation exists and is completed
    const food = await Food.findById(foodId);
    if (!food) {
      return NextResponse.json(
        { error: 'Food donation not found' },
        { status: 404 }
      );
    }
    
    if (food.status !== 'completed') {
      return NextResponse.json(
        { error: 'You can only rate completed food donations' },
        { status: 400 }
      );
    }
    
    // Verify the rater is the receiver of the food
    if (food.receiverId?.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Only the receiving NGO can rate the restaurant' },
        { status: 403 }
      );
    }
    
    // Verify the rated user is the donor of the food
    if (food.donorId.toString() !== ratedId) {
      return NextResponse.json(
        { error: 'Invalid ratedId' },
        { status: 400 }
      );
    }
    
    // Check if the user has already rated this food donation
    const existingRating = await Rating.findOne({
      foodId,
      raterId: currentUser._id,
    });
    
    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this food donation' },
        { status: 400 }
      );
    }
    
    // Create new rating
    const newRating = await Rating.create({
      foodId,
      raterId: currentUser._id,
      ratedId,
      rating,
      comment,
    });
    
    // Update donor's average rating
    const ratedUser = await User.findById(ratedId);
    const newRatingCount = ratedUser.ratingCount + 1;
    const newRatingAvg = 
      (ratedUser.rating * ratedUser.ratingCount + rating) / newRatingCount;
    
    await User.findByIdAndUpdate(ratedId, {
      rating: newRatingAvg,
      ratingCount: newRatingCount,
    });
    
    return NextResponse.json(newRating, { status: 201 });
  } catch (error: any) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create rating' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

interface NgoDetailsPayload {
  sector: string;
  certNumber: string;
  volunteers: string;
  wasteTypes: string;
  operationRegion: string;
  userId?: string;
}

// Save NGO details to the user record
export async function POST(req: Request) {
  try {
    await dbConnect();
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to save organization details' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const {
      sector,
      certNumber,
      volunteers,
      wasteTypes,
      operationRegion,
      userId
    }: NgoDetailsPayload = await req.json();
    
    // Validate required fields
    if (!sector || !certNumber) {
      return NextResponse.json(
        { error: 'Sector and certification number are required' },
        { status: 400 }
      );
    }
    
    // Find the user (either by userId if provided or by email from session)
    const userIdToUpdate = userId || (session.user as any).id;
    
    console.log('Updating NGO details for user ID:', userIdToUpdate);
    
    // Find user and update their details
    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      {
        ngoDetails: {
          sector,
          certNumber,
          volunteers,
          wasteTypes,
          operationRegion,
          updatedAt: new Date()
        }
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('NGO details updated successfully for:', updatedUser.name);
    
    return NextResponse.json({ 
      success: true,
      message: 'Organization details saved successfully' 
    });
    
  } catch (error: any) {
    console.error('Error saving NGO details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save organization details' },
      { status: 500 }
    );
  }
}

// Get NGO details for a user
export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to retrieve organization details' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || (session.user as any).id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return NGO details if they exist
    return NextResponse.json({
      ngoDetails: user.ngoDetails || {}
    });
    
  } catch (error: any) {
    console.error('Error retrieving NGO details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve organization details' },
      { status: 500 }
    );
  }
} 
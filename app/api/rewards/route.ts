import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import { connectToDB } from '../../../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDB();
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get request data
    const { reason, amount } = await request.json();
    
    if (!reason || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid reward request' }, { status: 400 });
    }
    
    // Validate reason (only certain actions should give rewards)
    const validReasons = ['report_submission', 'validation', 'completion'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reward reason' }, { status: 400 });
    }
    
    // Create reward transaction
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'reward',
      amount
    });
    
    // Update user tokens
    user.tokens += amount;
    await user.save();
    
    // Return success response
    return NextResponse.json({ 
      message: 'CleanCoins awarded successfully',
      transaction,
      amount,
      newBalance: user.tokens
    });
    
  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}
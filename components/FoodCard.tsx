'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import timeSince from '@/lib/timeSince';

// Extend the user type to include role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface FoodCardProps {
  food: {
    _id: string;
    title: string;
    description: string;
    photo: string;
    status: 'available' | 'claimed' | 'completed' | 'expired';
    createdAt: string;
    donorId: {
      _id: string;
      name: string;
      address: string;
      rating: number;
      ratingCount: number;
    };
    isExpired?: boolean;
    claimedBy?: {
      _id: string;
      name: string;
      email?: string;
      phone?: string;
    };
    ngoDetails?: {
      name: string;
      phone?: string;
      pickupTime?: string | Date;
      notes?: string;
      email?: string;
      address?: string;
    };
  };
  onStatusChange?: () => void;
}

export default function FoodCard({ food, onStatusChange }: FoodCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const [showNgoDetailsModal, setShowNgoDetailsModal] = useState(false);
  const [ngoDetails, setNgoDetails] = useState({
    name: '',
    phone: '',
    pickupTime: '',
    notes: ''
  });
  
  // Get the user role in a type-safe way
  const getUserRole = (): string => {
    return (session?.user as ExtendedUser)?.role || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const handleClaimFood = async () => {
    setShowNgoDetailsModal(true);
  };

  const submitClaim = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!session) {
        setError('You must be logged in to claim food');
        return;
      }
      
      // Check required fields
      if (!ngoDetails.name || !ngoDetails.phone || !ngoDetails.pickupTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/food/${food._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'claimed',
          ngoDetails: ngoDetails
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to claim food');
      }
      
      // Close the modal
      setShowNgoDetailsModal(false);
      
      // Call the onStatusChange callback if provided
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      console.error('Error claiming food:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = () => {
    if (food.isExpired || food.status === 'expired') {
      return 'bg-gray-500';
    }
    
    switch (food.status) {
      case 'available':
        return 'bg-green-500';
      case 'claimed':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (food.isExpired) {
      return 'Expired';
    }
    return food.status.charAt(0).toUpperCase() + food.status.slice(1);
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{food.title}</h3>
        <span className={`${getStatusBadgeClass()} text-white text-xs font-bold px-2 py-1 rounded-full`}>
          {getStatusText()}
        </span>
      </div>
      
      {/* Debug information - will be removed in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-2 p-2 bg-gray-100 text-xs text-gray-700 rounded">
          <p>Status: {food.status}</p>
          <p>Has claimedBy: {food.claimedBy ? 'Yes' : 'No'}</p>
          <p>Has ngoDetails: {food.ngoDetails ? 'Yes' : 'No'}</p>
          <p>User role: {getUserRole()}</p>
          {food.ngoDetails && (
            <p>NGO Details: {JSON.stringify(food.ngoDetails)}</p>
          )}
        </div>
      )}
      
      {/* Display NGO information if item is claimed - with higher priority placement */}
      {(food.status === 'claimed' || food.status === 'completed') && food.ngoDetails && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-700 mb-1">Claimed by NGO:</h4>
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold mr-2">
              {food.ngoDetails.name.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-green-800">{food.ngoDetails.name}</p>
              {food.ngoDetails.phone && (
                <p className="text-xs text-green-700">Phone: {food.ngoDetails.phone}</p>
              )}
              {food.ngoDetails.pickupTime && (
                <p className="text-xs text-green-700">Pickup: {typeof food.ngoDetails.pickupTime === 'string' ? food.ngoDetails.pickupTime : formatDate(food.ngoDetails.pickupTime.toString())}</p>
              )}
              {food.ngoDetails.notes && (
                <p className="text-xs text-gray-600 mt-1">{food.ngoDetails.notes}</p>
              )}
              {food.claimedBy && (
                <button 
                  onClick={() => food.claimedBy && router.push(`/messages?recipient=${food.claimedBy._id}`)}
                  className="mt-1 text-sm text-green-600 hover:text-green-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Message NGO
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden bg-gray-100">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-500">Food Image</p>
          </div>
        ) : (
          <img
            src={food.photo || 'https://placehold.co/600x400?text=No+Image'}
            alt={food.title}
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      
      <p className="mb-4 text-gray-700">{food.description}</p>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          From: <span className="font-medium">{food.donorId.name}</span>
        </p>
        <p className="text-sm text-gray-600">
          Location: <span className="font-medium">{food.donorId.address}</span>
        </p>
        <div className="flex items-center mt-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= Math.round(food.donorId.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-1">
            ({food.donorId.rating.toFixed(1)}, {food.donorId.ratingCount} ratings)
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">{timeSince(food.createdAt)}</p>
        
        {session && getUserRole() === 'ngo' && food.status === 'available' && !food.isExpired && (
          <button
            onClick={handleClaimFood}
            className="btn-primary text-sm py-1 px-3"
          >
            Claim Food
          </button>
        )}
      </div>
      
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      
      {/* NGO Details Modal */}
      {showNgoDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Claim Food: {food.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name*
                </label>
                <input
                  type="text"
                  value={ngoDetails.name}
                  onChange={(e) => setNgoDetails({...ngoDetails, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Who will pick up the food?"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <input
                  type="tel"
                  value={ngoDetails.phone}
                  onChange={(e) => setNgoDetails({...ngoDetails, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Contact phone for pickup"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Time*
                </label>
                <input
                  type="text"
                  value={ngoDetails.pickupTime}
                  onChange={(e) => setNgoDetails({...ngoDetails, pickupTime: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="When will you pick up? (e.g. Today at 5pm)"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information
                </label>
                <textarea
                  value={ngoDetails.notes}
                  onChange={(e) => setNgoDetails({...ngoDetails, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Any additional details the restaurant should know"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNgoDetailsModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitClaim}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Submitting...' : 'Confirm Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt, FaQuoteLeft } from 'react-icons/fa';

interface Rating {
  _id: string;
  raterId: string | { name?: string; _id: string };
  ratedId: string;
  rating: number;
  comment: string;
  createdAt: string;
  foodId?: string;
  raterName?: string;
  foodDetails?: {
    title?: string;
    _id: string;
  };
}

interface RatingsSectionProps {
  userId: string;
}

const RatingsSection: React.FC<RatingsSectionProps> = ({ userId }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const response = await fetch(`/api/rating?ratedId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch ratings');
        }
        
        const data = await response.json();
        
        // Process the ratings data
        const processedRatings = data.map((rating: any) => ({
          ...rating,
          raterName: rating.raterId?.name || 'Anonymous',
        }));
        
        setRatings(processedRatings);
        
        // Calculate average rating
        if (processedRatings.length > 0) {
          const sum = processedRatings.reduce((acc: number, curr: Rating) => acc + curr.rating, 0);
          setAverageRating(sum / processedRatings.length);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching ratings');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchRatings();
    }
  }, [userId]);

  // Function to render rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    
    return stars;
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">NGO Feedback & Ratings</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : ratings.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center">
            <FaStar className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No Ratings Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You haven't received any ratings from NGOs yet. Ratings will appear here after NGOs review your food donations.
          </p>
        </div>
      ) : (
        <>
          {/* Average rating summary */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg mb-6 flex items-center">
            <div className="bg-white p-4 rounded-full shadow-sm mr-4">
              <div className="text-3xl font-bold text-green-600">
                {averageRating.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="flex items-center mb-1">
                {renderStars(averageRating)}
                <span className="ml-2 text-gray-700 font-medium">{ratings.length} reviews</span>
              </div>
              <p className="text-sm text-gray-600">
                Average rating based on feedback from NGOs that claimed your food donations
              </p>
            </div>
          </div>
          
          {/* Individual ratings */}
          <div className="space-y-6">
            {ratings.map((rating) => (
              <div key={rating._id} className="bg-gray-50 p-4 rounded-lg relative">
                <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg font-medium">
                  {formatDate(rating.createdAt)}
                </div>
                
                <div className="flex mb-2">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                    {typeof rating.raterId === 'object' && rating.raterId.name 
                      ? rating.raterId.name.substring(0, 1).toUpperCase() 
                      : rating.raterName?.substring(0, 1).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div className="font-medium">
                      {typeof rating.raterId === 'object' && rating.raterId.name 
                        ? rating.raterId.name 
                        : rating.raterName || 'Anonymous NGO'}
                    </div>
                    <div className="flex items-center">
                      {renderStars(rating.rating)}
                    </div>
                  </div>
                </div>
                
                {rating.comment && (
                  <div className="mt-3 pl-4 border-l-2 border-green-200">
                    <FaQuoteLeft className="text-green-300 mb-2 text-sm" />
                    <p className="text-gray-700">{rating.comment}</p>
                  </div>
                )}
                
                {rating.foodDetails && rating.foodDetails.title && (
                  <div className="mt-3 text-xs text-gray-500">
                    For donation: <span className="font-medium">{rating.foodDetails.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RatingsSection; 
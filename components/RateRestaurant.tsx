'use client';

import { useState } from 'react';

interface RateRestaurantProps {
  foodId: string;
  restaurantId: string;
  onRatingSuccess: () => void;
}

export default function RateRestaurant({ foodId, restaurantId, onRatingSuccess }: RateRestaurantProps) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodId,
          ratedId: restaurantId,
          rating,
          comment,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }
      
      setIsSubmitted(true);
      onRatingSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p>Thank you for your rating!</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Rate This Restaurant</h3>
      
      <form onSubmit={handleRatingSubmit}>
        <div className="mb-4">
          <p className="mb-2">Your Rating:</p>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="text-2xl focus:outline-none"
              >
                <span className={`${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="comment" className="block mb-2 text-sm font-medium">
            Comment (Optional):
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input"
            placeholder="Share your experience with this restaurant..."
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/200 characters
          </p>
        </div>
        
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
} 
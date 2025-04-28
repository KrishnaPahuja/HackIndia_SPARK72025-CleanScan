import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  color = 'text-yellow-400'
}) => {
  // Make sure rating is between 0 and maxRating
  const normalizedRating = Math.max(0, Math.min(rating, maxRating));
  
  // Generate the stars
  const stars = [];
  
  for (let i = 1; i <= maxRating; i++) {
    if (i <= normalizedRating) {
      // Full star
      stars.push(
        <FaStar 
          key={i} 
          size={size} 
          className={`${color}`} 
        />
      );
    } else if (i - 0.5 <= normalizedRating) {
      // Half star
      stars.push(
        <FaStarHalfAlt 
          key={i} 
          size={size} 
          className={`${color}`} 
        />
      );
    } else {
      // Empty star
      stars.push(
        <FaRegStar 
          key={i} 
          size={size} 
          className={`${color}`} 
        />
      );
    }
  }
  
  return (
    <div className="flex items-center">
      {stars}
      <span className="ml-1 text-gray-600">{normalizedRating.toFixed(1)}</span>
    </div>
  );
};

export default RatingStars; 
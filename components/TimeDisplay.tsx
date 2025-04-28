import React, { useState, useEffect } from 'react';

interface TimeDisplayProps {
  expiryTime: Date | string;
  className?: string;
}

// Local formatTimeRemaining function since we're getting an import error
const formatTimeRemaining = (expiryDate: Date): string => {
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Expired";
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m remaining`;
  } else {
    return "Less than a minute remaining";
  }
};

const TimeDisplay: React.FC<TimeDisplayProps> = ({ expiryTime, className = '' }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    // Convert to Date object if string was passed
    const expiryDate = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
    
    const updateTimeRemaining = () => {
      const now = new Date();
      
      if (now > expiryDate) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const timeString = formatTimeRemaining(expiryDate);
      setTimeRemaining(timeString);
      
      // Calculate urgency based on time remaining
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours <= 3) {
        setUrgency('high');
      } else if (diffHours <= 12) {
        setUrgency('medium');
      } else {
        setUrgency('low');
      }
    };

    // Initial update
    updateTimeRemaining();
    
    // Update every minute
    const intervalId = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(intervalId);
  }, [expiryTime]);

  // Determine text and background colors based on expiry status and urgency
  const getDisplayClasses = () => {
    if (isExpired) {
      return 'text-white bg-gray-500 px-2 py-1 rounded-full text-xs font-medium';
    }
    
    if (urgency === 'high') {
      return 'text-white bg-red-500 px-2 py-1 rounded-full text-xs font-medium animate-pulse';
    } else if (urgency === 'medium') {
      return 'text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium';
    } else {
      return 'text-green-800 bg-green-100 px-2 py-1 rounded-full text-xs font-medium';
    }
  };

  return (
    <span className={`inline-block ${getDisplayClasses()} ${className}`}>
      {isExpired ? (
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeRemaining}
        </span>
      ) : (
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeRemaining}
        </span>
      )}
    </span>
  );
};

export default TimeDisplay; 
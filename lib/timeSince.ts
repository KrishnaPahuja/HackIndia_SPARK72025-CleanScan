/**
 * Formats a date string to a human-readable time ago format
 * e.g. "5 minutes ago", "2 hours ago", "3 days ago"
 */
export default function timeSince(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000; // seconds in a year
  
  if (interval > 1) {
    return `${Math.floor(interval)} year${Math.floor(interval) !== 1 ? 's' : ''} ago`;
  }
  
  interval = seconds / 2592000; // seconds in a month
  if (interval > 1) {
    return `${Math.floor(interval)} month${Math.floor(interval) !== 1 ? 's' : ''} ago`;
  }
  
  interval = seconds / 86400; // seconds in a day
  if (interval > 1) {
    return `${Math.floor(interval)} day${Math.floor(interval) !== 1 ? 's' : ''} ago`;
  }
  
  interval = seconds / 3600; // seconds in an hour
  if (interval > 1) {
    return `${Math.floor(interval)} hour${Math.floor(interval) !== 1 ? 's' : ''} ago`;
  }
  
  interval = seconds / 60; // seconds in a minute
  if (interval > 1) {
    return `${Math.floor(interval)} minute${Math.floor(interval) !== 1 ? 's' : ''} ago`;
  }
  
  return `${Math.floor(seconds)} second${Math.floor(seconds) !== 1 ? 's' : ''} ago`;
} 
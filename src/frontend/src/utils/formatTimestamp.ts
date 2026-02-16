/**
 * Formats a backend Time (nanoseconds as bigint) into a readable English timestamp.
 * @param time - Time in nanoseconds (bigint)
 * @returns Formatted date string in English locale
 */
export function formatTimestamp(time: bigint): string {
  // Convert nanoseconds to milliseconds
  const milliseconds = Number(time / 1_000_000n);
  const date = new Date(milliseconds);
  
  // Format using Intl.DateTimeFormat with English locale
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  
  return formatter.format(date);
}

/**
 * Formats a timestamp as a relative time string (e.g., "2 hours ago")
 * @param time - Time in nanoseconds (bigint)
 * @returns Relative time string in English
 */
export function formatRelativeTime(time: bigint): string {
  const milliseconds = Number(time / 1_000_000n);
  const date = new Date(milliseconds);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatTimestamp(time);
  }
}

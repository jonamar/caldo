import { SCALE_FACTOR, HEADER_HEIGHT } from './constants';

/**
 * Convert time (hours, minutes) to pixel position
 * @param {number} hours - Hour value
 * @param {number} minutes - Minute value
 * @param {Object} options - Options object
 * @param {boolean} options.includeHeaderOffset - Whether to include header offset
 * @param {Object} rangeOverride - Optional time range override
 * @returns {number} - Pixel position
 */
export const timeToPosition = (hours, minutes, options = {}, rangeOverride = null) => {
  const { includeHeaderOffset = true } = options; 
  
  const effectiveTimeRange = rangeOverride || { startHour: 8, endHour: 18, startMinuteRemainder: 0 }; 

  if (!effectiveTimeRange || typeof effectiveTimeRange.startHour === 'undefined' || typeof effectiveTimeRange.endHour === 'undefined') {
    if (window.debugCaldo) console.error("timeToPosition: effectiveTimeRange is invalid or not yet defined.", JSON.parse(JSON.stringify(effectiveTimeRange)));
    return includeHeaderOffset ? HEADER_HEIGHT : 0; 
  }
  
  const minutesFromStart = (hours - effectiveTimeRange.startHour) * 60 + minutes - (effectiveTimeRange.startMinuteRemainder || 0);
  let position = minutesFromStart * SCALE_FACTOR;
  
  if (includeHeaderOffset) {
    position += HEADER_HEIGHT;
  }
  return position;
};

/**
 * Calculate position for a task based on its start time
 * @param {string} start - Start time in HH:MM format
 * @param {Object} timeRange - Time range object
 * @returns {number} - Pixel position
 */
export const calculateTaskPosition = (start, timeRange) => {
  const [hour, min] = start.split(':').map(Number);
  // Match the time markers by using includeHeaderOffset: false
  return timeToPosition(hour, min, { includeHeaderOffset: false }, timeRange);
};

/**
 * Calculate height based on duration in minutes
 * @param {number} duration - Duration in minutes
 * @returns {number} - Height in pixels
 */
export const calculateHeight = (duration) => {
  // For absolute positioning, height should be proportional to duration
  // Minimum height ensures very short tasks are still visible
  const minHeight = 32;
  const durationHeight = duration * SCALE_FACTOR;
  
  // We'll use the exact duration height to maintain grid alignment
  return Math.max(minHeight, durationHeight);
};

/**
 * Calculate current time indicator position
 * @param {Date} currentTime - Current time
 * @param {Object} timeRange - Time range object
 * @returns {number} - Pixel position for current time indicator
 */
export const calculateCurrentTimePosition = (currentTime, timeRange) => {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  return timeToPosition(currentHour, currentMinute, { includeHeaderOffset: false }, timeRange);
};

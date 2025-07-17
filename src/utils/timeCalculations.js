import { DEFAULT_TIME_RANGE, TIME_BUFFER } from './constants';

/**
 * Calculate the time range for displaying tasks with appropriate buffers
 * @param {Array} taskList - Array of tasks with start and end times
 * @returns {Object} - Object with startHour, endHour, startMinuteRemainder
 */
export const calculateTimeRange = (taskList) => {
  if (window.debugCaldo) console.log("calculateTimeRange called with tasks:", JSON.parse(JSON.stringify(taskList || [])));
  
  if (!taskList || taskList.length === 0) {
    if (window.debugCaldo) console.log("calculateTimeRange returning default (no tasks):", DEFAULT_TIME_RANGE);
    return DEFAULT_TIME_RANGE;
  }
  
  let earliestMinutes = 24 * 60;
  let latestMinutes = 0;
  let validTasksFound = false;
  
  taskList.forEach(task => {
    if (!task || !task.start || !task.end || !task.start.includes(':') || !task.end.includes(':')) {
      if (window.debugCaldo) console.warn("calculateTimeRange: Skipping task with invalid start/end times", task);
      return; // Skip malformed tasks
    }
    validTasksFound = true;
    const startHour = parseInt(task.start.split(':')[0]);
    const startMin = parseInt(task.start.split(':')[1]);
    const endHour = parseInt(task.end.split(':')[0]);
    const endMin = parseInt(task.end.split(':')[1]);
    
    const startTotalMins = startHour * 60 + startMin;
    const endTotalMins = endHour * 60 + endMin;
    
    earliestMinutes = Math.min(earliestMinutes, startTotalMins);
    latestMinutes = Math.max(latestMinutes, endTotalMins);
  });
  
  if (!validTasksFound) {
    if (window.debugCaldo) console.log("calculateTimeRange returning default (no valid tasks found):", DEFAULT_TIME_RANGE);
    return DEFAULT_TIME_RANGE;
  }

  const startMinutes = Math.max(0, earliestMinutes - TIME_BUFFER.top);
  const endMinutes = Math.min(24 * 60, latestMinutes + TIME_BUFFER.bottom);
  
  const startHour = Math.floor(startMinutes / 60);
  const startMinuteRemainder = startMinutes % 60;
  const endHour = Math.ceil(endMinutes / 60);
  
  const resultRange = { 
    startHour, 
    startMinuteRemainder,
    endHour 
  };
  if (window.debugCaldo) console.log("calculateTimeRange returning:", resultRange);
  return resultRange;
};

/**
 * Calculate duration between two time strings in minutes
 * @param {string} start - Start time in HH:MM format
 * @param {string} end - End time in HH:MM format
 * @returns {number} - Duration in minutes
 */
export const calculateDuration = (start, end) => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} - True if same day
 */
export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Format duration in minutes to human readable format
 * @param {number} duration - Duration in minutes
 * @returns {string} - Formatted duration (e.g., "1h30m", "45m")
 */
export const formatDuration = (duration) => {
  if (Math.floor(duration / 60) > 0) {
    return `${Math.floor(duration / 60)}h${duration % 60 > 0 ? `${duration % 60}m` : ''}`;
  }
  return `${duration}m`;
};

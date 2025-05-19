import React, { useState, useEffect } from "react";
import { 
  loadTasksForDate, 
  formatDateForFile, 
  saveTasksForDate,
  createTask,
  updateTask,
  deleteTask 
} from "../utils/taskLoader";

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Always use today's date instead of a selectable date
  const [dateString, setDateString] = useState(formatDateForFile());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60000ms = 1 minute
    
    return () => clearInterval(timer);
  }, []);
  
  // State is already declared above, no need to redeclare

  // Load tasks for today's date
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // Format today's date for storage
        const formattedDate = formatDateForFile();
        setDateString(formattedDate);
        
        // Load tasks from localStorage
        const loadedTasks = await loadTasksForDate(formattedDate);
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Refresh tasks (replaces date change functionality)
  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      // Format today's date for storage
      const formattedDate = formatDateForFile();
      setDateString(formattedDate);
      
      // Load tasks from localStorage
      const loadedTasks = await loadTasksForDate(formattedDate);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear all Caldo-related localStorage and server data for the current date
  const handleClearTasks = async () => {
    // Remove from localStorage
    window.localStorage.removeItem(`tasks_${dateString}`);
    // Remove 'caldo_initialized' flag to allow re-initialization if needed
    window.localStorage.removeItem('caldo_initialized');
    // Remove from server (if online)
    try {
      await deleteTask(dateString, '*'); // '*' as a convention to delete all tasks
    } catch (err) {
      // ignore errors if offline
      console.log('Error clearing tasks from server:', err);
    }
    // Reload tasks (show empty list)
    setTasks([]);
    
    // Show confirmation
    alert('All tasks cleared successfully!');
  };

  // Toggle task completion status
  const toggleCheck = async (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, checked: !task.checked } : task
    );
    
    setTasks(updatedTasks);
    
    // Save the updated tasks
    await saveTasksForDate(dateString, updatedTasks);
  };

  // Calculate task duration in minutes
  const calculateDuration = (start, end) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  };
  
  // Calendar constants and configuration
  const SCALE_FACTOR = 2; // 2px per minute = 120px per hour
  const HEADER_HEIGHT = 30; // Minimal height of the date selector area
  const TIME_COLUMN_WIDTH = 48; // Width of the time markers column
  const TASK_BUFFER = 4; // Reduced buffer space for tasks
  const TOP_PADDING = 5; // Extremely minimal padding at the top of the calendar
  
  // Calculate the position for the current time indicator
  const calculateCurrentTimePosition = () => {
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return timeToPosition(currentHour, currentMinute);
  };
  
  // Check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  const calculateTimeRange = (taskList) => {
    if (!taskList || taskList.length === 0) return { startHour: 8, endHour: 18 }; // Default 8am-6pm if no tasks
    
    let earliestMinutes = 24 * 60;
    let latestMinutes = 0;
    
    taskList.forEach(task => {
      const startHour = parseInt(task.start.split(':')[0]);
      const startMin = parseInt(task.start.split(':')[1]);
      const endHour = parseInt(task.end.split(':')[0]);
      const endMin = parseInt(task.end.split(':')[1]);
      
      // Convert to total minutes for more precise calculation
      const startTotalMins = startHour * 60 + startMin;
      const endTotalMins = endHour * 60 + endMin;
      
      earliestMinutes = Math.min(earliestMinutes, startTotalMins);
      latestMinutes = Math.max(latestMinutes, endTotalMins);
    });
    
    // Absolute minimal buffer: 2 minutes above, 10 minutes below
    const topBufferMinutes = 2;
    const bottomBufferMinutes = 10;
    
    // Calculate start and end times with buffer
    const startMinutes = Math.max(0, earliestMinutes - topBufferMinutes);
    const endMinutes = Math.min(24 * 60, latestMinutes + bottomBufferMinutes);
    
    // Convert back to hours
    const startHour = Math.floor(startMinutes / 60);
    const startMinuteRemainder = startMinutes % 60;
    const endHour = Math.ceil(endMinutes / 60);
    
    return { 
      startHour, 
      startMinuteRemainder,
      endHour 
    };
  };
  
  const timeToPosition = (hours, minutes, options = {}) => {
    const { includeHeaderOffset = true, applyTaskOffset = false } = options;
    const timeRange = calculateTimeRange(tasks);
    
    // Calculate minutes from the start of the visible range, accounting for partial hour start
    const minutesFromStart = (hours - timeRange.startHour) * 60 + minutes - (timeRange.startMinuteRemainder || 0);
    
    // Convert to pixels
    let position = minutesFromStart * SCALE_FACTOR;
    
    // Add header offset if needed
    if (includeHeaderOffset) {
      position += HEADER_HEIGHT;
    }
    
    return position;
  };
  
  // Calculate position for a task based on its start time
  const calculateTaskPosition = (start) => {
    const [hour, min] = start.split(':').map(Number);
    return timeToPosition(hour, min);
  };

  // Calculate height based on duration
  const calculateHeight = (duration) => {
    // For absolute positioning, height should be proportional to duration
    // Minimum height ensures very short tasks are still visible
    const minHeight = 32;
    const durationHeight = duration * SCALE_FACTOR;
    
    // We'll use the exact duration height to maintain grid alignment
    return Math.max(minHeight, durationHeight);
  };

  // Calculate the earliest and latest times for the day's tasks
  // Check if current time is within the visible range
  const isCurrentTimeVisible = () => {
    // Always show the current time indicator since we're always viewing today
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert current time to minutes
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Check if current time falls within the visible range
    return currentHour >= timeRange.startHour && currentHour < timeRange.endHour;
  };
  
  const timeRange = calculateTimeRange(tasks);
  const visibleHours = timeRange.endHour - timeRange.startHour;

  return (
    <div className="w-full max-w-md space-y-0 relative">
      <div className="mb-1 relative z-30">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-700">
            Today's Tasks
          </h2>
          <button 
            onClick={refreshTasks}
            className="w-6 h-6 flex items-center justify-center bg-gray-500 hover:bg-gray-600 rounded-full transition-colors"
            title="Refresh tasks"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Time range is automatically calculated with 20min buffer above and 40min below */}
      
      {/* Task card container, now also holds the current time indicator */}
      <div style={{ 
        height: `${visibleHours * 60 * SCALE_FACTOR + TOP_PADDING}px`, 
        position: 'relative', 
        marginLeft: `${TIME_COLUMN_WIDTH}px`,
        paddingTop: `${TOP_PADDING}px`
      }}>
        {/* Current time indicator (red line) - must be inside this container */}
        {isCurrentTimeVisible() && (
          <div 
            className="absolute border-t-2 border-red-500 pointer-events-none"
            style={{ 
              top: `${timeToPosition(currentTime.getHours(), currentTime.getMinutes(), { includeHeaderOffset: false })}px`,
              left: 0,
              right: 0,
              zIndex: 1000
            }}
          />
        )}

        {isLoading ? (
          <div className="text-center py-2">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-2 text-gray-500">No tasks for this date</div>
        ) : (
          tasks.map((task) => {
            const duration = calculateDuration(task.start, task.end);
            const height = calculateHeight(duration);
            const position = calculateTaskPosition(task.start);
            
            return (
              <div
                key={task.id}
                className={`flex items-start py-0.5 px-1 rounded-lg shadow-sm bg-white transition border-l-4 overflow-hidden ${
                  task.checked ? "border-green-400 opacity-60" : "border-blue-400"
                } relative`}
                style={{ 
                  height: `${height - (TASK_BUFFER * 2)}px`, // Fixed height instead of minHeight
                  position: 'absolute',
                  top: `${position}px`,
                  left: 0,
                  right: 0,
                  zIndex: task.id, // Use task ID for z-index to maintain consistent stacking
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)' // Add subtle shadow for depth
                }}
              >
                <input
                  type="checkbox"
                  checked={task.checked}
                  onChange={() => toggleCheck(task.id)}
                  className="w-3 h-3 accent-blue-500 mr-2 mt-1"
                />
                <div className="flex-1 group flex justify-between items-start">
                  <div className={`font-medium text-[0.625rem] ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {task.title}
                  </div>
                  <div className="text-[0.55rem] text-gray-400 whitespace-nowrap ml-2">
                    {task.start} - {task.end} (
                    {Math.floor(duration / 60) > 0 
                      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? `${duration % 60}m` : ''}` 
                      : `${duration}m`})
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Time grid lines - skip first and last hour */}
      <div className="absolute left-0 top-[30px] bottom-0 w-12 border-r border-gray-200 pr-1 z-20">
        {Array.from({ length: Math.max(0, visibleHours - 2) }, (_, i) => (
          <div key={`time-${i}`} className="relative">
            <div 
              className="absolute text-[0.6rem] text-gray-400 right-1" 
              style={{ 
                top: `${timeToPosition(timeRange.startHour + i + 1, 0, { includeHeaderOffset: false })}px` 
              }}
            >
              {timeRange.startHour + i + 1}:00
            </div>
          </div>
        ))}
      </div>
      
      {/* Horizontal grid lines - skip first and last hour */}
      <div className="absolute left-[48px] right-0 top-[30px] bottom-0 pointer-events-none">
        {Array.from({ length: Math.max(0, visibleHours - 2) }, (_, i) => (
          <div 
            key={`grid-${i}`} 
            className="border-t border-gray-100" 
            style={{ 
              position: 'absolute', 
              left: 0, 
              right: 0, 
              top: `${timeToPosition(timeRange.startHour + i + 1, 0, { includeHeaderOffset: false })}px` 
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Calendar;

import React, { useState, useEffect } from "react";
import { loadTasksForDate, formatDateForFile, saveTasksForDate } from "../utils/taskLoader";

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  
  // Load tasks when the selected date changes
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // Format the date for the file name
        const formattedDate = formatDateForFile(selectedDate);
        setDateString(formattedDate);
        
        // Try to load from localStorage first (for tasks that were modified)
        const savedTasks = localStorage.getItem(`tasks_${formattedDate}`);
        
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        } else {
          // If not in localStorage, load from YAML file
          const loadedTasks = await loadTasksForDate(formattedDate);
          setTasks(loadedTasks);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  // Toggle task completion status
  const toggleCheck = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, checked: !task.checked } : task
    );
    
    setTasks(updatedTasks);
    
    // Save the updated tasks
    saveTasksForDate(dateString, updatedTasks);
  };

  // Format date for the date input
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
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
  const HEADER_HEIGHT = 60; // Height of the date selector area
  const TIME_COLUMN_WIDTH = 48; // Width of the time markers column
  const TASK_BUFFER = 8; // Buffer space for tasks
  
  // Single source of truth for all time-to-position calculations
  const timeToPosition = (hours, minutes, options = {}) => {
    const { includeHeaderOffset = true, applyTaskOffset = false } = options;
    const timeRange = calculateTimeRange(tasks);
    
    // Calculate minutes from the start of the visible range
    const minutesFromStart = (hours - timeRange.startHour) * 60 + minutes;
    
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
    // Only show if we're viewing today's date
    if (!isSameDay(selectedDate, new Date())) return false;
    
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert current time to minutes
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Check if current time falls within the visible range
    return currentHour >= timeRange.startHour && currentHour < timeRange.endHour;
  };
  
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
    
    // Add exactly 30 min buffer, distributed as 15 min before and 15 min after
    const bufferMinutes = 15;
    
    // Calculate start and end times with buffer
    const startMinutes = Math.max(0, earliestMinutes - bufferMinutes);
    const endMinutes = Math.min(24 * 60, latestMinutes + bufferMinutes);
    
    // Convert back to hours, rounding to the nearest hour
    const startHour = Math.floor(startMinutes / 60);
    const endHour = Math.ceil(endMinutes / 60);
    
    return { startHour, endHour };
  };
  
  const timeRange = calculateTimeRange(tasks);
  const visibleHours = timeRange.endHour - timeRange.startHour;
  
  return (
    <div className="w-full max-w-md space-y-0 relative">
      <div className="mb-2 relative z-30">
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Date:
        </label>
        <input
          type="date"
          id="date-select"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          className="w-full p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-30"
        />
      </div>
      
      {/* Time range is automatically calculated */}
      
      {/* Current time indicator */}
      {isCurrentTimeVisible() && (
        <div 
          className="absolute border-t-2 border-red-500 z-25 pointer-events-none"
          style={{ 
            top: `${calculateCurrentTimePosition()}px`,
            left: `${TIME_COLUMN_WIDTH}px`,
            right: 0
          }}
        />
      )}
      
      {/* Time grid lines - skip first and last hour */}
      <div className="absolute left-0 top-[60px] bottom-0 w-12 border-r border-gray-200 pr-1 z-20">
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
      <div className="absolute left-[48px] right-0 top-[60px] bottom-0 pointer-events-none">
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
      
      <div style={{ 
        height: `${visibleHours * 60 * SCALE_FACTOR + HEADER_HEIGHT}px`, 
        position: 'relative', 
        marginLeft: `${TIME_COLUMN_WIDTH}px`,
        paddingTop: `${HEADER_HEIGHT}px`
      }}>
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
              <div className="flex-1">
                {duration < 30 ? (
                  // For tasks under 30 minutes, hide timing text
                  <div className="flex items-center">
                    <div className={`font-medium text-[0.625rem] ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</div>
                  </div>
                ) : (
                  // For longer tasks, keep the original stacked layout
                  <>
                    <div className={`font-medium text-[0.625rem] ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</div>
                    <div className="text-[0.55rem] text-gray-400">
                      {task.start} - {task.end} (
                      {Math.floor(duration / 60) > 0 
                        ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ''}` 
                        : `${duration}m`})
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}

export default Calendar;

import React, { useState, useEffect } from "react";
import { loadTasksForDate, formatDateForFile, saveTasksForDate } from "../utils/taskLoader";

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateString, setDateString] = useState(formatDateForFile());

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
  
  // Scale factor for the grid (pixels per minute)
  const SCALE_FACTOR = 2; // 2px per minute = 120px per hour
  
  // Calculate position based on start time, adjusted for the visible time range
  const calculatePosition = (start) => {
    const [hour, min] = start.split(':').map(Number);
    // Convert time to pixels with scaling factor, offset by the start hour
    const timeRange = calculateTimeRange(tasks);
    // No additional offset needed - should align perfectly with grid
    return ((hour - timeRange.startHour) * 60 + min) * SCALE_FACTOR;
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
  const calculateTimeRange = (taskList) => {
    if (!taskList || taskList.length === 0) return { startHour: 8, endHour: 18 }; // Default 8am-6pm if no tasks
    
    let earliestTime = 24;
    let latestTime = 0;
    
    taskList.forEach(task => {
      const startHour = parseInt(task.start.split(':')[0]);
      const endHour = parseInt(task.end.split(':')[0]);
      const endMinutes = parseInt(task.end.split(':')[1]);
      
      earliestTime = Math.min(earliestTime, startHour);
      // If end time has minutes, round up to the next hour
      latestTime = Math.max(latestTime, endMinutes > 0 ? endHour + 1 : endHour);
    });
    
    // Add buffer (round down to nearest hour for start, round up for end)
    const startHour = Math.max(0, earliestTime - 1); // At least 1 hour buffer before
    const endHour = Math.min(24, latestTime + 1); // At least 1 hour buffer after
    
    return { startHour, endHour };
  };
  
  const timeRange = calculateTimeRange(tasks);
  const visibleHours = timeRange.endHour - timeRange.startHour;
  
  return (
    <div className="w-full max-w-md space-y-0 relative">
      <div className="mb-2">
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Date:
        </label>
        <input
          type="date"
          id="date-select"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          className="w-full p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Time range indicator */}
      <div className="text-xs text-gray-500 mb-1">
        Showing {timeRange.startHour}:00 - {timeRange.endHour}:00
      </div>
      
      {/* Time grid lines */}
      <div className="absolute left-0 top-[60px] bottom-0 w-12 border-r border-gray-200 pr-1 z-20">
        {Array.from({ length: visibleHours + 1 }, (_, i) => (
          <div key={`time-${i}`} className="relative">
            <div className="absolute text-[0.6rem] text-gray-400 right-1" style={{ top: `${i * 60 * SCALE_FACTOR}px` }}>
              {timeRange.startHour + i}:00
            </div>
          </div>
        ))}
      </div>
      
      {/* Horizontal grid lines */}
      <div className="absolute left-[48px] right-0 top-[60px] bottom-0 pointer-events-none">
        {Array.from({ length: visibleHours + 1 }, (_, i) => (
          <div 
            key={`grid-${i}`} 
            className="border-t border-gray-100" 
            style={{ position: 'absolute', left: 0, right: 0, top: `${i * 60 * SCALE_FACTOR}px` }}
          />
        ))}
      </div>
      
      <div className="pt-[60px]" style={{ height: `${visibleHours * 60 * SCALE_FACTOR}px`, position: 'relative', marginLeft: '48px' }}>
        {isLoading ? (
          <div className="text-center py-2">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-2 text-gray-500">No tasks for this date</div>
        ) : (
          tasks.map((task) => {
          const duration = calculateDuration(task.start, task.end);
          const height = calculateHeight(duration);
          const position = calculatePosition(task.start);
          
          // Create visual buffer between tasks
          const taskBuffer = 8; // Increased buffer size
          
          return (
            <div
              key={task.id}
              className={`flex items-start p-1 rounded-lg shadow-sm bg-white transition border-l-4 overflow-hidden ${
                task.checked ? "border-green-400 opacity-60" : "border-blue-400"
              } relative`}
              style={{ 
                height: `${height - (taskBuffer * 2)}px`, // Fixed height instead of minHeight
                position: 'absolute',
                top: `${position + taskBuffer}px`, // Add buffer to top position
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
                <div className={`font-medium text-[0.7rem] ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</div>
                <div className="text-[0.6rem] text-gray-400">
                  {task.start} - {task.end} (
                  {Math.floor(duration / 60) > 0 
                    ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ''}` 
                    : `${duration}m`})
                </div>
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

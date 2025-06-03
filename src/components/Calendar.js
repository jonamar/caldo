import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    // Dropped outside the list or in the same spot
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const reorderedTasksArray = Array.from(tasks);
    const [draggedItem] = reorderedTasksArray.splice(source.index, 1);
    reorderedTasksArray.splice(destination.index, 0, draggedItem);

    // Determine the anchor start time
    let anchorStartTimeMinutes = timeToMinutes(tasks[0]?.start || '08:00');
    // If the first item was dragged, its original start time becomes the anchor for the new sequence starting with it.
    // Or, if the list was initially empty, the dragged item's start time is the anchor.
    if ((source.index === 0 && reorderedTasksArray.length > 0 && reorderedTasksArray[0].id === draggedItem.id) || 
        (tasks.length === 0 && reorderedTasksArray.length > 0)) {
        anchorStartTimeMinutes = timeToMinutes(draggedItem.start || '08:00');
    }

    const finalUpdatedTasks = [];
    for (let i = 0; i < reorderedTasksArray.length; i++) {
      const task = reorderedTasksArray[i];
      // Calculate duration based on its original start/end before any modifications in this drag operation
      // This requires finding the original task object if start/end were already modified in a previous iteration by mistake.
      // However, reorderedTasksArray contains tasks with their original start/end prior to this loop.
      const originalDurationMinutes = calculateDuration(task.start, task.end);
      let newStartTimeMinutes;

      if (i === 0) {
        newStartTimeMinutes = anchorStartTimeMinutes;
      } else {
        // Use the .end time of the *previously processed task in this loop*
        const previousTaskEndTimeMinutes = timeToMinutes(finalUpdatedTasks[i - 1].end);
        newStartTimeMinutes = previousTaskEndTimeMinutes;
      }

      const newEndTimeMinutes = newStartTimeMinutes + originalDurationMinutes;

      finalUpdatedTasks.push({
        ...task,
        start: minutesToTime(newStartTimeMinutes),
        end: minutesToTime(newEndTimeMinutes),
      });
    }

    setTasks(finalUpdatedTasks);
    await saveTasksForDate(dateString, finalUpdatedTasks);
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

  // Helper function to convert "HH:MM" string to total minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0; // Or handle error appropriately
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert total minutes from midnight to "HH:MM" string
const minutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes < 0) totalMinutes = 0; // Handle invalid input
  // Ensure totalMinutes does not exceed minutes in a day for formatting
  totalMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
    if (window.debugCaldo) console.log("calculateTimeRange called with tasks:", JSON.parse(JSON.stringify(taskList || [])));
    if (!taskList || taskList.length === 0) {
      const defaultRange = { startHour: 8, endHour: 18, startMinuteRemainder: 0 };
      if (window.debugCaldo) console.log("calculateTimeRange returning default (no tasks):", defaultRange);
      return defaultRange;
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
    
    if (!validTasksFound) { // All tasks were skipped or list was effectively empty of valid tasks
      const defaultRange = { startHour: 8, endHour: 18, startMinuteRemainder: 0 };
      if (window.debugCaldo) console.log("calculateTimeRange returning default (no valid tasks found):", defaultRange);
      return defaultRange;
    }

    const topBufferMinutes = 2;
    const bottomBufferMinutes = 10;
    
    const startMinutes = Math.max(0, earliestMinutes - topBufferMinutes);
    const endMinutes = Math.min(24 * 60, latestMinutes + bottomBufferMinutes);
    
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
  
  const timeToPosition = (hours, minutes, options = {}, rangeOverride = null) => {
    const { includeHeaderOffset = true } = options; 
    
    const effectiveTimeRange = rangeOverride || timeRange; 

    if (!effectiveTimeRange || typeof effectiveTimeRange.startHour === 'undefined' || typeof effectiveTimeRange.endHour === 'undefined') {
      if (window.debugCaldo) console.error("timeToPosition: effectiveTimeRange is invalid or not yet defined.", JSON.parse(JSON.stringify(effectiveTimeRange)), "Current tasks:", JSON.parse(JSON.stringify(tasks)));
      return includeHeaderOffset ? HEADER_HEIGHT : 0; 
    }
    
    const minutesFromStart = (hours - effectiveTimeRange.startHour) * 60 + minutes - (effectiveTimeRange.startMinuteRemainder || 0);
    let position = minutesFromStart * SCALE_FACTOR;
    
    if (includeHeaderOffset) {
      position += HEADER_HEIGHT;
    }
    return position;
  };
  
  // Calculate position for a task based on its start time
  const calculateTaskPosition = (start) => {
    const [hour, min] = start.split(':').map(Number);
    // Match the time markers by using includeHeaderOffset: false
    return timeToPosition(hour, min, { includeHeaderOffset: false });
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

// --- Start of Time Indicator Debug Logic ---
console.log("Time Indicator Debug Logic block entered - v3");
const timeRange = calculateTimeRange(tasks); // This is for the grid lines and general UI
const visibleHours = (timeRange && typeof timeRange.endHour !== 'undefined' && typeof timeRange.startHour !== 'undefined') 
                     ? timeRange.endHour - timeRange.startHour 
                     : 10; 

let localIndicatorTimeRange = null;
let localIndicatorVisible = false;
let localIndicatorTopPosition = 0;

if (currentTime && typeof currentTime.getHours === 'function') {
  localIndicatorTimeRange = calculateTimeRange(tasks); 

  localIndicatorVisible = currentTime.getHours() >= localIndicatorTimeRange.startHour && 
                          currentTime.getHours() < localIndicatorTimeRange.endHour;
  
  localIndicatorTopPosition = timeToPosition(
    currentTime.getHours(), 
    currentTime.getMinutes(), 
    { includeHeaderOffset: false }, 
    localIndicatorTimeRange 
  );

  console.log("window.debugCaldo value check before group:", window.debugCaldo);
  if (window.debugCaldo) {
    console.groupCollapsed(
      `%cTime Indicator Debug @ ${currentTime.toLocaleTimeString()}`,
      'color: dodgerblue; font-weight: bold;'
    );
    console.log("Current Time (state):", currentTime.toLocaleTimeString(), currentTime);
    console.log("Tasks (state):", JSON.parse(JSON.stringify(tasks)));
    console.log("Calculated TimeRange (for indicator):", localIndicatorTimeRange);
    console.log("Is Current Time Visible (for indicator):", localIndicatorVisible);
    console.log("Calculated Top Position (for indicator):", localIndicatorTopPosition);
    console.groupEnd();
  }
} else {
  if (window.debugCaldo) console.warn("Time Indicator Debug: currentTime state is not yet valid.", currentTime);
}
// --- End of Time Indicator Debug Logic ---

return (
  <div className="w-full max-w-md space-y-0 relative">
    {/* Header Section for Date and Refresh Button */}
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
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
      </div>
    </div>

    {/* Main Calendar Area with Drag and Drop Context */}
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ position: 'relative' }}> {/* This div will contain both time grid and droppable task area */}
        
        {/* Time Grid Lines (Vertical - Time Markers) */}
        <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-gray-200 pr-1 z-0" style={{ paddingTop: `${HEADER_HEIGHT + TOP_PADDING}px` }}>
          {Array.from({ length: Math.max(0, visibleHours) }, (_, i) => {
            // Display every hour, adjust if timeRange.startMinuteRemainder is present for first hour
            const hourToDisplay = timeRange.startHour + i;
            if (hourToDisplay > timeRange.endHour) return null; // Don't draw past endHour
            // Calculate position carefully, relative to the start of the droppable area
            const minuteOffsetPx = (timeRange.startMinuteRemainder || 0) * SCALE_FACTOR;
            const position = timeToPosition(hourToDisplay, 0, { includeHeaderOffset: false }) - minuteOffsetPx;
            if (position < 0 && i > 0) return null; // Skip if before visible start due to startMinuteRemainder

            return (
              <div key={`time-marker-${hourToDisplay}`} className="relative">
                <div 
                  className="absolute text-[0.6rem] text-gray-400 right-1"
                  style={{ top: `${position}px` }}
                >
                  {hourToDisplay}:00
                </div>
              </div>
            );
          })}
        </div>

        {/* Horizontal Grid Lines */}
        <div className="absolute left-[48px] right-0 top-0 bottom-0 pointer-events-none z-0" style={{ paddingTop: `${HEADER_HEIGHT + TOP_PADDING}px` }}>
          {Array.from({ length: Math.max(0, visibleHours) }, (_, i) => {
            const hourToDisplay = timeRange.startHour + i;
            if (hourToDisplay > timeRange.endHour) return null;
            const position = timeToPosition(hourToDisplay, 0, { includeHeaderOffset: false });
            if (position < 0 && i > 0) return null;

            return (
              <div 
                key={`grid-line-${hourToDisplay}`} 
                className="border-t border-gray-100"
                style={{ position: 'absolute', left: 0, right: 0, top: `${position}px` }}
              />
            );
          })}
        </div>

        {/* Droppable Area for Tasks */}
        <Droppable droppableId="calendar-tasks">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                minHeight: `${visibleHours * 60 * SCALE_FACTOR + TOP_PADDING}px`,
                position: 'relative', // Crucial for absolute positioning of tasks
                marginLeft: `${TIME_COLUMN_WIDTH}px`, // Offset for time column
                paddingTop: `${HEADER_HEIGHT + TOP_PADDING}px`, // Offset for header
                // backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,255,0.1)' : 'transparent', // Visual cue
                zIndex: 1 // Ensure tasks are above grid lines
              }}
            >
              {/* Current Time Indicator */}
              {localIndicatorVisible && (
                <div 
                  className="absolute border-t-2 border-red-500 pointer-events-none"
                  style={{ 
                    top: `${localIndicatorTopPosition - 5}px`, // Fine-tune for pixel-perfect alignment
                    left: 0,
                    right: 0,
                    zIndex: 150 // Above static tasks, below dragged item
                  }}
                />
              )}


              {/* Task Rendering Logic */}
              {isLoading ? (
                <div className="text-center py-2">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-2 text-gray-500">No tasks for this date</div>
              ) : (
                tasks.map((task, index) => {
                  const duration = calculateDuration(task.start, task.end);
                  const height = calculateHeight(duration);
                  const position = calculateTaskPosition(task.start); // This is relative to the droppable area's top
                  
                  return (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(providedDraggable, snapshotDraggable) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          className={`flex items-start py-0.5 px-1 rounded-lg shadow-sm bg-white transition border-l-4 overflow-hidden ${
                            task.checked ? "border-green-400 opacity-60" : "border-blue-400"
                          } relative`}
                          style={{
                            ...providedDraggable.draggableProps.style,
                            height: `${height - (TASK_BUFFER * 2)}px`,
                            position: 'absolute',
                            top: `${position}px`, // Position relative to the Droppable container
                            left: 0,
                            right: 0,
                            zIndex: snapshotDraggable.isDragging ? 200 : index + 10, // Cascade: Use index for more predictable static z-index // Ensure dragged item is on top
                            boxShadow: snapshotDraggable.isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
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
                      )}
                    </Draggable>
                  );
                })
              )}
              {provided.placeholder} {/* DND Placeholder */}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  </div>
);

}

export default Calendar;

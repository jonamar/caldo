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
  
  // State for task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    start: '09:00',
    end: '10:00'
  });

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

    await fetchTasks();
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
  
  // Handle creating a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.title || !newTask.start || !newTask.end) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      // Create the task
      await createTask(dateString, newTask);
      
      // Reload tasks
      const loadedTasks = await loadTasksForDate(dateString);
      setTasks(loadedTasks);
      
      // Reset form
      setNewTask({
        title: '',
        start: '09:00',
        end: '10:00'
      });
      setShowTaskForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  
  // Handle updating a task
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    if (!editingTask || !editingTask.title || !editingTask.start || !editingTask.end) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      // Update the task
      await updateTask(dateString, editingTask.id, editingTask);
      
      // Reload tasks
      const loadedTasks = await loadTasksForDate(dateString);
      setTasks(loadedTasks);
      
      // Reset form
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };
  
  // Handle deleting a task
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      console.log('Attempting to delete task with ID:', id);
      
      // Get current tasks
      const currentTasks = [...tasks];
      
      // Filter out the task to delete directly
      const updatedTasks = currentTasks.filter(task => task.id.toString() !== id.toString());
      
      // Check if any task was removed
      if (updatedTasks.length === currentTasks.length) {
        console.error('No task found with ID:', id);
        return;
      }
      
      // Update state first for immediate UI feedback
      setTasks(updatedTasks);
      
      // Close edit form if we were editing this task
      if (editingTask && editingTask.id.toString() === id.toString()) {
        setEditingTask(null);
      }
      
      // Then persist to localStorage
      await saveTasksForDate(dateString, updatedTasks);
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      // Reload tasks to ensure UI is in sync with storage
      const loadedTasks = await loadTasksForDate(dateString);
      setTasks(loadedTasks);
    }
  };
  
  // Start editing a task
  const startEditTask = (task) => {
    setEditingTask({...task});
    setShowTaskForm(false);
  };

  // Calculate task duration in minutes
  const calculateDuration = (start, end) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
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
    let position = minutesFromStart * 2;
    
    // Add header offset if needed
    if (includeHeaderOffset) {
      position += 30;
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
    const durationHeight = duration * 2;
    
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
          <div className="flex space-x-2">
            <button 
              onClick={refreshTasks}
              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
              title="Refresh tasks"
            >
              Refresh
            </button>
            <button 
              onClick={() => {
                setShowTaskForm(!showTaskForm);
                setEditingTask(null);
              }}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
            >
              {showTaskForm ? 'Cancel' : '+ Add Task'}
            </button>
            <button
              onClick={handleClearTasks}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
              title="Clear all tasks for today (local & server)"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      {/* New Task Form */}
      {showTaskForm && (
        <div className="bg-white p-3 rounded-lg shadow-md mb-3 z-40 relative">
          <form onSubmit={handleCreateTask}>
            <div className="mb-2">
              <label className="block text-xs text-gray-700">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full p-1 text-xs border border-gray-300 rounded"
                placeholder="Task title"
              />
            </div>
            <div className="flex space-x-2 mb-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-700">Start Time</label>
                <input
                  type="time"
                  value={newTask.start}
                  onChange={(e) => setNewTask({...newTask, start: e.target.value})}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-700">End Time</label>
                <input
                  type="time"
                  value={newTask.end}
                  onChange={(e) => setNewTask({...newTask, end: e.target.value})}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600 transition"
            >
              Add Task
            </button>
          </form>
        </div>
      )}
      
      {/* Edit Task Form */}
      {editingTask && (
        <div className="bg-white p-3 rounded-lg shadow-md mb-3 z-40 relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Edit Task</h3>
            <button 
              onClick={() => setEditingTask(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleUpdateTask}>
            <div className="mb-2">
              <label className="block text-xs text-gray-700">Title</label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                className="w-full p-1 text-xs border border-gray-300 rounded"
                placeholder="Task title"
              />
            </div>
            <div className="flex space-x-2 mb-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-700">Start Time</label>
                <input
                  type="time"
                  value={editingTask.start}
                  onChange={(e) => setEditingTask({...editingTask, start: e.target.value})}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-700">End Time</label>
                <input
                  type="time"
                  value={editingTask.end}
                  onChange={(e) => setEditingTask({...editingTask, end: e.target.value})}
                  className="w-full p-1 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                type="submit"
                className="flex-1 bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600 transition"
              >
                Update
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event propagation
                  console.log('Delete button clicked', editingTask);
                  if (editingTask && editingTask.id) {
                    // Call handleDeleteTask directly without using the imported deleteTask function
                    handleDeleteTask(editingTask.id);
                  } else {
                    console.error('No task ID available for deletion');
                  }
                }}
                className="flex-1 bg-red-500 text-white text-xs py-1 rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      )}
      
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
                <div className="flex-1 group">
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
                  {/* Edit button */}
                  <button 
                    onClick={() => startEditTask(task)}
                    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition text-[0.6rem] text-gray-400 hover:text-gray-600"
                  >
                    Edit
                  </button>
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

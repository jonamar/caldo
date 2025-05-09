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

  // Calculate height based on duration (15 min chunks)
  const calculateHeight = (duration) => {
    // Base height for all tasks
    const baseHeight = 40; 
    // Additional height per 15 minutes (in pixels)
    const heightPer15Min = 8;
    // Number of 15-minute chunks
    const chunks = Math.ceil(duration / 15);
    
    return baseHeight + (chunks - 1) * heightPer15Min;
  };

  return (
    <div className="w-full max-w-md space-y-2">
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
      
      {isLoading ? (
        <div className="text-center py-2">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-2 text-gray-500">No tasks for this date</div>
      ) : (
        tasks.map((task) => {
          const duration = calculateDuration(task.start, task.end);
          const height = calculateHeight(duration);
          
          return (
            <div
              key={task.id}
              className={`flex items-start p-2 rounded-lg shadow-sm bg-white transition border-l-4 ${
                task.checked ? "border-green-400 opacity-60" : "border-blue-400"
              }`}
              style={{ minHeight: `${height}px` }}
            >
              <input
                type="checkbox"
                checked={task.checked}
                onChange={() => toggleCheck(task.id)}
                className="w-4 h-4 accent-blue-500 mr-2 mt-1"
              />
              <div className="flex-1">
                <div className={`font-medium text-sm ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</div>
                <div className="text-xs text-gray-500">
                  {task.start} - {task.end} ({Math.floor(duration / 60)}h {duration % 60}m)
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Calendar;

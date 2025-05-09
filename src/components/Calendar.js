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

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="mb-4">
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Date:
        </label>
        <input
          type="date"
          id="date-select"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No tasks for this date</div>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center p-4 rounded-lg shadow-sm bg-white transition border-l-4 ${
              task.checked ? "border-green-400 opacity-60" : "border-blue-400"
            }`}
          >
            <input
              type="checkbox"
              checked={task.checked}
              onChange={() => toggleCheck(task.id)}
              className="w-5 h-5 accent-blue-500 mr-4"
            />
            <div className="flex-1">
              <div className={`font-semibold ${task.checked ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {task.start} - {task.end}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Calendar;

import React, { useState, useEffect } from "react";
import { DragDropContext } from 'react-beautiful-dnd';
import { 
  loadTasksForDate, 
  formatDateForFile, 
  saveTasksForDate,
  clearTasksForDate 
} from "../utils/taskLoader";
import { calculateTimeRange } from '../utils/timeCalculations';
import TimeGrid from './Calendar/TimeGrid';
import TaskList from './Calendar/TaskList';
import Button from './shared/Button';

function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateString, setDateString] = useState(formatDateForFile());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState({ startHour: 8, endHour: 18, startMinuteRemainder: 0 });

  // Update current time every minute
  useEffect(() => {
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Update time range when tasks change
  useEffect(() => {
    const newTimeRange = calculateTimeRange(tasks);
    setTimeRange(newTimeRange);
  }, [tasks]);

  // Load tasks for today's date
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const formattedDate = formatDateForFile();
        setDateString(formattedDate);
        
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

  // Refresh tasks
  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      const formattedDate = formatDateForFile();
      setDateString(formattedDate);
      
      const loadedTasks = await loadTasksForDate(formattedDate);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear all tasks
  const handleClearTasks = async () => {
    window.localStorage.removeItem(`tasks_${dateString}`);
    window.localStorage.removeItem('caldo_initialized');
    
    try {
      await clearTasksForDate(dateString);
    } catch (err) {
      console.log('Error clearing tasks from server:', err);
    }
    
    setTasks([]);
    alert('All tasks cleared successfully!');
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const reorderedTasksArray = Array.from(tasks);
    const [draggedItem] = reorderedTasksArray.splice(source.index, 1);
    reorderedTasksArray.splice(destination.index, 0, draggedItem);

    // Determine the anchor start time
    let anchorStartTimeMinutes = timeToMinutes(tasks[0]?.start || '08:00');
    if ((source.index === 0 && reorderedTasksArray.length > 0 && reorderedTasksArray[0].id === draggedItem.id) || 
        (tasks.length === 0 && reorderedTasksArray.length > 0)) {
        anchorStartTimeMinutes = timeToMinutes(draggedItem.start || '08:00');
    }

    const finalUpdatedTasks = [];
    for (let i = 0; i < reorderedTasksArray.length; i++) {
      const task = reorderedTasksArray[i];
      const originalDurationMinutes = timeToMinutes(task.end) - timeToMinutes(task.start);
      let newStartTimeMinutes;

      if (i === 0) {
        newStartTimeMinutes = anchorStartTimeMinutes;
      } else {
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
    await saveTasksForDate(dateString, updatedTasks);
  };

  // Helper functions for time conversion
  const timeToMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) totalMinutes = 0;
    totalMinutes = totalMinutes % (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Calculate time until 5pm
  const getTimeUntil5pm = () => {
    const now = new Date();
    const today5pm = new Date();
    today5pm.setHours(17, 0, 0, 0); // 5:00 PM
    
    const diffMs = today5pm - now;
    
    if (diffMs <= 0) {
      return "Past 5pm";
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m until 5pm`;
    }
    return `${hours}h ${minutes}m until 5pm`;
  };
  
  return (
    <div className="w-full max-w-md space-y-0 relative">
      {/* Header Section */}
      <div className="mb-1 relative z-30">
        <div className="flex items-center relative">
          <h2 className="text-[0.6rem] text-gray-400 w-full text-center">
            {getTimeUntil5pm()}
          </h2>
          <button 
            onClick={refreshTasks}
            className="w-6 h-6 flex items-center justify-center bg-gray-500 hover:bg-gray-600 rounded-full transition-colors absolute right-0"
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

      {/* Main Calendar Area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ position: 'relative' }}>
          <TimeGrid timeRange={timeRange} />
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            timeRange={timeRange}
            currentTime={currentTime}
            onToggleCheck={toggleCheck}
            onDragEnd={onDragEnd}
          />
        </div>
      </DragDropContext>

      {/* Clear Tasks Button */}
      <div className="mt-4 text-center">
        <Button
          onClick={handleClearTasks}
          variant="danger"
          size="sm"
        >
          Clear All Tasks
        </Button>
      </div>
    </div>
  );
};

export default Calendar;

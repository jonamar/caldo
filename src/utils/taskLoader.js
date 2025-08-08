/**
 * Loads task data from localStorage for a specific date
 * @param {string} date - Date in yy-mm-dd format
 * @returns {Promise<Array>} - Array of tasks for the specified date
 */
import axios from 'axios';

// Determine server URL for both desktop and mobile access on LAN.
// Prefer a build-time override via REACT_APP_CALDO_SERVER_URL (Create React App embeds these).
// Otherwise, use the current host's hostname so phones on the same network can reach the server.
const SERVER_URL =
  process.env.REACT_APP_CALDO_SERVER_URL ||
  (typeof window !== 'undefined' && window.location && window.location.hostname
    ? `http://${window.location.hostname}:8422`
    : 'http://localhost:8422');

export const loadTasksForDate = async (date) => {
  try {
    // Try to get tasks from the server
    const res = await axios.get(`${SERVER_URL}/tasks/${date}`);
    return res.data;
  } catch (error) {
    console.error('Error loading tasks from server:', error);
    // Fallback: return sample data if server is unreachable
    if (!window.localStorage.getItem('caldo_initialized')) {
      initializeSampleData();
      const initializedData = window.localStorage.getItem(`tasks_${date}`);
      if (initializedData) {
        return JSON.parse(initializedData);
      }
    }
    return [];
  }
};

/**
 * Formats a Date object to yy-mm-dd format
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateForFile = (date = new Date()) => {
  const year = date.getFullYear().toString().slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Gets today's tasks
 * @returns {Promise<Array>} - Array of today's tasks
 */
export const getTodaysTasks = () => {
  const today = formatDateForFile();
  return loadTasksForDate(today);
};

/**
 * Initialize sample data for new users
 */
const initializeSampleData = () => {
  // Mark as initialized to avoid re-initializing
  localStorage.setItem('caldo_initialized', 'true');
  
  // Today's date
  const today = formatDateForFile();
  
  // Sample tasks for today
  const todayKey = `tasks_${today}`;
  if (!localStorage.getItem(todayKey)) {
    const sampleTasks = [
      {
        id: today + '-1',
        title: 'Morning Meeting',
        start: '09:00',
        end: '10:00',
        checked: false
      },
      {
        id: today + '-2',
        title: 'Lunch Break',
        start: '12:30',
        end: '13:00',
        checked: false
      },
      {
        id: today + '-3',
        title: 'Project Planning',
        start: '14:00',
        end: '15:30',
        checked: false
      },
      {
        id: today + '-4',
        title: 'Email Catch-up',
        start: '16:00',
        end: '16:30',
        checked: false
      }
    ];
    localStorage.setItem(todayKey, JSON.stringify(sampleTasks));
  }

  // Sample tasks for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = formatDateForFile(tomorrow);
  const tomorrowKey = `tasks_${tomorrowFormatted}`;
  if (!localStorage.getItem(tomorrowKey)) {
    const tomorrowTasks = [
      {
        id: tomorrowFormatted + '-1',
        title: 'Weekly Review',
        start: '10:00',
        end: '11:00',
        checked: false
      },
      {
        id: tomorrowFormatted + '-2',
        title: 'Team Lunch',
        start: '12:00',
        end: '13:30',
        checked: false
      },
      {
        id: tomorrowFormatted + '-3',
        title: 'Client Call',
        start: '15:00',
        end: '16:00',
        checked: false
      }
    ];
    localStorage.setItem(tomorrowKey, JSON.stringify(tomorrowTasks));
  }
};

/**
 * Creates a new task for a specific date
 * @param {string} date - Date in yy-mm-dd format
 * @param {Object} task - Task object with title, start, end properties
 * @returns {Promise<boolean>} - Success status
 */
export const createTask = async (date, task) => {
  try {
    // Load existing tasks from server
    const tasks = await loadTasksForDate(date);
    // Generate a new ID
    const newId = tasks.length > 0 
      ? Math.max(...tasks.map(t => parseInt(t.id))) + 1 
      : 1;
    // Create new task with ID and checked status
    const newTask = {
      ...task,
      id: newId.toString(),
      checked: false
    };
    // Add to tasks array
    tasks.push(newTask);
    // Save updated tasks to server
    return saveTasksForDate(date, tasks);
  } catch (error) {
    console.error('Error creating task:', error);
    return false;
  }
};

/**
 * Updates an existing task
 * @param {string} date - Date in yy-mm-dd format
 * @param {string} taskId - ID of the task to update
 * @param {Object} updatedTask - Updated task properties
 * @returns {Promise<boolean>} - Success status
 */
export const updateTask = async (date, taskId, updatedTask) => {
  try {
    // Load existing tasks from server
    const tasks = await loadTasksForDate(date);
    // Find the task index
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      console.error(`Task with ID ${taskId} not found`);
      return false;
    }
    // Update the task, preserving the ID
    tasks[taskIndex] = {
      ...updatedTask,
      id: taskId
    };
    // Save updated tasks to server
    return saveTasksForDate(date, tasks);
  } catch (error) {
    console.error('Error updating task:', error);
    return false;
  }
};

/**
 * Deletes a task
 * @param {string} date - Date in yy-mm-dd format
 * @param {string} taskId - ID of the task to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteTask = async (date, taskId) => {
  try {
    // Load existing tasks from server
    const tasks = await loadTasksForDate(date);
    // Filter out the task to delete
    const updatedTasks = tasks.filter(t => t.id.toString() !== taskId.toString());
    // Check if any task was actually removed
    if (updatedTasks.length === tasks.length) {
      console.warn(`No task with ID ${taskId} found to delete`);
    }
    // Save updated tasks to server
    return saveTasksForDate(date, updatedTasks);
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};

/**
 * Clears all tasks for a specific date on the server
 * @param {string} date - Date in yy-mm-dd format
 * @returns {Promise<boolean>} - Success status
 */
export const clearTasksForDate = async (date) => {
  try {
    await axios.delete(`${SERVER_URL}/tasks/${date}`);
    return true;
  } catch (error) {
    console.error(`Error clearing tasks for ${date} on server:`, error);
    return false;
  }
};

/**
 * Saves tasks for a specific date to localStorage
 * @param {string} date - Date in yy-mm-dd format
 * @param {Array} tasks - Array of tasks to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveTasksForDate = async (date, tasks) => {
  try {
    await axios.post(`${SERVER_URL}/tasks/${date}`, tasks);
    return true;
  } catch (error) {
    console.error(`Error saving tasks for ${date} to server:`, error);
    return false;
  }
};

import yaml from 'js-yaml';

/**
 * Loads task data from a YAML file for a specific date
 * @param {string} date - Date in yy-mm-dd format
 * @returns {Promise<Array>} - Array of tasks for the specified date
 */
export const loadTasksForDate = async (date) => {
  try {
    const response = await fetch(`/data/tasks/${date}.yaml`);
    
    if (!response.ok) {
      console.error(`Failed to load tasks for date: ${date}`);
      return [];
    }
    
    const yamlText = await response.text();
    const tasks = yaml.load(yamlText);
    
    return tasks || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
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
 * Saves tasks for a specific date
 * This is a mock function as client-side JS cannot write files
 * In a real app, this would call an API endpoint
 * @param {string} date - Date in yy-mm-dd format
 * @param {Array} tasks - Array of tasks to save
 */
export const saveTasksForDate = async (date, tasks) => {
  console.log(`Would save tasks for ${date}:`, tasks);
  // In a real app, you would make an API call here
  // Example: await fetch('/api/tasks/' + date, { method: 'POST', body: JSON.stringify(tasks) });
  
  // For now, we'll just store in localStorage for demo purposes
  localStorage.setItem(`tasks_${date}`, JSON.stringify(tasks));
  return true;
};

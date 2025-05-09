# Caldo App: YAML to localStorage Migration Specification

## Overview
This specification outlines the plan to migrate the Caldo calendar app from using YAML files as the data source to using browser localStorage exclusively. This change will make the app fully client-side without external data dependencies.

## Goals
- Remove dependency on external YAML files
- Use localStorage as the primary data storage mechanism
- Maintain all existing functionality
- Ensure task completion status persists between sessions
- Add ability to create and edit tasks directly in the app

## Technical Approach
1. Modify the data layer to use localStorage exclusively
2. Pre-populate localStorage with sample data on first run
3. Update components to work with the new data source
4. Add task creation/editing functionality

## Migration Checklist

### Data Layer Changes
- [x] 1. Update `taskLoader.js` to remove YAML dependencies
- [x] 2. Modify `loadTasksForDate` to read exclusively from localStorage
- [x] 3. Create a function to pre-populate localStorage with sample data
- [x] 4. Update `saveTasksForDate` to ensure proper data format

### Component Updates
- [x] 5. Update `Calendar.js` to handle localStorage-only data
- [x] 6. Ensure task completion toggle works with the new data layer
- [x] 7. Add error handling for missing data

### New Functionality
- [x] 8. Add a simple form for creating new tasks
- [x] 9. Add ability to edit existing tasks
- [x] 10. Add ability to delete tasks

### Testing
- [x] 11. Test data persistence between page refreshes
- [x] 12. Test task creation and editing
- [x] 13. Test task completion toggling

## Implementation Complete ✅

All tasks have been completed. The Caldo app now:
- Uses localStorage exclusively for data storage
- Pre-populates sample data for new users
- Allows creating, editing, and deleting tasks
- Maintains task completion status between sessions
- No longer depends on external YAML files

## Data Structure
Tasks in localStorage will follow this structure:
```
{
  "tasks_25-05-09": [
    {
      "id": "1",
      "title": "Lunch Break",
      "start": "12:30",
      "end": "13:00",
      "checked": false
    },
    ...
  ]
}
```

## Implementation Notes
- Use a prefix like `tasks_` for all task-related localStorage keys
- Handle first-time users by checking if data exists
- Maintain backward compatibility where possible

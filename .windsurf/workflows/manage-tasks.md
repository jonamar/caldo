---
description: Remove or edit tasks in Caldo
---

## Usage
Type `/manage-tasks` followed by your natural language request describing what tasks you want to modify or remove.

## Examples
- `/manage-tasks Clear all tasks for today`
- `/manage-tasks Change task 2 to start at 2:30pm instead of 2pm`
- `/manage-tasks Remove the lunch break task`
- `/manage-tasks Edit task 3 title to 'Client presentation' and make it 45 minutes long`

## Steps
1. Navigate to Caldo root directory
2. Verify servers are running
3. Parse the natural language request to identify the operation:
   - Clear all tasks
   - Edit a specific task (by ID or description)
   - Remove a specific task (by ID or description)
4. If needed, first retrieve current tasks to identify target task ID
5. Execute the appropriate update-tasks.js command:
   - For clear: Run the 'clear' command
   - For edit: Use 'set' command with modified task data
   - For remove: Use 'set' command with the specified task removed
6. Confirm tasks were modified successfully
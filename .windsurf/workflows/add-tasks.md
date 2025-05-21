---
description: Add tasks to Caldo using the CLI
---

## Usage
Type `/add-tasks` followed by your natural language request describing what tasks you want to schedule and when.

## Examples
- `/add-tasks I want to do two tasks between 9am and 5pm today: finish report (2 hours) and team meeting (1 hour)`
- `/add-tasks Schedule lunch break at noon for 45 minutes and then a workout from 5pm to 6pm`
- `/add-tasks Add three equal tasks from 1pm to 4pm: research, writing, and editing`

## Steps
1. Navigate to Caldo root directory
2. Verify servers are running
3. Parse the natural language request to extract:
   - Time window (start and end times)
   - Task names and durations
4. Format the tasks for the CLI tool
5. Execute the update-tasks.js script with the appropriate parameters
6. Confirm tasks were added successfully

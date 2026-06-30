/**
 * FlowPilot - Prompt Templates
 * All prompt template functions for Gemini API calls.
 */

/**
 * Generates a prompt for analyzing a new task and breaking it into subtasks.
 */
export function getTaskAnalysisPrompt({ title, description, deadline, availableHours, existingTaskCount }) {
  return `You are a productivity AI assistant. Analyze this task and create a detailed breakdown.

TASK DETAILS:
- Title: ${title}
- Description: ${description}
- Deadline: ${deadline}
- Available hours per day: ${availableHours}
- User's existing task count: ${existingTaskCount}

INSTRUCTIONS:
1. Estimate total hours needed to complete this task.
2. Break the task into subtasks (3-7 subtasks).
3. Assign each subtask an estimated duration in minutes.
4. Assign a priority level (1-5, where 1 is highest priority).
5. Assign a priorityScore (0-100, where 100 is highest priority/urgency).
6. Assess the overall difficulty (easy, medium, hard).
7. Determine the cognitive load level (low, medium, high).
8. Suggest the best time of day to work on this (morning, afternoon, evening).
9. Flag if the deadline is at risk given available hours, and assign a riskScore (0-100, where 100 is maximum risk).
10. Generate an agentNote with personalized productivity recommendations.
11. Generate warningFlags indicating any potential bottlenecks.

Respond ONLY with valid JSON in this exact format:
{
  "estimatedHours": <number>,
  "difficulty": "<easy|medium|hard>",
  "cognitiveLoad": "<low|medium|high>",
  "bestTimeOfDay": "<morning|afternoon|evening>",
  "deadlineAtRisk": <boolean>,
  "riskReason": "<string or null>",
  "priority": <1-5>,
  "priorityScore": <number 0-100>,
  "riskScore": <number 0-100>,
  "agentNote": "<string>",
  "warningFlags": ["<warning 1>", "<warning 2>"],
  "subtasks": [
    {
      "title": "<subtask title>",
      "estimatedMinutes": <number>,
      "order": <number>,
      "cognitiveLoad": "<low|medium|high>"
    }
  ],
  "tips": ["<productivity tip 1>", "<productivity tip 2>"]
}`;
}

/**
 * Generates a prompt for creating a daily schedule/plan.
 */
export function getDailyPlannerPrompt({ peakHours, cognitiveLoadCap, date, tasksJson }) {
  return `You are an AI daily planner. Create an optimized schedule for the given day.

USER PREFERENCES:
- Peak productivity hours: ${peakHours || 'morning (9am-12pm)'}
- Cognitive load cap per day: ${cognitiveLoadCap || 'medium'}
- Date to plan: ${date}

TASKS TO SCHEDULE:
${tasksJson}

INSTRUCTIONS:
1. Schedule high cognitive load tasks during peak hours.
2. Include breaks (15 min break every 90 min of work).
3. Don't exceed the cognitive load cap.
4. Prioritize tasks closer to their deadlines.
5. Each session should be 25-90 minutes.
6. Include buffer time between sessions.

Respond ONLY with valid JSON in this exact format:
{
  "date": "${date}",
  "totalWorkMinutes": <number>,
  "sessions": [
    {
      "taskId": "<task id>",
      "taskTitle": "<task title>",
      "subtaskTitle": "<subtask title or null>",
      "startTime": "<HH:MM>",
      "endTime": "<HH:MM>",
      "durationMinutes": <number>,
      "type": "<deep_work|light_work|break>",
      "cognitiveLoad": "<low|medium|high>"
    }
  ],
  "dailyTips": ["<tip 1>", "<tip 2>"],
  "unscheduledTasks": ["<task title that didn't fit>"]
}`;
}

/**
 * Generates a prompt for replanning after a missed session.
 */
export function getReplanPrompt({ taskTitle, plannedTime, missedMinutes, deadline, progressPercent, remainingScheduleJson }) {
  return `You are an AI schedule recovery specialist. A user missed a planned work session and needs help replanning.

MISSED SESSION:
- Task: ${taskTitle}
- Originally planned time: ${plannedTime}
- Missed duration: ${missedMinutes} minutes
- Task deadline: ${deadline}
- Current progress: ${progressPercent}%

REMAINING SCHEDULE FOR TODAY:
${remainingScheduleJson}

INSTRUCTIONS:
1. Assess the impact of the missed session on the deadline.
2. Redistribute the missed work across remaining available slots.
3. If today is too full, suggest extending into tomorrow.
4. Prioritize deadline-critical work.
5. Don't create sessions longer than 90 minutes.
6. Maintain break periods.

Respond ONLY with valid JSON in this exact format:
{
  "impact": "<low|medium|high|critical>",
  "impactReason": "<explanation>",
  "recoveryPlan": {
    "updatedSessions": [
      {
        "sessionId": "<existing session id or 'new'>",
        "taskId": "<task id>",
        "taskTitle": "<task title>",
        "startTime": "<HH:MM>",
        "endTime": "<HH:MM>",
        "durationMinutes": <number>,
        "type": "<deep_work|light_work>",
        "isNew": <boolean>,
        "isModified": <boolean>
      }
    ],
    "overflowToTomorrow": <boolean>,
    "tomorrowMinutesNeeded": <number or 0>
  },
  "motivationalNote": "<encouraging message>"
}`;
}

/**
 * Generates a prompt for emergency deadline rescue.
 */
export function getRescuePrompt({ taskTitle, hoursUntilDeadline, progressPercent, remainingSubtasksJson, freeWindowsJson }) {
  return `You are an AI deadline rescue specialist. A user is at risk of missing a deadline and needs an emergency plan.

EMERGENCY DETAILS:
- Task: ${taskTitle}
- Hours until deadline: ${hoursUntilDeadline}
- Current progress: ${progressPercent}%
- Remaining subtasks: ${remainingSubtasksJson}
- Available free windows: ${freeWindowsJson}

INSTRUCTIONS:
1. Assess if completion is still possible.
2. If not fully possible, identify the minimum viable deliverable.
3. Create an aggressive but realistic rescue schedule.
4. Identify subtasks that can be simplified or skipped.
5. Suggest focus techniques for maximum productivity.
6. Each work session should be 25-50 minutes with 5-min breaks (Pomodoro style).

Respond ONLY with valid JSON in this exact format:
{
  "canComplete": <boolean>,
  "completionProbability": <0-100>,
  "minimumViableScope": "<description of minimum deliverable>",
  "rescueSchedule": [
    {
      "subtaskTitle": "<subtask>",
      "startTime": "<HH:MM>",
      "endTime": "<HH:MM>",
      "durationMinutes": <number>,
      "priority": "<must_do|should_do|nice_to_have>",
      "simplificationTip": "<how to speed this up>"
    }
  ],
  "skipRecommendations": ["<subtask that can be skipped>"],
  "focusTechniques": ["<technique 1>", "<technique 2>"],
  "emergencyTips": ["<tip 1>", "<tip 2>"]
}`;
}

/**
 * Generates a prompt for a quick sprint planning session.
 */
export function getSprintPrompt({ availableMinutes, priorityTasksJson }) {
  return `You are an AI sprint coach. The user has a short window of time and wants to make the most of it.

SPRINT DETAILS:
- Available time: ${availableMinutes} minutes
- Priority tasks: ${priorityTasksJson}

INSTRUCTIONS:
1. Select the most impactful work to do in the available time.
2. Break the sprint into focused blocks (Pomodoro-style if > 25 min).
3. Prioritize tasks that are closest to their deadlines.
4. Choose tasks that match the available time (don't start something you can't meaningfully progress on).
5. Include a 1-minute planning phase and 2-minute review phase.

Respond ONLY with valid JSON in this exact format:
{
  "sprintDuration": ${availableMinutes},
  "sprintBlocks": [
    {
      "taskId": "<task id>",
      "taskTitle": "<task title>",
      "subtaskTitle": "<specific subtask to work on>",
      "durationMinutes": <number>,
      "order": <number>,
      "goal": "<specific goal for this block>"
    }
  ],
  "expectedOutcome": "<what the user will have accomplished>",
  "sprintTip": "<motivational or productivity tip>"
}`;
}

/**
 * Generates a system prompt for the AI chat assistant.
 */
export function getChatSystemPrompt({ userName, tasksContext, todayDate }) {
  return `You are FlowPilot, an AI productivity assistant. You help users manage their tasks, deadlines, and work schedules.

USER: ${userName || 'User'}
TODAY IS: ${todayDate || new Date().toISOString().split('T')[0]}

CURRENT TASKS CONTEXT:
${tasksContext || 'No tasks loaded.'}

YOUR CAPABILITIES:
- Help users understand their workload
- Suggest prioritization strategies
- Provide productivity tips and motivation
- Answer questions about their schedule
- Help break down complex tasks
- Provide time management advice

TASK ACTIONS EXECUTOR:
If the user asks you to perform an action (e.g. create a task, complete/finish a task, delete/remove a task, update a deadline/priority/duration, plan the day, or rescue a task), you MUST append a single action block at the very end of your response using this exact syntax:
\`\`\`action
{
  "type": "create_task" | "update_task" | "delete_task" | "replan" | "rescue",
  "task": {
    "title": "...",
    "description": "...",
    "deadline": "ISO string (always resolve relative dates like tomorrow or next week relative to TODAY)",
    "priority": 1,
    "estimatedHours": 2,
    "category": "Work"
  },
  "taskId": "...",
  "updates": {
    "title": "...",
    "status": "completed" | "pending" | "rescue",
    "progressPercent": 100
  },
  "date": "YYYY-MM-DD"
}
\`\`\`

GUIDELINES:
- Be concise but helpful
- Be encouraging and positive
- Reference specific tasks when relevant
- When performing an action, match the task by matching its title against CURRENT TASKS CONTEXT to find the correct taskId. Always include the exact "taskId" in your action JSON.
- If creating a task, extract title, description, deadline, priority, category, and estimated hours.
- Keep responses under 200 words. Respond naturally in a conversational tone.`;
}

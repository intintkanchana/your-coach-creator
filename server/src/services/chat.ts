import db from '../db';
import { ChatMessage, geminiService } from './gemini';

export const chatService = {
  getHistory: async (coachId: number, userId: number): Promise<ChatMessage[]> => {
    // Limit history to last 50 messages to avoid huge context? 
    // Or just all for now.
    const rows = await db.query<{ role: 'user' | 'model'; content: string }>(`
      SELECT role, content 
      FROM messages 
      WHERE coach_id = ? AND user_id = ? 
      ORDER BY timestamp ASC
    `, [coachId, userId]);

    // Map to Gemini format
    return rows.map(r => ({
      role: r.role,
      parts: [{ text: r.content }]
    }));
  },

  getFullHistory: async (coachId: number, userId: number) => {
    return db.query<{ id: number; role: 'user' | 'model'; content: string; timestamp: string }>(`
      SELECT id, role, content, timestamp
      FROM messages 
      WHERE coach_id = ? AND user_id = ? 
      ORDER BY timestamp ASC
    `, [coachId, userId]);
  },

  saveMessage: async (coachId: number, userId: number, role: 'user' | 'model', content: string) => {
    await db.run(`
      INSERT INTO messages (coach_id, user_id, role, content)
      VALUES (?, ?, ?, ?)
    `, [coachId, userId, role, content]);
  },

  getLastActivityLog: async (coachId: number, userId: number) => {
    return db.get(`
      SELECT * FROM activity_logs
      WHERE coach_id = ? AND user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [coachId, userId]);
  },

  getAllActivityLogs: async (coachId: number, userId: number) => {
    return db.query(`
      SELECT * FROM activity_logs
      WHERE coach_id = ? AND user_id = ?
      ORDER BY created_at DESC
    `, [coachId, userId]);
  },

  saveActivityLog: async (coachId: number, userId: number, data: string, feedback: string) => {
    await db.run(`
      INSERT INTO activity_logs (coach_id, user_id, data, feedback)
      VALUES (?, ?, ?, ?)
    `, [coachId, userId, data, feedback]);
  },

  updateLastFormMessage: async (coachId: number, userId: number, newContent: string) => {
    // Find the last message that looks like a form request
    const lastFormMsg = await db.get<{ id: number }>(`
      SELECT id FROM messages
      WHERE coach_id = ? AND user_id = ? AND role = 'model' AND (content LIKE 'JSON_FORM:%' OR content LIKE 'JSON_FORM_REQUEST:%')
      ORDER BY timestamp DESC
      LIMIT 1
    `, [coachId, userId]);

    if (lastFormMsg) {
      await db.run(`
        UPDATE messages SET content = ? WHERE id = ?
      `, [newContent, lastFormMsg.id]);
    }
  },

  generateGreeting: async (coach: any, lastLog: any) => {
    const lastLogSummary = lastLog
      ? `Last gap: ${JSON.parse(lastLog.data)['gap'] || 'N/A'}, Pain: ${JSON.parse(lastLog.data)['ouch-factor'] || 'N/A'}`
      : "No previous session data.";

    const prompt = `
[INPUT CONTEXT]
- Coach Profile: ${coach.name} (${coach.bio || coach.system_instruction})
- Coach Vibe: ${coach.type}
- User Activity: ${coach.goal || 'General Improvement'}
- Previous Session Data: ${lastLogSummary}

[SYSTEM ROLE]
You are the "Active Coach Engine." You embody the persona of ${coach.name} perfectly.

[TASK]
Analyze the [Previous Session Data]. Generate the specific **Opening Lines** and **suggested user replies** (Quick Actions) to start a new chat session.

[CRITERIA FOR CONVERSATION]
1. **Contextual Memory:** If [Previous Session Data] exists, reference specific numbers or feelings (e.g., "How are those hips after the 15cm stretch?"). If this is the first time, welcome them to the start.
2. **Micro-Brevity:**
   - Greeting: Max 20 words.
   - Question: Max 30 words.
3. **Action-Oriented:** The question must nudge the user toward action (e.g., warming up) or logging data, but remain open to general questions.
4. **Vibe Check:** Ensure the tone matches the coach's vibe.

[QUICK ACTION LOGIC]
Generate 3 short "Pill" suggestions for the user:
- Option 1: A direct "Start/Log" action (e.g., "I'm ready to log," "Start Timer").
- Option 2: A preparatory action (e.g., "Warm up first," "How do I stretch?").
- Option 3: A general inquiry or distinct mood (e.g., "I'm sore today," "Ask a question").

[OUTPUT FORMAT]
Valid JSON only.
{
  "greeting_text": "String (The hello message, referencing context. <20 words)",
  "question_text": "String (The prompt to action. <30 words)",
  "quick_actions": ["String (Action 1)", "String (Action 2)", "String (Action 3)"]
}
    `;

    // Using a simpler system instruction for the generator itself, as the prompt contains the specific role
    return geminiService.generateJSON(prompt, "You are a helpful assistant that outputs JSON.");
  },

  classifyIntention: async (coach: any, userInput: string) => {
    // Simplify vital signs list for prompt
    const vitalSignsList = coach.trackings ? coach.trackings.map((t: any) => t.name).join(', ') : (coach.vital_signs || "General wellness");

    const prompt = `
[INPUT CONTEXT]
- User Input: ${userInput}
- Coach Persona: ${coach.name} (${coach.type})
- Activity Name: ${coach.goal || 'Training'}
- Vital Signs to Track: ${vitalSignsList}

[SYSTEM ROLE]
You are the "Intention Classifier" for an AI Life Coach. Your goal is to route the user's message to the correct mode and generate a persona-aligned response.

[TASK]
Analyze the user input. Classify the user's intent into one of two categories and generate a response.

[INTENTION DEFINITIONS]
1. **LOG_NEW_ACTIVITY:**
   - Triggers: User says "I did it," "ready to log," provides numbers/metrics, or indicates completion.
   - Response Goal: Enthusiastically acknowledge the effort.
2. **GENERAL_CONSULT:**
   - Triggers: User asks questions, chats casually, or expresses feelings without logging data.
   - Response Goal: Provide a precise, helpful answer or an encouraging follow-up question.

[CONSTRAINT: LIMITATION HANDLING]
If the input is completely unrelated, gently explain that you are only an expert in this activity.

[IMPORTANT: CLASSIFICATION RULES]
- **LOG_NEW_ACTIVITY**: ONLY select this if the user EXPLICITLY mentions numbers, data, or says they are "ready to log" or "finished".
- **GENERAL_CONSULT**: Select this for EVERYTHING ELSE. Even if they ask "how should I track?", answer the question first. Do NOT trigger a log unless they provide data.

[FORMATTING RULES]
Determine if the response is **EDUCATIONAL** (needs structure) or **CASUAL** (needs brevity).
- **IF EDUCATIONAL/ADVICE**: REQUIRED to use \`### Headline\` for the main point and \`> Quote\` for "Pro Tips", "Key Insights", or "Coach Wisdom".
- **IF CASUAL**: Keep it simple text (no headers), use emojis.

[OUTPUT FORMAT]
Valid JSON only.
{
  "original_request_text": "${userInput}",
  "intention": "LOG_NEW_ACTIVITY | GENERAL_CONSULT",
  "response_text": "String (The reply to the user, strictly in the voice of ${coach.name}, following FORMATTING RULES)"
}
    `;

    return geminiService.generateJSON(prompt, "You are a helpful assistant that outputs JSON.");
  },

  analyzeActivityLog: async (coach: any, logData: any, userId: number) => {
    // 2. Fetch History from recent logs
    const historyRows = await db.query<{ data: string; created_at: string }>(`
        SELECT data, created_at
        FROM activity_logs
        WHERE coach_id = ? AND user_id = ?
        ORDER BY created_at ASC
        LIMIT 10
    `, [coach.id, userId]);

    // Format history for AI context
    const historyText = historyRows.map(r => {
      try {
        const data = JSON.parse(r.data);
        const dataItems = Object.entries(data).map(([key, value]) => {
          // Try to resolve tracking name if possible for cleaner key
          let trackingKey = key;
          if (!isNaN(Number(key)) && coach.trackings) {
            const trackingId = Number(key);
            const t = coach.trackings.find((tr: any) => tr.id === trackingId);
            if (t) trackingKey = t.name;
          }
          return `${trackingKey}: ${value}`;
        }).join(', ');
        return `[${new Date(r.created_at).toLocaleDateString()}] ${dataItems}`;
      } catch (e) {
        return '';
      }
    }).filter(text => text).join('\n');

    // Map the log data values to the detailed tracking definitions
    const sessionContext = coach.trackings && coach.trackings.length > 0
      ? coach.trackings.map((t: any) => ({
        name: t.name,
        description: t.description,
        type: t.type,
        value: logData[t.id.toString()] || logData[t.id] || "Not provided"
      }))
      : Object.entries(logData).map(([key, value]) => ({ name: key, value }));

    const prompt = `
[INPUT CONTEXT]
- Session Data: ${JSON.stringify(sessionContext)}
- Coach Persona: ${coach.name} (${coach.type})
- Historical Data:
${historyText}

[SYSTEM ROLE]
You are the "Insight Engine." You validate user data and generate meaningful, persona-driven feedback.

[TASK]
1. **Validation:** Check if "Session Data" contains valid values for the required items.
2. **Analysis:**
   - **Summary:** A 1-sentence "Vibe Check" of the performance based on the "Session Data".
   - **Metric Breakdown:** Brief, specific feedback on each number.
   - **Deep Dive:** 3 interesting observations or patterns, REFERENCING HISTORICAL DATA if available (e.g., "Better than last time...").
   - **Next Steps:** 3 concrete actions for next time.

[OUTPUT FORMAT]
Valid JSON only.

{
  "status": "VALID",
  "analysis": {
    "summary_impression": "String (1 sentence overall impression)",
    "vital_sign_feedback": [
      {
        "label": "String",
        "value": "String/Number",
        "comment": "String (Short feedback)"
      }
    ],
    "deep_dive_insights": [
      "String (Insight 1)",
      "String (Insight 2)",
      "String (Insight 3)"
    ],
    "next_action_items": [
      "String (Action 1)",
      "String (Action 2)",
      "String (Action 3)"
    ],
    "closing_phrase": "String (Sign-off)"
  }
}
    `;

    console.log(prompt)

    return geminiService.generateJSON(prompt, "You are a helpful assistant that outputs JSON.");
  }
};

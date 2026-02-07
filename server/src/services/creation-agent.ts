import { geminiService } from './gemini';

export type CreationStep = 
  | '1.1_SCOPE_ACTIVITY'
  | '1.2_CREATE_PERSONA'
  | '2.1_SUGGEST_VITAL_SIGNS'
  | '2.2_MANAGE_VITAL_SIGNS'
  | '3.0_SUMMARIZE_COACH';

interface AgentContext {
  step: CreationStep;
  data: any; // Accumulated data
}

// In-memory session store for demo purposes. 
// In production, use Redis or a DB table 'creation_sessions'
const sessions: Record<string, AgentContext> = {};

export const creationAgentService = {
  getOrCreateSession(userId: number): AgentContext {
    const key = String(userId);
    if (!sessions[key]) {
      sessions[key] = {
        step: '1.1_SCOPE_ACTIVITY',
        data: {}
      };
    }
    return sessions[key];
  },

  updateSession(userId: number, context: AgentContext) {
    sessions[String(userId)] = context;
  },
  
  clearSession(userId: number) {
      delete sessions[String(userId)];
  },

  async handleMessage(userId: number, userMessage: any) {
    const context = this.getOrCreateSession(userId);
    let prompt = '';
    let systemRole = '';
    
    // Logic to update context based on PREVIOUS step's output if needed
    // For simplicity, we assume the frontend sends the *selection* from the previous step 
    // effectively as the "userMessage" for the current step logic, 
    // OR we process the user's raw text input.

    switch (context.step) {
      case '1.1_SCOPE_ACTIVITY':
        // Expecting user input: "I want to [goal]"
        // If data.user_goal is already set, maybe we are moving to next step?
        // Actually, the flow is: 
        // 1. User sends text -> API calls Agent -> Agent generates Step 1.1 JSON options.
        // 2. User selects option -> API calls Agent (with selection) -> Agent generates Step 1.2 JSON.
        
        // So for 1.1, we take the raw text as user_goal.
        
        systemRole = `
[SYSTEM ROLE]
You are the "Scope Shrinker," a strategist who breaks broad, overwhelming goals into fun, measurable, bite-sized experiments (Tracer Bullets).
[TASK]
Analyze the {{user_goal}}. Generate 3 distinct "Refined Activities" that the user could start today.
[CRITERIA FOR OPTIONS]
1. **Distinct Angles:** Don't just give 3 versions of the same thing. Offer variety (e.g., one physical, one mental, one creative). This is strictly depending on the intended activity.
2. **Measurable (Vital Signs Ready):** Ensure each option has obvious potential for data tracking (e.g., numbers, photos, duration).
3. **Low Friction:** The activity should feel exciting and small, not like "work."
4. **Visual:** Include a relevant emoji for each option.
[OUTPUT FORMAT]
Provide valid JSON with a list of 3 options.
{
    "user_original_goal": "{{user_goal}}",
    "rationale": "String 1-2 sentences",
    "options": [
    {
        "activity_name": "String (Catchy Title)",
        "description": "String (One sentence pitch)",
        "potential_vital_sign": "String (Example of what they'd measure)",
        "emoji": "String (Single emoji char)"
    }
    ]
}`;
        prompt = `[INPUT CONTEXT]\n- user goal: ${userMessage}`;
        break;

      case '1.2_CREATE_PERSONA':
        // User selected an activity name from 1.1
        // valid input: { selected_activity_name: string } or just the string
        const activityName = typeof userMessage === 'string' ? userMessage : userMessage.selected_activity_name;
        context.data.selected_activity_name = activityName; // Store for later

        systemRole = `
[SYSTEM ROLE]
You are the "Architect of Encouragement." You create friendly, non-judgmental AI personas.
[TASK]
Create a specific Coach Persona for the activity: ${activityName}.
[OUTPUT REQUIREMENTS]
1. **Coach Name:** Creative, fun and easily-understandable.
2. **Coach Bio:** <75 words. Funny, warm, "Tracer Bullet" philosophy.
3. **Personality Options:** 4 distinct options for the user to tweak the coach's voice.
[OUTPUT FORMAT]
Valid JSON only.
{
    "coach_name": "String",
    "coach_bio": "String",
    "personality_options": [
        {
            "name": "String (Title of the vibe)",
            "description": "String (1-2 sentences explaining what this feels like)",
            "emoji": "String (Single emoji char)"
        }
    ]
}`;
        prompt = `[INPUT CONTEXT]\n- selected activity name: ${activityName}`;
        break;

      case '2.1_SUGGEST_VITAL_SIGNS':
        // User selected persona vibes (optional context) or just confirmed the persona
        // Input: { coach_name, coach_bio, selected_personality } (maybe)
        // We rely on stored context mostly.
        
        // We need description for the prompt, let's look it up or ask user? 
        // For now, we assume context.data has what we need or we approximate.
        // Actually, we should probably persist the 'options' from 1.1 to find the description.
        // Let's assume we proceed with just the name for simplicity if description missing.
        
        const activity = context.data.selected_activity_name;
        // Mock description or retrieve if we saved it. 
        // To be safe, let's assume the user selection payload might include description if the frontend passed it back.
        const description = userMessage.selected_activity_description || "A custom activity";

        systemRole = `
[SYSTEM ROLE]
You are the "Lab Technician" of the Universal Life Coach. Your job is to design the data collection form for a specific habit experiment.
[TASK]
Analyze the ${activity} and ${description}. Define 3 distinct "Vital Signs" (metrics) to track its progress.
You must balance **Quantitative** (hard data) and **Qualitative** (feeling/vibe) metrics.
[CRITERIA FOR VITAL SIGNS]
1. **Relationship:** Criteria must be strongly related to the activity.
2. **Low Friction:** Data entry must take less than 30 seconds.
3. **Diverse Inputs:** Use sliders, text, or photos where appropriate.
4. **Non-Judgmental:** The label should sound like an observation, not a test.
[INPUT TYPES ALLOWED]
- "number"
- "slider_1_5"
- "text"
- "photo"
- "boolean"
[OUTPUT FORMAT]
Valid JSON only.
{
    "selected_activity": "${activity}",
    "vital_signs": [
    {
        "label": "String",
        "input_type": "number | slider_1_5 | text | photo | boolean",
        "unit": "String or null",
        "rationale": "String"
    }
    ]
}`;
        prompt = `[INPUT CONTEXT]\n- selected activity name: ${activity}\n- selected activity description: ${description}`;
        break;
      
      // Skipping 2.2 Optional for MVP, going straight to Summary
      case '3.0_SUMMARIZE_COACH':
         // Inputs needed: coach info, personality, activity, metrics, user goal (new input)
         // userMessage here should be the "User Personal Goal" (Page 3 input)
         // We need to have gathered previous data in context.data
         
         const { 
             coach_name, 
             coach_bio, 
             selected_personality,
             selected_activity_name, // refined_activity
             vital_signs // final_vital_signs
         } = context.data;
         
         const userPersonalGoal = userMessage; 

         systemRole = `
[SYSTEM ROLE]
You are a "Synthesis Engine." Generate the final "Kickoff Card" for a new habit.
Adopt the persona of ${coach_name} with the vibe ${selected_personality}.
[TASK]
Generate a JSON summary.
1. **Welcome Message:** Reference the metrics and the goal.
2. **Motto:** A short punchy phrase.
3. **First Step:** A tiny micro-action to do NOW.
[OUTPUT FORMAT]
Valid JSON only.
{
    "summary_title": "String",
    "coach_welcome_message": "String",
    "commitment_motto": "String",
    "first_tiny_step": "String"
}`;
         prompt = `[INPUT CONTEXT]
- Coach: ${coach_name} (${coach_bio})
- Vibe: ${selected_personality}
- Activity: ${selected_activity_name}
- Metrics: ${JSON.stringify(vital_signs)}
- User Goal: ${userPersonalGoal}`;
         break;
    }

    // Call Gemini
    const responseText = await geminiService.chat([], prompt, systemRole);
    
    // Try to parse JSON
    let jsonResponse;
    try {
        // Clean markdown code blocks if present
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResponse = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON from agent", responseText);
        // Fallback or error
        return { error: "Failed to generate valid plan.", raw: responseText };
    }
    
    // Return the UI data and metadata
    return {
        step: context.step,
        ui_data: jsonResponse
    };
  },

  // Method to advance step manually after frontend confirmation
  advanceStep(userId: number, nextStep: CreationStep, dataToMerge: any) {
      const context = this.getOrCreateSession(userId);
      context.step = nextStep;
      context.data = { ...context.data, ...dataToMerge };
      this.updateSession(userId, context);
  }
};

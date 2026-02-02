import { CoachPersona, VitalSign } from "@/types/coach";

export const coachPersonas: CoachPersona[] = [
  {
    id: "gentle-guide",
    name: "Gentle Guide",
    description: "Soft, patient, and understanding. Takes things at your pace with lots of encouragement.",
    emoji: "🌸",
  },
  {
    id: "cheerleader",
    name: "Cheerleader",
    description: "Enthusiastic and uplifting! Celebrates every win, big or small.",
    emoji: "🎉",
  },
  {
    id: "wise-mentor",
    name: "Wise Mentor",
    description: "Thoughtful and insightful. Offers perspective and gentle wisdom.",
    emoji: "🦉",
  },
  {
    id: "adventure-buddy",
    name: "Adventure Buddy",
    description: "Playful and curious. Makes the journey feel like an exciting adventure.",
    emoji: "🚀",
  },
  {
    id: "calm-anchor",
    name: "Calm Anchor",
    description: "Steady and grounding. Helps you stay centered when things feel overwhelming.",
    emoji: "🌊",
  },
];

export const defaultVitalSigns: VitalSign[] = [
  {
    id: "mood",
    name: "Daily Mood",
    description: "A quick check-in on how you're feeling — helps spot patterns.",
    emoji: "😊",
    selected: true,
  },
  {
    id: "energy",
    name: "Energy Level",
    description: "Track your energy to understand what gives you fuel.",
    emoji: "⚡",
    selected: true,
  },
  {
    id: "sleep",
    name: "Sleep Quality",
    description: "Rest matters! Gentle reminders about sleep patterns.",
    emoji: "😴",
    selected: false,
  },
  {
    id: "progress",
    name: "Progress Notes",
    description: "Small wins and reflections to celebrate your journey.",
    emoji: "📝",
    selected: true,
  },
  {
    id: "stress",
    name: "Stress Check",
    description: "Notice stress levels early so we can adjust together.",
    emoji: "🌡️",
    selected: false,
  },
  {
    id: "gratitude",
    name: "Gratitude Moments",
    description: "Little things that brought you joy — research shows it helps!",
    emoji: "🙏",
    selected: false,
  },
];

export const generateDirections = (goal: string) => {
  // Simulated AI-generated directions based on goal keywords
  const lowerGoal = goal.toLowerCase();
  
  if (lowerGoal.includes("fitness") || lowerGoal.includes("exercise") || lowerGoal.includes("health") || lowerGoal.includes("weight")) {
    return [
      { id: "sustainable-habits", title: "Build Sustainable Habits", description: "Focus on small, lasting changes rather than intense routines", emoji: "🌱" },
      { id: "joyful-movement", title: "Find Joyful Movement", description: "Discover activities that feel fun, not like a chore", emoji: "💃" },
      { id: "mind-body-connection", title: "Mind-Body Connection", description: "Listen to your body and honor what it needs", emoji: "🧘" },
      { id: "strength-confidence", title: "Build Strength & Confidence", description: "Progressive goals that make you feel powerful", emoji: "💪" },
    ];
  }
  
  if (lowerGoal.includes("stress") || lowerGoal.includes("anxiety") || lowerGoal.includes("calm") || lowerGoal.includes("peace")) {
    return [
      { id: "daily-calm", title: "Daily Calm Rituals", description: "Simple practices to bring peace into your day", emoji: "🕯️" },
      { id: "boundary-setting", title: "Healthy Boundaries", description: "Learn to protect your energy and say no with love", emoji: "🛡️" },
      { id: "mindfulness", title: "Mindfulness Journey", description: "Present-moment awareness and grounding techniques", emoji: "🧘" },
      { id: "stress-triggers", title: "Understand Your Triggers", description: "Identify patterns and build resilience", emoji: "🔍" },
    ];
  }
  
  if (lowerGoal.includes("career") || lowerGoal.includes("job") || lowerGoal.includes("work") || lowerGoal.includes("professional")) {
    return [
      { id: "clarity-direction", title: "Find Clarity & Direction", description: "Explore what truly lights you up professionally", emoji: "🧭" },
      { id: "confidence-building", title: "Build Professional Confidence", description: "Show up authentically and trust your abilities", emoji: "✨" },
      { id: "work-life-harmony", title: "Work-Life Harmony", description: "Create sustainable balance without burning out", emoji: "⚖️" },
      { id: "skill-growth", title: "Skill Development", description: "Identify and grow the skills that matter most", emoji: "📈" },
    ];
  }
  
  // Default directions for general goals
  return [
    { id: "clarity-first", title: "Get Clear on What Matters", description: "Define what success really looks like for you", emoji: "💎" },
    { id: "small-steps", title: "Small Steps, Big Progress", description: "Break it down into manageable, celebratable wins", emoji: "👣" },
    { id: "accountability", title: "Gentle Accountability", description: "Stay on track with compassionate check-ins", emoji: "🤝" },
    { id: "overcome-blocks", title: "Overcome Inner Blocks", description: "Work through fears and limiting beliefs together", emoji: "🦋" },
  ];
};

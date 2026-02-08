import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Step, CoachConfig, CoachDirection, CoachPersona, VitalSign } from "@/types/coach";
import { ProgressIndicator } from "./ProgressIndicator";
import { WelcomeStep } from "./WelcomeStep";
import { GoalInputStep } from "./GoalInputStep";
import { DirectionSelectStep } from "./DirectionSelectStep";
import { PersonaSelectStep } from "./PersonaSelectStep";
import { VitalsSelectStep } from "./VitalsSelectStep";
import { SummaryStep } from "./SummaryStep";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";

import { API_BASE_URL } from "@/config";


const initialConfig: CoachConfig = {
  goal: "",
  direction: null,
  persona: null,
  vitalSigns: [],
};

const API_URL = `${API_BASE_URL}/api`;

export function CoachCreator() {
  const [step, setStep] = useState<Step>("welcome");
  const [config, setConfig] = useState<CoachConfig>(initialConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [directions, setDirections] = useState<CoachDirection[]>([]);
  const [personas, setPersonas] = useState<CoachPersona[]>([]);
  const [suggestedVitals, setSuggestedVitals] = useState<VitalSign[]>([]);
  const [inspirationGoals, setInspirationGoals] = useState<string[]>([]);
  const [isInspirationsLoading, setIsInspirationsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/");
    }
  }, [user, isAuthLoading, navigate]);


  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleStart = useCallback(() => {
    setStep("describe-goal");
  }, []);

  const handleFetchInspirations = useCallback(async () => {
    // Avoid re-fetching if we already have them
    if (inspirationGoals.length > 0) return;

    setIsInspirationsLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/coach/create/inspirations`, {
        method: "GET",
        headers: {
          "Authorization": token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setInspirationGoals(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch inspirations", error);
      // Silently fail, fallback to defaults
    } finally {
      setIsInspirationsLoading(false);
    }
  }, [inspirationGoals.length]);

  const handleGoalSubmit = useCallback(async (goal: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("No session token found");

      const response = await fetch(`${API_URL}/coach/create/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({ message: goal, reset: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate options");
      }

      const data = await response.json();

      // Map backend response to frontend types
      // Backend returns: { ui_data: { user_original_goal, rationale, options: [...] } }
      if (!data.ui_data || !Array.isArray(data.ui_data.options)) {
        console.error("Invalid API response format:", data);
        throw new Error("Invalid response format from AI agent");
      }

      const options = data.ui_data.options.map((opt: any, index: number) => ({
        id: `opt-${index}`,
        title: opt.activity_name,
        description: opt.description,
        emoji: opt.emoji || "✨", // Fallback if emoji missing
      }));

      setDirections(options);
      setConfig((prev) => ({ ...prev, goal }));
      setStep("select-direction");

    } catch (error) {
      console.error("Error generating options:", error);
      toast({
        title: "Error",
        description: "Failed to generate coaching options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleRegenerate = useCallback(() => {
    handleGoalSubmit(config.goal);
  }, [handleGoalSubmit, config.goal]);

  const handleDirectionSelect = useCallback(async (direction: CoachDirection) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("No session token found");

      // 1. Advance step to save direction
      await fetch(`${API_URL}/coach/create/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          nextStep: "1.2_CREATE_PERSONA",
          data: { selected_activity_name: direction.title }
        }),
      });

      setConfig((prev) => ({ ...prev, direction }));

      // 2. Generate Personas
      const response = await fetch(`${API_URL}/coach/create/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({ message: { selected_activity_name: direction.title } }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate personas");
      }

      const data = await response.json();

      // Backend returns: { ui_data: { coach_name, coach_bio, personality_options: [{name, description, emoji}] } }
      const generatedPersonas = data.ui_data.personality_options.map((opt: any, index: number) => ({
        id: `persona-${index}`,
        name: opt.name,
        description: opt.description,
        emoji: opt.emoji || "🙂",
      }));

      setPersonas(generatedPersonas);
      setStep("select-persona");

    } catch (error) {
      console.error("Error generating personas:", error);
      toast({
        title: "Error",
        description: "Failed to generate personality options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handlePersonaSelect = useCallback(async (persona: CoachPersona) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("No session token found");

      // 1. Advance step to save persona
      await fetch(`${API_URL}/coach/create/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          nextStep: "2.1_SUGGEST_VITAL_SIGNS",
          data: {
            coach_name: persona.name,
            coach_bio: persona.description,
            selected_personality: persona.name // Using name as proxy for personality vibe for now
          }
        }),
      });

      setConfig((prev) => ({ ...prev, persona }));

      // 2. Generate Vital Signs
      const response = await fetch(`${API_URL}/coach/create/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          message: {
            selected_activity_description: config.direction?.description
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate vital signs");
      }

      const data = await response.json();

      // Backend returns: { ui_data: { selected_activity, vital_signs: [{label, input_type, unit, rationale}] } }
      const generatedVitals = data.ui_data.vital_signs.map((v: any, index: number) => ({
        id: `vital-${index}`,
        name: v.label,
        description: v.rationale,
        emoji: v.emoji || "📊",
        type: v.input_type === 'slider_1_5' ? 'slider' : v.input_type,
        selected: false, // Default to unselected, user must pick
      }));

      setSuggestedVitals(generatedVitals);
      setStep("select-vitals");

    } catch (error) {
      console.error("Error generating vitals:", error);
      toast({
        title: "Error",
        description: "Failed to generate tracker options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [config.direction, toast]);

  const handleVitalsSelect = useCallback(async (vitalSigns: VitalSign[]) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("No session token found");

      // 1. Advance step to save vitals
      await fetch(`${API_URL}/coach/create/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          nextStep: "3.0_SUMMARIZE_COACH",
          data: {
            vital_signs: vitalSigns,
            // Also explicitly save the user goal if not already in session from previous steps roughly
            user_goal: config.goal
          }
        }),
      });

      setConfig((prev) => ({ ...prev, vitalSigns }));
      setStep("summary");
      setIsLoading(false);

    } catch (error) {
      console.error("Error saving vitals:", error);
      toast({
        title: "Error",
        description: "Failed to save tracking options. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [config.goal, toast]);

  const handleGenerateCustomVitals = useCallback(async (customGoal: string): Promise<VitalSign[]> => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("No session token found");

      const response = await fetch(`${API_URL}/coach/create/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          message: {
            selected_activity_description: customGoal,
            limit: 2
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate custom vitals");
      }

      const data = await response.json();

      // Backend returns: { ui_data: { selected_activity, vital_signs: [{label, input_type, unit, rationale}] } }
      const generatedVitals = data.ui_data.vital_signs.map((v: any, index: number) => ({
        id: `custom-vital-${Date.now()}-${index}`,
        name: v.label,
        description: v.rationale,
        emoji: v.emoji || "✨",
        type: v.input_type === 'slider_1_5' ? 'slider' : v.input_type,
        selected: false, // Don't auto-select custom ones as per user request
      }));

      return generatedVitals;

    } catch (error) {
      console.error("Error generating custom vitals:", error);
      toast({
        title: "Error",
        description: "Failed to generate custom tracker options. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const handleCreateCoach = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("No session token found");

      // Construct system instruction from config
      const systemInstruction = `You are ${config.persona?.name}, a ${config.direction?.title} coach. 
Bio: ${config.persona?.description}.
Your goal is to help the user track: ${config.vitalSigns?.filter(v => v.selected).map(v => v.name).join(', ') || 'their progress'}.
User Goal: ${config.goal}`;

      // 1. Create the coach
      const response = await fetch(`${API_URL}/coaches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({
          name: config.persona?.name,
          type: config.direction?.title,
          context: systemInstruction,
          icon: config.persona?.emoji || "🤖",
          goal: config.goal,
          bio: config.persona?.description,
          trackings: config.vitalSigns
            .filter(v => v.selected)
            .map(v => ({
              name: v.name,
              description: v.description,
              emoji: v.emoji,
              type: v.type
            }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create coach");
      }

      const data = await response.json();
      console.log("Coach created:", data);

      // 2. Clear the creation session
      await fetch(`${API_URL}/coach/create/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify({ message: "", reset: true }),
      });

      // 3. Navigate to chat with the new coach
      // Assuming we can pass the new coach ID or object to the chat route
      // For now, using the same pattern as before, but with the created coach data
      // You might need to adjust the navigation target based on your app's routing
      // 3. Navigation handled by SummaryStep
      // window.location.href = `/chat/${data.id}`;
      // Since we are inside the component, we can use the prop or state to trigger navigation,
      // BUT wait, SummaryStep uses useNavigate.
      // We should probably letting SummaryStep handle navigation OR passing a callback that handles it.
      // The original code passed `onStartOver`.
      // Let's passed a success callback to SummaryStep implicitly by successfully resolving this promise?
      // Actually SummaryStep calls `navigate("/chat", ...)` internally in `handleComplete`.
      // We should return the created coach or let SummaryStep handle the navigation.
      // Let's return the created coach data so SummaryStep can use it if needed, or just let it start fresh.

      return data;

    } catch (error) {
      console.error("Error finalizing coach:", error);
      toast({
        title: "Error",
        description: "Failed to create coach. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let caller know it failed
    } finally {
      setIsLoading(false);
    }
  }, [config, toast]);

  const handleStartOver = useCallback(() => {
    setStep("welcome");
    setConfig(initialConfig);
  }, []);

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="min-h-screen coach-gradient">
      <div className="container max-w-3xl mx-auto py-8">
        {/* Progress indicator - hidden on welcome and summary */}
        {step !== "welcome" && step !== "summary" && (
          <ProgressIndicator currentStep={step} />
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <WelcomeStep key="welcome" onStart={handleStart} onPrefetch={handleFetchInspirations} />
          )}

          {step === "describe-goal" && (
            <GoalInputStep
              key="goal"
              onSubmit={handleGoalSubmit}
              onBack={() => setStep("welcome")} // Back to welcome
              isLoading={isLoading}
              inspirationGoals={inspirationGoals}
              areInspirationsLoading={isInspirationsLoading}
            />
          )}

          {step === "select-direction" && (
            <DirectionSelectStep
              key="direction"
              goal={config.goal}
              directions={directions}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onSelect={handleDirectionSelect}
              onBack={() => setStep("describe-goal")} // Back to goal input
            />
          )}

          {step === "select-persona" && (
            <PersonaSelectStep
              key="persona"
              personas={personas}
              isLoading={isLoading}
              onSelect={handlePersonaSelect}
              onBack={() => setStep("select-direction")} // Back to direction select
            />
          )}

          {step === "select-vitals" && (
            <VitalsSelectStep
              key="vitals"
              suggestedVitals={suggestedVitals}
              isLoading={isLoading}
              onSelect={handleVitalsSelect}
              onBack={() => setStep("select-persona")} // Back to persona select
              onGenerateCustomVitals={handleGenerateCustomVitals}
              direction={config.direction}
              persona={config.persona}
            />
          )}

          {step === "summary" && (
            <SummaryStep
              key="summary"
              config={config}
              isLoading={isLoading}
              onStartOver={handleStartOver}
              onCreate={handleCreateCoach}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

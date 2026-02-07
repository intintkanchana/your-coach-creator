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
import { useToast } from "@/components/ui/use-toast";

const initialConfig: CoachConfig = {
  goal: "",
  direction: null,
  persona: null,
  vitalSigns: [],
};

const API_URL = "http://localhost:4000/api";

export function CoachCreator() {
  const [step, setStep] = useState<Step>("welcome");
  const [config, setConfig] = useState<CoachConfig>(initialConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [directions, setDirections] = useState<CoachDirection[]>([]);
  const [personas, setPersonas] = useState<CoachPersona[]>([]);
  const [suggestedVitals, setSuggestedVitals] = useState<VitalSign[]>([]);
  const { toast } = useToast();

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleStart = useCallback(() => {
    setStep("describe-goal");
  }, []);

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

      // Note: We don't set isLoading(false) here because we want to transition 
      // immediately to the summary step which will trigger finalize 
      // (and show loading state there)

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

  // Effect to trigger finalization when reaching summary step
  useEffect(() => {
    if (step === "summary") {
      const finalizeCoach = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem("sessionToken");
          if (!token) throw new Error("No session token found");

          const response = await fetch(`${API_URL}/coach/create/finalize`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": token,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error("Failed to finalize coach");
          }

          const data = await response.json();
          // data.coach contains the final saved coach
          console.log("Coach created:", data.coach);

          // Here we could update the config with any returned data-sanitization from server
          // e.g. setConfig(prev => ({ ...prev, ...data.coach }))

        } catch (error) {
          console.error("Error finalizing coach:", error);
          toast({
            title: "Error",
            description: "Failed to create coach. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      finalizeCoach();
    }
  }, [step, toast]);

  const handleStartOver = useCallback(() => {
    setConfig(initialConfig);
    setStep("welcome");
  }, []);

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
            <WelcomeStep key="welcome" onStart={handleStart} />
          )}

          {step === "describe-goal" && (
            <GoalInputStep
              key="goal"
              onSubmit={handleGoalSubmit}
              onBack={() => setStep("welcome")} // Back to welcome
              isLoading={isLoading}
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
            />
          )}

          {step === "summary" && (
            <SummaryStep
              key="summary"
              config={config}
              isLoading={isLoading}
              onStartOver={handleStartOver}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

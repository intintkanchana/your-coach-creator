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
        body: JSON.stringify({ message: goal }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate options");
      }

      const data = await response.json();

      // Map backend response to frontend types
      // Backend returns: { ui_data: { user_original_goal, rationale, options: [...] } }
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

  const handlePersonaSelect = useCallback((persona: CoachPersona) => {
    setConfig((prev) => ({ ...prev, persona }));
    setStep("select-vitals");
  }, []);

  const handleVitalsSelect = useCallback((vitalSigns: VitalSign[]) => {
    setConfig((prev) => ({ ...prev, vitalSigns }));
    setStep("summary");
  }, []);

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
              onSelect={handleVitalsSelect}
              onBack={() => setStep("select-persona")} // Back to persona select
            />
          )}

          {step === "summary" && (
            <SummaryStep
              key="summary"
              config={config}
              onStartOver={handleStartOver}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

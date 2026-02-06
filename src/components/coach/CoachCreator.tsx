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
    setConfig((prev) => ({ ...prev, direction }));
    // Here we would ideally fetch the next step (personas)
    // For now, just advance UI
    setStep("select-persona");
  }, []);

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

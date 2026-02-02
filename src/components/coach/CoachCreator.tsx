import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Step, CoachConfig, CoachDirection, CoachPersona, VitalSign } from "@/types/coach";
import { ProgressIndicator } from "./ProgressIndicator";
import { WelcomeStep } from "./WelcomeStep";
import { GoalInputStep } from "./GoalInputStep";
import { DirectionSelectStep } from "./DirectionSelectStep";
import { PersonaSelectStep } from "./PersonaSelectStep";
import { VitalsSelectStep } from "./VitalsSelectStep";
import { SummaryStep } from "./SummaryStep";
import { useToast } from "@/hooks/use-toast";

const initialConfig: CoachConfig = {
  goal: "",
  direction: null,
  persona: null,
  vitalSigns: [],
};

export function CoachCreator() {
  const [step, setStep] = useState<Step>("welcome");
  const [config, setConfig] = useState<CoachConfig>(initialConfig);
  const { toast } = useToast();

  const handleStart = useCallback(() => {
    setStep("describe-goal");
  }, []);

  const handleGoalSubmit = useCallback((goal: string) => {
    setConfig((prev) => ({ ...prev, goal }));
    setStep("select-direction");
  }, []);

  const handleDirectionSelect = useCallback((direction: CoachDirection) => {
    setConfig((prev) => ({ ...prev, direction }));
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

  const handleComplete = useCallback(() => {
    toast({
      title: "🎉 Your coach is ready!",
      description: "Let's begin your journey together.",
    });
    // Here you would typically navigate to the coach dashboard or save the config
  }, [toast]);

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
            <GoalInputStep key="goal" onSubmit={handleGoalSubmit} />
          )}

          {step === "select-direction" && (
            <DirectionSelectStep
              key="direction"
              goal={config.goal}
              onSelect={handleDirectionSelect}
            />
          )}

          {step === "select-persona" && (
            <PersonaSelectStep key="persona" onSelect={handlePersonaSelect} />
          )}

          {step === "select-vitals" && (
            <VitalsSelectStep key="vitals" onSelect={handleVitalsSelect} />
          )}

          {step === "summary" && (
            <SummaryStep
              key="summary"
              config={config}
              onComplete={handleComplete}
              onStartOver={handleStartOver}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

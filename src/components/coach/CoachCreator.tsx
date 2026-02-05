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

const initialConfig: CoachConfig = {
  goal: "",
  direction: null,
  persona: null,
  vitalSigns: [],
};

export function CoachCreator() {
  const [step, setStep] = useState<Step>("welcome");
  const [config, setConfig] = useState<CoachConfig>(initialConfig);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

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
            />
          )}

          {step === "select-direction" && (
            <DirectionSelectStep
              key="direction"
              goal={config.goal}
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

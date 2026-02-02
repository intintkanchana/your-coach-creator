import { motion } from "framer-motion";
import { Step } from "@/types/coach";

interface ProgressIndicatorProps {
  currentStep: Step;
}

const steps: { key: Step; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "describe-goal", label: "Your Goal" },
  { key: "select-direction", label: "Direction" },
  { key: "select-persona", label: "Personality" },
  { key: "select-vitals", label: "Tracking" },
  { key: "summary", label: "Ready!" },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <motion.div
            key={step.key}
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.div
              className={`
                h-2.5 rounded-full transition-all duration-500
                ${isCurrent ? "w-8 bg-primary" : "w-2.5"}
                ${isCompleted ? "bg-primary/60" : ""}
                ${!isCompleted && !isCurrent ? "bg-border" : ""}
              `}
              layoutId={`step-${step.key}`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoachDirection } from "@/types/coach";
// import { generateDirections } from "@/data/coachOptions"; // implementation details moved to parent
import { RefreshCw, Check, ChevronLeft } from "lucide-react";

interface DirectionSelectStepProps {
  goal: string;
  directions: CoachDirection[];
  rationale?: string;
  isLoading: boolean;
  onRegenerate: () => void;
  onSelect: (direction: CoachDirection) => void;
  onBack: () => void;
}

export function DirectionSelectStep({ goal, directions, rationale, isLoading, onRegenerate, onSelect, onBack }: DirectionSelectStepProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    const direction = directions.find((d) => d.id === selected);
    if (direction) {
      onSelect(direction);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col items-center px-4 py-8 max-w-2xl mx-auto"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="absolute left-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="mb-6"
      >
        <span className="text-5xl">💡</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center"
      >
        Nice goal! Here are a few directions
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        {rationale}
      </motion.p>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 animate-pulse-soft" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <span className="text-2xl">✨</span>
              </motion.div>
            </div>
            <p className="mt-4 text-muted-foreground">Finding the best directions for you...</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full space-y-4"
          >
            <div className="grid gap-3">
              {directions.map((direction, i) => (
                <motion.button
                  key={direction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelected(direction.id)}
                  className={`
                      relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300
                      ${selected === direction.id
                      ? "border-primary bg-primary/5 shadow-glow"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-soft"
                    }
                    `}
                >
                  <span className="text-3xl flex-shrink-0">{direction.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{direction.title}</h3>
                    <p className="text-sm text-muted-foreground">{direction.description}</p>
                  </div>
                  {selected === direction.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 w-full">
              <Button
                variant="outline"
                onClick={onRegenerate}
                className="w-full sm:flex-1 rounded-xl py-6"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Different Options
              </Button>

              <Button
                onClick={handleContinue}
                disabled={!selected}
                size="lg"
                className="w-full sm:flex-1 rounded-xl py-6"
              >
                This Feels Right
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

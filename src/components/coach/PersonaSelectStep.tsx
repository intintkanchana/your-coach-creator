import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoachPersona } from "@/types/coach";
import { coachPersonas } from "@/data/coachOptions";
import { Check, ArrowRight, ChevronLeft } from "lucide-react";

interface PersonaSelectStepProps {
  personas: CoachPersona[];
  isLoading: boolean;
  onSelect: (persona: CoachPersona) => void;
  onBack: () => void;
}

export function PersonaSelectStep({ personas, isLoading, onSelect, onBack }: PersonaSelectStepProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    const persona = personas.find((p) => p.id === selected);
    if (persona) {
      onSelect(persona);
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
        <span className="text-5xl">🎭</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center"
      >
        Now let's shape your coach's personality
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        How would you like me to support you? This affects how encouragement and feedback feel.
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
            <p className="mt-4 text-muted-foreground">Analyzing your choice...</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full grid md:grid-cols-2 gap-3 mb-8">
              {personas.map((persona, i) => (
                <motion.button
                  key={persona.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  onClick={() => setSelected(persona.id)}
                  className={`
                    relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 w-full
                    ${selected === persona.id
                      ? "border-primary bg-primary/5 shadow-glow scale-[1.02]"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-soft hover:scale-[1.01]"
                    }
                  `}
                >
                  <span className="text-3xl flex-shrink-0">{persona.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{persona.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{persona.description}</p>
                  </div>
                  {selected === persona.id && (
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

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleContinue}
                disabled={!selected}
                size="lg"
                className="px-8 py-6 text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

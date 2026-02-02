import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoachConfig } from "@/types/coach";
import { Sparkles, Heart, ArrowRight } from "lucide-react";

interface SummaryStepProps {
  config: CoachConfig;
  onComplete: () => void;
  onStartOver: () => void;
}

export function SummaryStep({ config, onComplete, onStartOver }: SummaryStepProps) {
  const selectedVitals = config.vitalSigns.filter((v) => v.selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center px-4 py-8 max-w-xl mx-auto"
    >
      {/* Celebration animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mb-6 relative"
      >
        <div className="h-24 w-24 rounded-full celebrate-gradient flex items-center justify-center coach-glow">
          <span className="text-5xl">✨</span>
        </div>
        <motion.div
          className="absolute -top-3 -right-1"
          animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-2xl">🎉</span>
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-2"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
        >
          <span className="text-xl">💛</span>
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-semibold text-foreground mb-3 text-center"
      >
        Your coach is ready!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        I'm here to support you, cheer you on, and grow with you — step by step.
      </motion.p>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-card rounded-3xl border-2 border-border p-6 shadow-soft space-y-5"
      >
        {/* Goal */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Your Goal</p>
          <p className="text-foreground font-medium">{config.goal}</p>
        </div>

        {/* Direction */}
        {config.direction && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Coaching Focus</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.direction.emoji}</span>
              <span className="font-medium text-foreground">{config.direction.title}</span>
            </div>
          </div>
        )}

        {/* Persona */}
        {config.persona && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Coach Personality</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.persona.emoji}</span>
              <span className="font-medium text-foreground">{config.persona.name}</span>
            </div>
          </div>
        )}

        {/* Vitals */}
        {selectedVitals.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tracking</p>
            <div className="flex flex-wrap gap-2">
              {selectedVitals.map((vital) => (
                <span
                  key={vital.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-sm"
                >
                  <span>{vital.emoji}</span>
                  <span className="text-secondary-foreground">{vital.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-3 pt-8 w-full"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="w-full sm:w-auto px-8 py-6 text-lg rounded-2xl shadow-glow"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Let's Do This!
        </Button>
        <Button
          variant="ghost"
          onClick={onStartOver}
          className="text-muted-foreground hover:text-foreground"
        >
          Start Over
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 text-sm text-muted-foreground mt-6"
      >
        <Heart className="h-4 w-4 text-accent" />
        <span>Remember: everything can be adjusted as we go!</span>
      </motion.div>
    </motion.div>
  );
}

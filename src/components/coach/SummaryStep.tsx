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

  const getCoachBio = (id: string) => {
    switch (id) {
      case "gentle-guide":
        return "I'm like a warm cup of tea for your soul, but with spreadsheets! I promise to never say 'try harder' when you need a nap. Let's bloom at your own pace—no fertilizers needed!";
      case "cheerleader":
        return "I brought pom-poms! Virtual ones, but they're huge! I will celebrate everything, even if you just put on socks today. YOU GOT THIS! Ready to turn your life into a highlight reel?";
      case "wise-mentor":
        return "I've seen it all (mostly). I offer wisdom, perspective, and the occasional cryptic metaphor that will make total sense at 3 AM. Let's unlock your potential, one riddle at a time.";
      case "adventure-buddy":
        return "Pack your bags—metaphorically! We’re going on a quest for greatness. I have a map, a compass, and zero sense of direction, but we’ll find the treasure anyway. Adventure awaits!";
      case "calm-anchor":
        return "I'm the meditative breath you forgot to take. When the world spins, I stay put. Think of me as a human paperweight for your flying thoughts. Let's find your center.";
      default:
        return "I'm your personal coach, ready to help you annoy your friends with how much progress you're making!";
    }
  };

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

      {/* Feature Coach Card */}
      {config.persona && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="w-full bg-gradient-to-br from-primary/10 to-card border-2 border-primary/20 rounded-3xl p-6 md:p-8 mb-6 text-center relative overflow-hidden"
        >


          <div className="text-6xl mb-4 animate-bounce-slow">
            {config.persona.emoji}
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-3">
            Coach {config.persona.name}
          </h3>

          <p className="text-muted-foreground italic max-w-sm mx-auto leading-relaxed">
            "{getCoachBio(config.persona.id)}"
          </p>
        </motion.div>
      )}

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
        className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 pt-8 w-full"
      >
        <Button
          variant="ghost"
          onClick={onStartOver}
          className="text-muted-foreground hover:text-foreground"
        >
          Start Over
        </Button>
        <Button
          onClick={onComplete}
          size="lg"
          className="w-full sm:w-auto px-8 py-6 text-lg rounded-2xl shadow-glow"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Let's Do This!
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

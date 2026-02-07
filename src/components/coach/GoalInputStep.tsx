import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Lightbulb, ChevronLeft } from "lucide-react";

interface GoalInputStepProps {
  onSubmit: (goal: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const prompts = [
  "I want to feel more confident at work",
  "I'd like to build a consistent exercise routine",
  "I want to manage my stress better",
  "I'm thinking about my career direction",
];

export function GoalInputStep({ onSubmit, onBack, isLoading = false }: GoalInputStepProps) {
  const [goal, setGoal] = useState("");

  const handleSubmit = () => {
    if (goal.trim()) {
      onSubmit(goal.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col items-center px-4 py-8 max-w-xl mx-auto"
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
        <span className="text-5xl">🌱</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center"
      >
        Tell me what you'd like to work on
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mb-8 max-w-md"
      >
        It can be a goal, a habit, or something you've been thinking about lately.
        Don't worry about getting it perfect — we'll figure it out together.
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full space-y-6"
          >
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Share what's on your mind..."
              className="min-h-[140px] text-lg resize-none rounded-2xl bg-card border-2 border-border focus:border-primary/50 p-4 shadow-soft transition-all"
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                <span>Need inspiration?</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {prompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    onClick={() => setGoal(prompt)}
                    className="p-3 text-sm text-left bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-secondary-foreground h-full flex items-center"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: goal.trim() ? 1 : 0.5 }}
              className="flex justify-center pt-4"
            >
              <Button
                onClick={handleSubmit}
                disabled={!goal.trim()}
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

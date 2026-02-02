import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Lightbulb } from "lucide-react";

interface GoalInputStepProps {
  onSubmit: (goal: string) => void;
}

const prompts = [
  "I want to feel more confident at work",
  "I'd like to build a consistent exercise routine",
  "I want to manage my stress better",
  "I'm thinking about my career direction",
];

export function GoalInputStep({ onSubmit }: GoalInputStepProps) {
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
      className="flex flex-col items-center px-4 py-8 max-w-xl mx-auto"
    >
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

      <motion.div
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
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, i) => (
              <motion.button
                key={prompt}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => setGoal(prompt)}
                className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-secondary-foreground"
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
            className="px-8 py-6 text-lg rounded-2xl"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

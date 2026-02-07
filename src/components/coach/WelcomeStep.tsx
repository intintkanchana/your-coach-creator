import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronLeft } from "lucide-react";

interface WelcomeStepProps {
  onStart: () => void;
  onPrefetch?: () => void;
}

export function WelcomeStep({ onStart, onPrefetch }: WelcomeStepProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (onPrefetch) {
      onPrefetch();
    }
  }, [onPrefetch]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col items-center justify-center text-center px-4 py-12"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/coaches")}
        className="absolute left-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center coach-glow">
            <span className="text-5xl">✨</span>
          </div>
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <span className="text-2xl">🌟</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-semibold text-foreground mb-4"
      >
        Ready to create your own coach?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed"
      >
        Let's build someone who supports you, understands you, and grows with you —
        step by step. 💛
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onStart}
          size="lg"
          className="px-8 py-6 text-lg rounded-2xl shadow-glow hover:shadow-lg transition-all duration-300"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Let's Begin
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-muted-foreground mt-6"
      >
        Takes about 2 minutes • Everything can be changed later
      </motion.p>
    </motion.div>
  );
}

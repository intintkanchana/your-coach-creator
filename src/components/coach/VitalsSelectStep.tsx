import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { VitalSign } from "@/types/coach";
import { defaultVitalSigns } from "@/data/coachOptions";
import { Check, ArrowRight, Eye } from "lucide-react";

interface VitalsSelectStepProps {
  onSelect: (vitals: VitalSign[]) => void;
}

export function VitalsSelectStep({ onSelect }: VitalsSelectStepProps) {
  const [vitals, setVitals] = useState<VitalSign[]>(defaultVitalSigns);

  const toggleVital = (id: string) => {
    setVitals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, selected: !v.selected } : v))
    );
  };

  const handleContinue = () => {
    onSelect(vitals);
  };

  const selectedCount = vitals.filter((v) => v.selected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="mb-6"
      >
        <span className="text-5xl">👀</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center"
      >
        What should we keep an eye on?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mb-2 max-w-md"
      >
        To support you better, here are a few things we <em>could</em> track. 
        Everything is optional — just pick what feels comfortable.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-2 text-sm text-primary mb-8"
      >
        <Eye className="h-4 w-4" />
        <span>{selectedCount} selected</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full grid gap-3"
      >
        {vitals.map((vital, i) => (
          <motion.button
            key={vital.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            onClick={() => toggleVital(vital.id)}
            className={`
              relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-300
              ${
                vital.selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }
            `}
          >
            <div
              className={`
                h-6 w-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${vital.selected ? "bg-primary border-primary" : "border-border"}
              `}
            >
              {vital.selected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}
            </div>
            <span className="text-2xl flex-shrink-0">{vital.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground">{vital.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{vital.description}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-sm text-muted-foreground text-center mt-6 max-w-sm"
      >
        Don't overthink it! You can always add or remove these later based on what feels helpful.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex justify-center pt-6"
      >
        <Button
          onClick={handleContinue}
          size="lg"
          className="px-8 py-6 text-lg rounded-2xl"
        >
          Almost Done!
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

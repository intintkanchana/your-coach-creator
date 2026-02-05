import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VitalSign, VitalSignType } from "@/types/coach";
import { defaultVitalSigns } from "@/data/coachOptions";
import { Check, ArrowRight, Eye, Loader2, Plus, ChevronDown, ChevronLeft } from "lucide-react";

interface VitalsSelectStepProps {
  onSelect: (vitals: VitalSign[]) => void;
  onBack: () => void;
}

export function VitalsSelectStep({ onSelect, onBack }: VitalsSelectStepProps) {
  const [vitals, setVitals] = useState<VitalSign[]>(defaultVitalSigns);
  const [customGoal, setCustomGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const toggleVital = (id: string) => {
    setVitals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, selected: !v.selected } : v))
    );
  };

  const getTypeConfig = (type: VitalSignType) => {
    switch (type) {
      case "number":
        return { icon: "🔢", label: "Number" };
      case "slider":
        return { icon: "🎚️", label: "Slider" };
      case "text":
        return { icon: "🔡", label: "Text" };
      case "photo":
        return { icon: "📷", label: "Photo" };
      case "boolean":
        return { icon: "☑️", label: "Boolean" };
      default:
        return { icon: "❓", label: "Unknown" };
    }
  };

  const handleGenerateCustomVital = () => {
    setIsGenerating(true);
    // Mock API simulation
    setTimeout(() => {
      const newVital: VitalSign = {
        id: `custom-${Date.now()}`,
        name: customGoal ? "Custom Tracker" : "General Tracker",
        description: customGoal
          ? `Tracking progress specifically for: ${customGoal}`
          : "A custom metric tailored to your specific needs.",
        emoji: "✨",
        selected: true,
        type: "text",
      };

      setVitals(prev => [...prev, newVital]);
      setCustomGoal("");
      setIsGenerating(false);
    }, 1500);
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
        className="w-full grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {vitals.map((vital, i) => (
          <motion.button
            key={vital.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            onClick={() => toggleVital(vital.id)}
            className={`
              relative flex items-start gap-3 p-3 md:gap-4 md:p-4 rounded-2xl border-2 text-left transition-all duration-300
              ${vital.selected
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
            <span className="text-2xl flex-shrink-0 leading-none">{vital.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-foreground">{vital.name}</h3>
                <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md flex items-center gap-1 ml-2 flex-shrink-0">
                  <span>{getTypeConfig(vital.type).icon}</span>
                  <span>{getTypeConfig(vital.type).label}</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{vital.description}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full mt-8"
      >
        <Collapsible
          open={isCustomOpen}
          onOpenChange={setIsCustomOpen}
          className="w-full bg-muted/30 rounded-2xl border-2 border-dashed border-border overflow-hidden"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 md:p-6 hover:bg-muted/50 transition-colors text-left group">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Custom Tracker
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Don't see what you need? Add your own.
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isCustomOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-3 pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Describe what you want to track, and we'll suggest a metric.
              </p>
              <Textarea
                placeholder="E.g., I want to track how many pages I read each day..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                className="bg-card resize-none min-h-[80px]"
              />
              <Button
                onClick={handleGenerateCustomVital}
                disabled={isGenerating}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding best metric...
                  </>
                ) : (
                  "Generate Options"
                )}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
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

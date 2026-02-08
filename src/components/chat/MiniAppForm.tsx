import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/types/chat";
import { CheckCircle2, Send } from "lucide-react";

interface MiniAppFormProps {
  fields: FormField[];
  submitted: boolean;
  submittedData?: Record<string, number | boolean | string>;
  onSubmit: (data: Record<string, number | boolean | string>) => void;
}

export function MiniAppForm({ fields, submitted, submittedData, onSubmit }: MiniAppFormProps) {
  const [formData, setFormData] = useState<Record<string, number | boolean | string>>(() => {
    const initial: Record<string, number | boolean | string> = {};
    fields.forEach((field) => {
      if (field.type === "toggle") {
        initial[field.id] = field.defaultValue ?? false;
      } else if (field.type === "text") {
        initial[field.id] = field.defaultValue ?? "";
      } else {
        initial[field.id] = field.defaultValue ?? (field.min ?? 0);
      }
    });
    return initial;
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  if (submitted && submittedData) {
    return (
      <motion.div
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="bg-muted/50 rounded-2xl p-4 border border-border/50"
      >
        <div className="flex items-center gap-2 mb-3 text-chat-user">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Log Submitted</span>
        </div>
        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{field.label}</span>
              <span className="font-medium text-foreground">
                {field.type === "toggle"
                  ? (submittedData[field.id] ? "Yes" : "No")
                  : `${submittedData[field.id]}${field.unit ? ` ${field.unit}` : ""}`
                }
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl p-5 border-2 border-primary/20 shadow-soft"
    >
      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="text-sm font-medium">
                {field.label}
              </Label>
              {field.type !== "toggle" && (
                <span className="text-sm font-semibold text-primary">
                  {formData[field.id]}{field.unit ? ` ${field.unit}` : ""}
                </span>
              )}
            </div>

            {field.type === "slider" && (
              <Slider
                id={field.id}
                min={field.min ?? 1}
                max={field.max ?? 5}
                step={1}
                value={[formData[field.id] as number]}
                onValueChange={([value]) =>
                  setFormData((prev) => ({ ...prev, [field.id]: value }))
                }
                className="py-2"
              />
            )}

            {field.type === "number" && (
              <div className="flex items-center gap-2">
                <Input
                  id={field.id}
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={formData[field.id] as number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.id]: parseFloat(e.target.value) || 0
                    }))
                  }
                  className="w-24"
                />
                {field.unit && (
                  <span className="text-sm text-muted-foreground">{field.unit}</span>
                )}
              </div>
            )}

            {field.type === "toggle" && (
              <div className="flex items-center gap-3">
                <Switch
                  id={field.id}
                  checked={formData[field.id] as boolean}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, [field.id]: checked }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData[field.id] ? "Yes" : "No"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full mt-5 rounded-xl"
        size="lg"
      >
        <Send className="mr-2 h-4 w-4" />
        Submit Log
      </Button>
    </motion.div>
  );
}

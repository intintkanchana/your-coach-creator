import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CoachConfig } from "@/types/coach";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CoachConfig;
}

export function SettingsSheet({ open, onOpenChange, config }: SettingsSheetProps) {
  const navigate = useNavigate();
  const { coachId } = useParams();
  const selectedVitals = config.vitalSigns.filter((v) => v.selected);

  // Helper to get bio description - reusing logic if needed or just display config.persona.description
  // Ideally this logic should be centralized or we trust the API to return the description.

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[350px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <span>⚙️</span>
            <span>Coach Settings</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Feature Coach Card Style */}
          {config.persona && (
            <div className="w-full bg-gradient-to-br from-primary/10 to-card border-2 border-primary/20 rounded-3xl p-6 text-center relative overflow-hidden">
              <div className="text-5xl mb-3">
                {config.persona.emoji}
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                Coach {config.persona.name}
              </h3>

              <p className="text-muted-foreground italic text-sm leading-relaxed">
                "{config.persona.description}"
              </p>
            </div>
          )}

          {/* Summary Card Style */}
          <div className="w-full bg-card rounded-3xl border-2 border-border p-6 shadow-sm space-y-5">
            {/* Activity Profile Link */}
            <button
              onClick={() => {
                onOpenChange(false);
                navigate(`/logs/${coachId}`);
              }}
              className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                  📊
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Activity Profile</p>
                  <p className="text-xs text-muted-foreground">View your log history</p>
                </div>
              </div>
              <div className="text-primary group-hover:translate-x-1 transition-transform">
                →
              </div>
            </button>

            {/* Goal */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Goal</p>
              <p className="text-foreground font-medium text-lg leading-tight">{config.goal || "Not set"}</p>
            </div>

            {/* Direction */}
            {config.direction && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Coaching Focus</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.direction.emoji}</span>
                  <span className="font-medium text-foreground">{config.direction.title}</span>
                </div>
              </div>
            )}

            {/* Persona */}
            {config.persona && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Coach Personality</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.persona.emoji}</span>
                  <span className="font-medium text-foreground">{config.persona.name}</span>
                </div>
              </div>
            )}

            {/* Vitals */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">Tracking</p>
              {selectedVitals.length > 0 ? (
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
              ) : (
                <p className="text-sm text-muted-foreground italic">No vital signs selected</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

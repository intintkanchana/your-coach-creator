import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CoachConfig, VitalSign } from "@/types/coach";
import { Badge } from "@/components/ui/badge";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CoachConfig;
}

export function SettingsSheet({ open, onOpenChange, config }: SettingsSheetProps) {
  const selectedVitals = config.vitalSigns.filter((v) => v.selected);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>⚙️</span>
            <span>Current Protocol</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Goal */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Goal</h4>
            <p className="text-foreground">{config.goal || "Not set"}</p>
          </div>

          {/* Direction */}
          {config.direction && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Focus Area</h4>
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.direction.emoji}</span>
                <span className="font-medium">{config.direction.title}</span>
              </div>
            </div>
          )}

          {/* Persona */}
          {config.persona && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Coach Personality</h4>
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.persona.emoji}</span>
                <span className="font-medium">{config.persona.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{config.persona.description}</p>
            </div>
          )}

          {/* Vital Signs */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Tracking</h4>
            {selectedVitals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedVitals.map((vital) => (
                  <Badge 
                    key={vital.id}
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <span>{vital.emoji}</span>
                    <span>{vital.name}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No vital signs selected</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

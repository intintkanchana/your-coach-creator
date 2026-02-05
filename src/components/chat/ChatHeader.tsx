import { Settings, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachConfig } from "@/types/coach";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/common/AppHeader";

interface ChatHeaderProps {
  config: CoachConfig;
  onSettingsClick: () => void;
}

export function ChatHeader({ config, onSettingsClick }: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <AppHeader>
      {/* Left: Back + Avatar + Info */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/coaches")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Coach Avatar */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center border-2 border-primary/30">
          <span className="text-xl">
            {config.persona?.emoji || "🌟"}
          </span>
        </div>

        {/* Coach Info */}
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">
            Coach {config.persona?.name || "Sunny"}
          </span>
          <span className="text-xs text-muted-foreground">
            {config.direction?.title || "Life Coaching"} • Day 1
          </span>
        </div>
      </div>

      {/* Right: Settings */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSettingsClick}
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </AppHeader>
  );
}

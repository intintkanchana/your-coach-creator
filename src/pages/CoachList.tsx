import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, MoreVertical, Settings, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppHeader } from "@/components/common/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Coach {
  id: string;
  name: string;
  emoji: string;
  project: string;
  lastActive: string;
}

const mockCoaches: Coach[] = [
  {
    id: "1",
    name: "Limber Lenny",
    emoji: "🧘‍♂️",
    project: "Front Split Project",
    lastActive: "Today",
  },
  {
    id: "2",
    name: "Hydration Homie",
    emoji: "💧",
    project: "Drink Water Project",
    lastActive: "Yesterday",
  },
];

const CoachList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>(mockCoaches);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const handleSignOut = () => {
    setShowSignOutDialog(false);
    logout();
  };

  const handleCoachClick = (coachId: string) => {
    navigate("/chat", { state: { coachId } });
  };

  const handleRetireCoach = (coachId: string) => {
    setCoaches(coaches.filter((c) => c.id !== coachId));
    setOpenPopoverId(null);
  };

  const handleEditSettings = (coachId: string) => {
    // Navigate to edit settings - for now just close popover
    setOpenPopoverId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader>
        <h1 className="text-xl font-bold text-foreground">My Squad</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.picture} alt={user?.name} referrerPolicy="no-referrer" />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-sm font-medium">
              {user?.name}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSignOutDialog(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </AppHeader>

      {/* Coach List */}
      <main className="px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {coaches.map((coach, index) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card shadow-soft hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="flex items-center p-4">
                  {/* Clickable area - Coach info */}
                  <button
                    onClick={() => handleCoachClick(coach.id)}
                    className="flex items-center gap-4 flex-1 text-left"
                  >
                    <div className="text-4xl">{coach.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {coach.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {coach.project}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last active: {coach.lastActive}
                      </p>
                    </div>
                  </button>

                  {/* Actions Menu */}
                  <Popover
                    open={openPopoverId === coach.id}
                    onOpenChange={(open) =>
                      setOpenPopoverId(open ? coach.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-48 p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleEditSettings(coach.id)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Edit Settings
                      </button>
                      <button
                        onClick={() => handleRetireCoach(coach.id)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Retire Coach
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Create New Coach Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: coaches.length * 0.1 }}
          >
            <button
              onClick={() => navigate("/create")}
              className="w-full border-2 border-dashed border-chat-user/50 hover:border-chat-user rounded-xl p-6 flex items-center justify-center gap-3 text-chat-user hover:bg-chat-user/5 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Hire a New Coach</span>
            </button>
          </motion.div>
        </div>
      </main>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="w-[90%] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">🚪</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Ready to take a break?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowSignOutDialog(false)}
            >
              Stay
            </Button>
            <Button onClick={handleSignOut} className="bg-chat-user hover:bg-chat-user/90 text-chat-user-foreground">
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachList;

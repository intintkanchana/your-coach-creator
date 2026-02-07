import { useState, useEffect } from "react";
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

const getEmojiForType = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("run")) return "🏃";
  if (t.includes("read") || t.includes("book")) return "📚";
  if (t.includes("water") || t.includes("drink")) return "💧";
  if (t.includes("yoga") || t.includes("flex")) return "🧘‍♂️";
  if (t.includes("gym") || t.includes("lift")) return "💪";
  if (t.includes("sleep")) return "😴";
  if (t.includes("meditat")) return "🧘";
  return "🤖";
};

const CoachList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("http://localhost:4000/api/coaches", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const mappedCoaches = data.map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            emoji: c.icon || getEmojiForType(c.type),
            project: c.type,
            lastActive: "Today" // Placeholder
          }));
          setCoaches(mappedCoaches);
        } else {
          console.error("Failed to fetch coaches:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching coaches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoaches();
  }, []);


  const handleSignOut = () => {
    setShowSignOutDialog(false);
    logout();
  };

  const handleCoachClick = (coachId: string) => {
    navigate(`/chat/${coachId}`);
  };

  const handleRetireCoach = (coach: Coach) => {
    setCoachToDelete(coach);
    setOpenPopoverId(null);
  };

  const confirmRetire = async () => {
    if (!coachToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("sessionToken");
      const response = await fetch(`http://localhost:4000/api/coaches/${coachToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCoaches(coaches.filter((c) => c.id !== coachToDelete.id));
        setCoachToDelete(null);
      } else {
        console.error("Failed to delete coach");
      }
    } catch (error) {
      console.error("Error deleting coach:", error);
    } finally {
      setIsDeleting(false);
    }
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
          {coaches.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12 flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-8xl filter drop-shadow-xl"
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -right-4 text-6xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  🤖
                </motion.div>
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-foreground">
                  Build Your Dream Squad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ready to level up? Create your own personalized AI coaches to help you achieve your goals, verify your ideas, or just having fun!
                </p>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pt-4"
              >
                <button
                  onClick={() => navigate("/create")}
                  className="group relative px-8 py-4 bg-chat-user text-white rounded-full font-semibold shadow-lg shadow-chat-user/20 hover:shadow-chat-user/40 transition-all duration-300 flex items-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <Plus className="w-5 h-5" />
                  <span>Hire check Your First Coach</span>
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <>
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
                            onClick={() => handleRetireCoach(coach)}
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

              {/* Create New Coach Card - Only show at bottom if list is not empty */}
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
            </>
          )}
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

      {/* Retire Coach Confirmation Dialog */}
      <Dialog open={!!coachToDelete} onOpenChange={(open) => !open && setCoachToDelete(null)}>
        <DialogContent className="w-[90%] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">
              <Trash2 className="w-8 h-8 mx-auto mb-2" />
              Retire Coach?
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              Are you sure you want to retire <strong>{coachToDelete?.name}</strong>?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setCoachToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRetire}
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Retiring..." : "Yes, Retire Coach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachList;

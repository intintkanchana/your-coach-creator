import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useGoogleLogin } from "@react-oauth/google";

const Landing = () => {
  const navigate = useNavigate();
  const { login, loginAsGuest, user, isLoading: isAuthLoading } = useAuth();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [guestNickname, setGuestNickname] = useState("");
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate("/coaches");
    }
  }, [user, isAuthLoading, navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoginLoading(true);
        // tokenResponse has access_token
        await login(tokenResponse.access_token);
      } catch (e) {
        console.error("Login failed", e);
      } finally {
        setIsLoginLoading(false);
      }
    },
    onError: () => {
      console.error("Login Failed");
      setIsLoginLoading(false);
    }
  });

  const handleLoginClick = () => {
    googleLogin();
  };

  const handleGuestLogin = async () => {
    if (!guestNickname.trim()) return;

    setIsGuestLoading(true);
    try {
      await loginAsGuest(guestNickname);
    } catch (e) {
      console.error("Guest login failed", e);
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <motion.div
          className="text-8xl mb-8"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🌱
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl font-bold text-chat-user mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Small Steps, Big Change.
        </motion.h1>

        <motion.p
          className="text-lg text-muted-foreground mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your personal AI squad for building better habits, one tracer bullet at a time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <Button
            onClick={handleLoginClick}
            disabled={isLoginLoading}
            className="bg-card text-foreground border border-border shadow-soft hover:shadow-md transition-all duration-200 px-6 py-6 text-base font-medium rounded-xl flex items-center gap-3 cursor-pointer"
            variant="outline"
          >
            {isLoginLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isLoginLoading ? "Signing in..." : "Continue with Google"}
            {isLoginLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-4 w-full my-4">
            <div className="h-px bg-border flex-1" />
            <span className="text-muted-foreground text-sm">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <Button
            onClick={() => setShowGuestDialog(true)}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Continue as Guest
          </Button>
        </motion.div>
      </div>

      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue as Guest</DialogTitle>
            <DialogDescription>
              Enter a nickname to start your journey. Your data will be saved on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Your nickname (e.g. Ace, Sparky)"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGuestLogin();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGuestDialog(false)}
              disabled={isGuestLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGuestLogin}
              className="bg-chat-user text-white"
              disabled={isGuestLoading || !guestNickname.trim()}
            >
              {isGuestLoading ? "Starting..." : "Let's Go"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;

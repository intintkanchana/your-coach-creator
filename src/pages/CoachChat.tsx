import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActionPills } from "@/components/chat/QuickActionPills";
import { SettingsSheet } from "@/components/chat/SettingsSheet";
import { ChatMessage as ChatMessageType, QuickAction, FormField } from "@/types/chat";
import { CoachConfig } from "@/types/coach";

// Default config if none provided
const defaultConfig: CoachConfig = {
  goal: "Improve my flexibility",
  direction: {
    id: "physical",
    title: "Physical Wellness",
    description: "Focus on body and movement",
    emoji: "🏃",
  },
  persona: {
    id: "cheerleader",
    name: "Sunny",
    description: "Enthusiastic and supportive",
    emoji: "☀️",
  },
  vitalSigns: [
    { id: "mood", name: "Mood", description: "How you feel", emoji: "😊", selected: true, type: "slider" },
    { id: "energy", name: "Energy", description: "Your energy level", emoji: "⚡", selected: true, type: "slider" },
  ],
};

// Mock form fields for the vital signs check-in
const mockFormFields: FormField[] = [
  { id: "ouch-factor", label: "Ouch Factor", type: "slider", min: 1, max: 5, defaultValue: 2 },
  { id: "gap", label: "Gap from floor", type: "number", unit: "cm", min: 0, max: 100, defaultValue: 15 },
  { id: "hips-squared", label: "Hips Squared?", type: "toggle", defaultValue: false },
];

export default function CoachChat() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<CoachConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatPhase, setChatPhase] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  useEffect(() => {
    // Immediate scroll on mount/updates to prevent jump
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, quickActions]);

  useEffect(() => {
    const fetchCoach = async () => {
      if (!coachId) return;

      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(`http://localhost:4000/api/coaches/${coachId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const coachData = await response.json();

          let parsedVitalSigns = [];

          if (coachData.trackings && Array.isArray(coachData.trackings) && coachData.trackings.length > 0) {
            parsedVitalSigns = coachData.trackings.map((t: any) => ({
              id: t.id ? t.id.toString() : `track-${Math.random()}`,
              name: t.name,
              description: t.description || "",
              emoji: t.emoji || "📊",
              selected: true,
              type: t.type || "number"
            }));
          } else {
            try {
              parsedVitalSigns = typeof coachData.vital_signs === 'string'
                ? JSON.parse(coachData.vital_signs)
                : (coachData.vital_signs || []);
            } catch (e) {
              console.error("Failed to parse vital signs", e);
            }
          }

          // Adapt backend data to frontend config format
          setConfig({
            goal: coachData.goal || "achieve your goals",
            direction: {
              id: coachData.type.toLowerCase(),
              title: coachData.type,
              description: "Focus on " + coachData.type,
              emoji: "🎯",
            },
            persona: {
              id: "custom",
              name: coachData.name,
              description: coachData.bio || coachData.system_instruction,
              emoji: coachData.icon || "🤖",
            },
            vitalSigns: parsedVitalSigns,
            createdAt: coachData.created_at
          });
        } else {
          console.error("Failed to fetch coach details");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching coach:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoach();
  }, [coachId, navigate]);

  // Mock chat flow - only start when config is loaded
  useEffect(() => {
    if (!config || chatPhase !== 0) return;

    // Initial greeting
    setTimeout(() => {
      setMessages([
        {
          id: "1",
          type: "coach",
          content: `Hey there! 👋 I'm Coach ${config.persona?.name || "Sunny"}, and I'm SO excited to work with you!`,
          timestamp: new Date(),
        },
      ]);
      setChatPhase(1);
    }, 500);
  }, [chatPhase, config]);

  useEffect(() => {
    if (chatPhase === 1) {
      // Follow-up question with quick actions
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: "2",
              type: "coach",
              content: "Before we dive in, have you had a chance to warm up today? 🔥",
              timestamp: new Date(),
            },
          ]);
          setQuickActions([
            { id: "ready", label: "I'm ready!" },
            { id: "not-yet", label: "Not yet" },
            { id: "show-me", label: "Show me how" },
          ]);
          setChatPhase(2);
        }, 1000);
      }, 1500);
    }
  }, [chatPhase]);

  const handleQuickAction = (action: QuickAction) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content: action.label,
        timestamp: new Date(),
      },
    ]);
    setQuickActions([]);

    if (action.id === "show-me") {
      // Send tip bubble
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `tip-${Date.now()}`,
              type: "tip",
              content: "A quick 5-minute dynamic warm-up works wonders! Try leg swings, hip circles, and light jogging in place. Your muscles will thank you! 🙏",
              timestamp: new Date(),
            },
          ]);
          setChatPhase(3);
        }, 1200);
      }, 500);
    } else if (action.id === "ready" || action.id === "not-yet") {
      setChatPhase(3);
    }
  };

  useEffect(() => {
    if (chatPhase === 3) {
      // Ask for data entry
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `form-${Date.now()}`,
              type: "form",
              content: "Awesome! Let's log your session. Fill this out after your stretch:",
              timestamp: new Date(),
              formFields: mockFormFields,
              formSubmitted: false,
            },
          ]);
          setChatPhase(4);
        }, 1500);
      }, 1000);
    }
  }, [chatPhase]);

  const handleFormSubmit = (messageId: string, data: Record<string, number | boolean>) => {
    // Update the form message to show submitted state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, formSubmitted: true, formData: data }
          : msg
      )
    );

    // Add user summary message
    const summaryParts: string[] = [];
    mockFormFields.forEach((field) => {
      const value = data[field.id];
      if (field.type === "toggle") {
        summaryParts.push(`${field.label}: ${value ? "Yes" : "No"}`);
      } else {
        summaryParts.push(`${field.label}: ${value}${field.unit ? ` ${field.unit}` : ""}`);
      }
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `user-log-${Date.now()}`,
        type: "user",
        content: `📊 ${summaryParts.join(" • ")}`,
        timestamp: new Date(),
      },
    ]);

    // Coach celebration
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `celebrate-${Date.now()}`,
            type: "system",
            content: "Day 1 Complete 🎉",
            timestamp: new Date(),
          },
          {
            id: `coach-final-${Date.now()}`,
            type: "coach",
            content: "AMAZING work! 🌟 You showed up, you did the thing, and that's what counts! I'm already proud of you. See you tomorrow for Day 2! 💪",
            timestamp: new Date(),
          },
        ]);
        setChatPhase(5);
      }, 1200);
    }, 800);
  };

  const handleSendMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content,
        timestamp: new Date(),
      },
    ]);

    // Simple echo response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `coach-${Date.now()}`,
            type: "coach",
            content: "Thanks for sharing! I'm here to support you every step of the way. 💛",
            timestamp: new Date(),
          },
        ]);
      }, 1000);
    }, 500);
  };

  if (isLoading || !config) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-chat-user border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading coach...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <ChatHeader config={config} onSettingsClick={() => setSettingsOpen(true)} />

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                coachEmoji={config.persona?.emoji}
                onFormSubmit={handleFormSubmit}
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">{config.persona?.emoji || "🌟"}</span>
              </div>
              <div className="bg-chat-coach rounded-2xl rounded-tl-md px-4 py-3 shadow-soft">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick action pills */}
          {quickActions.length > 0 && (
            <div className="w-full pl-[44px]"> {/* Add indentation to align with bubble content (32px avatar + 12px gap) */}
              <QuickActionPills actions={quickActions} onSelect={handleQuickAction} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} />

      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
      />
    </div>
  );
}

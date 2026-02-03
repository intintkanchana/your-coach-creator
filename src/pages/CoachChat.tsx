import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const config: CoachConfig = location.state?.config || defaultConfig;
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatPhase, setChatPhase] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, quickActions, scrollToBottom]);

  // Mock chat flow
  useEffect(() => {
    if (chatPhase === 0) {
      // Initial greeting
      setTimeout(() => {
        setMessages([
          {
            id: "1",
            type: "coach",
            content: `Hey there! 👋 I'm Coach ${config.persona?.name || "Sunny"}, and I'm SO excited to work with you on ${config.goal || "your goals"}!`,
            timestamp: new Date(),
          },
        ]);
        setChatPhase(1);
      }, 500);
    }
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ChatHeader config={config} onSettingsClick={() => setSettingsOpen(true)} />

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center">
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick action pills */}
      <AnimatePresence>
        {quickActions.length > 0 && (
          <div className="max-w-3xl mx-auto w-full">
            <QuickActionPills actions={quickActions} onSelect={handleQuickAction} />
          </div>
        )}
      </AnimatePresence>

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

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
              parsedVitalSigns = (typeof coachData.vital_signs === 'string' && coachData.vital_signs.trim() !== '')
                ? JSON.parse(coachData.vital_signs)
                : (Array.isArray(coachData.vital_signs) ? coachData.vital_signs : []);
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
  // Chat flow with backend integration
  const fetchGreeting = async () => {
    if (!coachId || !config) return;

    // Check if we already have messages, if so, don't fetch greeting again (unless we want to?)
    // For now, only fetch if empty
    if (messages.length > 0) return;

    try {
      setIsTyping(true);
      const token = localStorage.getItem("sessionToken");
      const res = await fetch(`http://localhost:4000/api/chat/greeting`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ coachId: parseInt(coachId) })
      });

      if (res.ok) {
        const data = await res.json();

        // Greeting
        setMessages(prev => [
          ...prev,
          {
            id: `coach-greet-${Date.now()}`,
            type: "coach",
            content: data.greeting_text,
            timestamp: new Date()
          }
        ]);

        // Question (delayed slightly for effect)
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `coach-q-${Date.now()}`,
              type: "coach",
              content: data.question_text,
              timestamp: new Date()
            }
          ]);

          // Quick Actions
          if (data.quick_actions && Array.isArray(data.quick_actions)) {
            setQuickActions(data.quick_actions.map((qa: string, idx: number) => ({
              id: `qa-${idx}`,
              label: qa
            })));
          }
        }, 800);

      }
    } catch (err) {
      console.error("Failed to fetch greeting", err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (config && messages.length === 0) {
      fetchGreeting();
    }
  }, [config, coachId]);

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.label);
    setQuickActions([]);
  };

  const handleSendMessage = async (content: string) => {
    // Optimistically add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        type: "user",
        content,
        timestamp: new Date(),
      },
    ]);

    setIsTyping(true);

    try {
      const token = localStorage.getItem("sessionToken");
      const res = await fetch(`http://localhost:4000/api/chat/classify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          coachId: parseInt(coachId!),
          message: content
        })
      });

      if (res.ok) {
        const data = await res.json();

        if (data.intention === "LOG_NEW_ACTIVITY" || (data.trackings && data.trackings.length > 0)) {
          // Coach response first (enthusiastic acknowledgement)
          if (data.response_text) {
            setMessages(prev => [
              ...prev,
              {
                id: `coach-res-${Date.now()}`,
                type: "coach",
                content: data.response_text,
                timestamp: new Date()
              }
            ]);
          }

          // Show Form
          setTimeout(() => {
            const trackingsToUse = data.trackings || config?.vitalSigns || [];

            const formFields = trackingsToUse.map((t: any) => ({
              id: t.id?.toString() || `field-${Math.random()}`,
              label: t.name,
              type: (t.type === 'slider' ? 'slider' : 'number') as "slider" | "number",
              min: 1,
              max: 10,
              defaultValue: 5
            }));

            if (formFields.length === 0) {
              formFields.push(...mockFormFields);
            }

            setMessages(prev => [
              ...prev,
              {
                id: `form-${Date.now()}`,
                type: "form",
                content: "Please log your activity details below:",
                timestamp: new Date(),
                formFields: formFields,
                formSubmitted: false,
              }
            ]);
          }, 500);

        } else {
          // GENERAL_CONSULT
          setMessages(prev => [
            ...prev,
            {
              id: `coach-res-${Date.now()}`,
              type: "coach",
              content: data.response_text,
              timestamp: new Date()
            }
          ]);
        }
      }
    } catch (err) {
      console.error("Error sending message", err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: "system",
          content: "Sorry, I had trouble connecting. Please try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = async (messageId: string, data: Record<string, number | boolean | string>) => {
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
    Object.entries(data).forEach(([key, value]) => {
      const label = config?.vitalSigns?.find(v => v.id === key)?.name || key;
      summaryParts.push(`${label}: ${value}`);
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

    setIsTyping(true);

    try {
      const token = localStorage.getItem("sessionToken");
      const res = await fetch(`http://localhost:4000/api/chat/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          coachId: parseInt(coachId!),
          logData: data
        })
      });

      if (res.ok) {
        const result = await res.json();
        const analysis = result.analysis;

        // Summary Impression
        if (analysis.summary_impression) {
          setMessages(prev => [
            ...prev,
            {
              id: `coach-sum-${Date.now()}`,
              type: "coach",
              content: analysis.summary_impression,
              timestamp: new Date()
            }
          ]);
        }

        // Detailed Feedback (Deep Dive + Next Steps)
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: `coach-analysis-${Date.now()}`,
              type: "coach",
              content: "Analysis Results", // Fallback text
              analysisData: analysis, // Pass structured data
              timestamp: new Date()
            }
          ]);

          // Day Complete Celebration
          setMessages(prev => [
            ...prev,
            {
              id: `celebrate-${Date.now()}`,
              type: "system",
              content: "Session Logged 🎉",
              timestamp: new Date(),
            }
          ]);

        }, 800);
      }

    } catch (err) {
      console.error("Error analyzing log", err);
    } finally {
      setIsTyping(false);
    }
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

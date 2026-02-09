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
import { API_BASE_URL } from "@/config";

// Helper to format date
const formatDateLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
};

const DateLabel = ({ date }: { date: Date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-muted/50 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
      {formatDateLabel(date)}
    </div>
  </div>
);

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
  { id: "ouch-factor", label: "Ouch Factor", emoji: "🤕", type: "slider", min: 1, max: 5, defaultValue: 2 },
  { id: "gap", label: "Gap from floor", emoji: "📏", type: "number", unit: "cm", min: 0, max: 100, defaultValue: 15 },
  { id: "hips-squared", label: "Hips Squared?", emoji: "📐", type: "boolean", defaultValue: false },
];

export default function CoachChat() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<CoachConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatPhase, setChatPhase] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    // Immediate scroll on mount/updates to prevent jump
    scrollToBottom();
    // Double check scroll after layout animations (Framer Motion)
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [messages, quickActions, isTyping, scrollToBottom]);

  // Load chat history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!coachId || !config) return;

      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/api/chat/history/${coachId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const historyData = await res.json();
          // Map backend history to frontend messages
          const mappedMessages: ChatMessageType[] = historyData.map((msg: any) => {
            let content = msg.content;
            let analysisData = undefined;

            if (content.startsWith("JSON_ANALYSIS:")) {
              try {
                const jsonStr = content.substring("JSON_ANALYSIS:".length);
                analysisData = JSON.parse(jsonStr);
                content = "Analysis Results"; // Fallback text for list view or if component fails

                // Inject emojis and units into feedback (same as in handleFormSubmit)
                if (analysisData.vital_sign_feedback && Array.isArray(analysisData.vital_sign_feedback)) {
                  analysisData.vital_sign_feedback = analysisData.vital_sign_feedback.map((item: any) => {
                    const tracking = config!.vitalSigns.find(v =>
                      v.name.toLowerCase() === item.label.toLowerCase() ||
                      v.id.toLowerCase() === item.label.toLowerCase()
                    );
                    return {
                      ...item,
                      emoji: tracking?.emoji || "📊",
                      unit: tracking?.type === 'number' || tracking?.type === 'slider' ? tracking.unit : undefined
                    };
                  });
                }
              } catch (e) {
                console.error("Failed to parse analysis history", e);
              }
            } else if (content.startsWith("JSON_FORM_REQUEST:")) {
              const formFields = config?.vitalSigns?.map((t: any) => {
                // Logic to reconstruct form fields same as in handleSendMessage
                let defaultValue: number | boolean | string = 5;
                let min = 1;
                let max = 10;
                let unit = undefined;

                switch (t.type) {
                  case 'slider':
                    defaultValue = 3;
                    min = 1;
                    max = 5;
                    break;
                  case 'boolean':
                    defaultValue = false;
                    break;
                  case 'text':
                    defaultValue = "";
                    break;
                  case 'number':
                    defaultValue = 0;
                    min = 0;
                    max = 100;
                    unit = t.unit;
                    break;
                }

                return {
                  id: t.id?.toString() || `field-${Math.random()}`,
                  label: t.name,
                  description: t.description,
                  emoji: t.emoji,
                  type: t.type,
                  min,
                  max,
                  unit,
                  defaultValue
                };
              }) || mockFormFields;

              return {
                id: msg.id.toString(),
                type: "form",
                content: "Please log your activity details below:",
                timestamp: new Date(msg.timestamp),
                formFields: formFields,
                formSubmitted: false,
              };
            } else if (content.startsWith("JSON_FORM_SUBMITTED:")) {
              try {
                const jsonStr = content.substring("JSON_FORM_SUBMITTED:".length);
                const parsed = JSON.parse(jsonStr);
                const formFields = config?.vitalSigns?.map((t: any) => {
                  // Logic to reconstruct form fields same as in handleSendMessage
                  let defaultValue: number | boolean | string = 5;
                  let min = 1;
                  let max = 10;
                  let unit = undefined;

                  switch (t.type) {
                    case 'slider':
                      defaultValue = 3;
                      min = 1;
                      max = 5;
                      break;
                    case 'boolean':
                      defaultValue = false;
                      break;
                    case 'text':
                      defaultValue = "";
                      break;
                    case 'number':
                      defaultValue = 0;
                      min = 0;
                      max = 100;
                      unit = t.unit;
                      break;
                  }

                  return {
                    id: t.id?.toString() || `field-${Math.random()}`,
                    label: t.name,
                    description: t.description,
                    emoji: t.emoji,
                    type: t.type,
                    min,
                    max,
                    unit,
                    defaultValue
                  };
                }) || mockFormFields;

                return {
                  id: msg.id.toString(),
                  type: "form",
                  content: "Log Submitted", // Or keep "Please log..." but standard is often to show state
                  timestamp: new Date(msg.timestamp),
                  formFields: formFields,
                  formSubmitted: true,
                  formData: parsed.formData
                };
              } catch (e) {
                console.error("Failed to parse form submitted", e);
              }
            }

            return {
              id: msg.id.toString(),
              type: msg.role === 'model' ? 'coach' : 'user',
              content: content,
              analysisData: analysisData,
              timestamp: new Date(msg.timestamp)
            };
          });

          if (mappedMessages.length > 0) {
            setMessages(mappedMessages);
          }
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsHistoryLoaded(true);
      }
    };

    fetchHistory();
  }, [coachId, config]);


  useEffect(() => {
    const fetchCoach = async () => {
      if (!coachId) return;

      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/coaches/${coachId}`, {
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
              type: t.type || "number",
              unit: t.type === 'number' || t.type === 'slider' ? t.unit : undefined
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
      const res = await fetch(`${API_BASE_URL}/api/chat/greeting`, {
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
    if (config && isHistoryLoaded && messages.length === 0 && !isLoading) {
      // Only fetch greeting if we have no history AND config is loaded AND history is confirmed loaded
      fetchGreeting();
    }
  }, [config, coachId, isLoading, isHistoryLoaded, messages.length]);



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
      const res = await fetch(`${API_BASE_URL}/api/chat/classify`, {
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

            const formFields = trackingsToUse.map((t: any) => {
              let defaultValue: number | boolean | string = 5;
              let min = 1;
              let max = 10;
              let unit = undefined;

              switch (t.type) {
                case 'slider':
                  defaultValue = 3;
                  min = 1;
                  max = 5;
                  break;
                case 'boolean':
                  defaultValue = false;
                  break;
                case 'text':
                  defaultValue = "";
                  break;
                case 'number':
                  defaultValue = 0;
                  min = 0;
                  max = 100;
                  unit = t.unit;
                  break;
              }

              return {
                id: t.id?.toString() || `field-${Math.random()}`,
                label: t.name,
                description: t.description,
                emoji: t.emoji,
                type: t.type,
                min,
                max,
                unit,
                defaultValue
              };
            });

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

          // Quick Actions
          if (data.quick_actions && Array.isArray(data.quick_actions)) {
            setTimeout(() => {
              setQuickActions(data.quick_actions.map((qa: string, idx: number) => ({
                id: `qa-${Date.now()}-${idx}`,
                label: qa
              })));
            }, 800);
          }
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
      const emoji = config?.vitalSigns?.find(v => v.id === key)?.emoji || "📊";
      const displayValue = value === true ? "Yes" : value === false ? "No" : value;
      summaryParts.push(`${emoji} ${label}: ${displayValue}`);
    });

    const summaryText = summaryParts.join(" • ");

    setMessages((prev) => [
      ...prev,
      {
        id: `user-log-${Date.now()}`,
        type: "user",
        content: summaryText,
        timestamp: new Date(),
      },
    ]);

    setIsTyping(true);

    try {
      const token = localStorage.getItem("sessionToken");
      const res = await fetch(`${API_BASE_URL}/api/chat/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          coachId: parseInt(coachId!),
          logData: data,
          summaryText: summaryText
        })
      });

      if (res.ok) {
        const result = await res.json();
        const analysis = result.analysis;

        // Inject emojis into feedback
        if (analysis.vital_sign_feedback) {
          analysis.vital_sign_feedback = analysis.vital_sign_feedback.map((item: any) => {
            // Try to find matching tracking config
            const tracking = config!.vitalSigns.find(v =>
              v.name.toLowerCase() === item.label.toLowerCase() ||
              v.id.toLowerCase() === item.label.toLowerCase()
            );
            return {
              ...item,
              emoji: tracking?.emoji || "📊",
              unit: tracking?.type === 'number' || tracking?.type === 'slider' ? tracking.unit : undefined
            };
          });
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

  const [inputHeight, setInputHeight] = useState(60); // Default height

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
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <ChatHeader config={config} onSettingsClick={() => setSettingsOpen(true)} />

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 overscroll-y-contain touch-pan-y">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {(() => {
              let lastDate: string | null = null;
              return messages.map((message, index) => {
                const messageDate = new Date(message.timestamp);
                const dateKey = messageDate.toDateString();
                const showDateLabel = lastDate !== dateKey;
                lastDate = dateKey;

                return (
                  <div key={message.id}>
                    {showDateLabel && <DateLabel date={messageDate} />}
                    <ChatMessage
                      message={message}
                      coachEmoji={config.persona?.emoji}
                      onFormSubmit={handleFormSubmit}
                      disabled={index !== messages.length - 1} // Only enable form if it's the last message
                    />
                  </div>
                );
              });
            })()}
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

      {/* Input - In Flow, not fixed */}
      <div className="z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput onSend={handleSendMessage} onHeightChange={setInputHeight} />
      </div>

      {/* Settings sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
      />
    </div>
  );
}

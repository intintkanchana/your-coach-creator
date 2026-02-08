import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { MiniAppForm } from "./MiniAppForm";
import { TipBubble } from "./TipBubble";

interface ChatMessageProps {
  message: ChatMessageType;
  coachEmoji?: string;
  onFormSubmit?: (messageId: string, data: Record<string, number | boolean | string>) => void;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, coachEmoji = "🌟", onFormSubmit }, ref) => {
    const isCoach = message.type === "coach" || message.type === "form" || message.type === "tip" || message.type === "image";
    const isSystem = message.type === "system";

    // System message
    if (isSystem) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-3"
        >
          <span className="text-xs text-chat-system bg-muted/50 px-3 py-1 rounded-full">
            {message.content}
          </span>
        </motion.div>
      );
    }

    // Tip message
    if (message.type === "tip") {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 max-w-[85%]"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm">{coachEmoji}</span>
          </div>
          <div className="flex-1">
            <TipBubble content={message.content} />
          </div>
        </motion.div>
      );
    }

    // Image message
    if (message.type === "image" && message.imageUrl) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 max-w-[85%]"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm">{coachEmoji}</span>
          </div>
          <div className="flex-1 space-y-2">
            {message.content && (
              <div className="bg-chat-coach text-chat-coach-foreground rounded-2xl rounded-tl-md px-4 py-3 shadow-soft">
                <p className="text-sm">{message.content}</p>
              </div>
            )}
            <img
              src={message.imageUrl}
              alt={message.imageAlt || "Coach shared image"}
              className="rounded-xl max-w-full shadow-soft"
            />
          </div>
        </motion.div>
      );
    }

    // Form message
    if (message.type === "form" && message.formFields) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3 max-w-[85%]"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm">{coachEmoji}</span>
          </div>
          <div className="flex-1 space-y-3">
            {message.content && (
              <div className="bg-chat-coach text-chat-coach-foreground rounded-2xl rounded-tl-md px-4 py-3 shadow-soft">
                <p className="text-sm">{message.content}</p>
              </div>
            )}
            <MiniAppForm
              fields={message.formFields}
              submitted={message.formSubmitted || false}
              submittedData={message.formData}
              onSubmit={(data) => onFormSubmit?.(message.id, data)}
            />
          </div>
        </motion.div>
      );
    }

    // Coach message
    if (isCoach) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 max-w-[85%]"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-chat-highlight/20 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm">{coachEmoji}</span>
          </div>
          <div className="bg-chat-coach text-chat-coach-foreground rounded-2xl rounded-tl-md px-4 py-3 shadow-soft">
            <p className="text-sm">{message.content}</p>
          </div>
        </motion.div>
      );
    }

    // User message
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end"
      >
        <div className="bg-chat-user text-chat-user-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-soft">
          <p className="text-sm">{message.content}</p>
        </div>
      </motion.div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onHeightChange?: (height: number) => void;
}

export function ChatInput({ onSend, disabled, onHeightChange }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate scrollHeight for shrinking
      textareaRef.current.style.height = "auto";
      // Set height based on scrollHeight, capped at max-height via CSS or logic
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 150);
      textareaRef.current.style.height = `${newHeight}px`;

      // Only show scrollbar if content exceeds visible height
      textareaRef.current.style.overflowY = scrollHeight > newHeight ? "auto" : "hidden";

      if (onHeightChange) {
        onHeightChange(newHeight);
      }
    }
  }, [message, onHeightChange]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      // Reset height immediately after send
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="w-full bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3"
    >
      <div className="flex items-end gap-2 max-w-3xl mx-auto">

        {/* Textarea for multiline input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none overflow-hidden scrollbar-minimal min-h-[40px] max-h-[150px] rounded-2xl border border-border/50 bg-muted/30 px-4 py-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 block"
          />
        </div>

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="h-10 w-10 rounded-full shrink-0 mb-[1px]" // Align with bottom of textarea
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </motion.form>
  );
}

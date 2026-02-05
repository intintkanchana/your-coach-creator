import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Camera } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="w-full bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3"
    >
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        {/* Attachment buttons */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>

        {/* Input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 rounded-full border-border/50 bg-muted/30 px-4 focus-visible:ring-primary/50"
        />

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="h-10 w-10 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </motion.form>
  );
}

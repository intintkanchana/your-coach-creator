import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface TipBubbleProps {
  content: string;
}

export function TipBubble({ content }: TipBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-chat-highlight/20 to-primary/10 rounded-2xl p-4 border border-chat-highlight/30"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-chat-highlight/30 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Pro Tip
          </span>
          <p className="text-sm text-foreground mt-1">{content}</p>
        </div>
      </div>
    </motion.div>
  );
}

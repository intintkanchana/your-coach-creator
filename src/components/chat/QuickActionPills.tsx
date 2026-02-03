import { motion, AnimatePresence } from "framer-motion";
import { QuickAction } from "@/types/chat";

interface QuickActionPillsProps {
  actions: QuickAction[];
  onSelect: (action: QuickAction) => void;
}

export function QuickActionPills({ actions, onSelect }: QuickActionPillsProps) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex flex-wrap gap-2 px-4 pb-2"
    >
      <AnimatePresence>
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(action)}
            className="px-4 py-2 bg-chat-user text-chat-user-foreground rounded-full text-sm font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            {action.label}
          </motion.button>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

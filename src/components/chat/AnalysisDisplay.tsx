import { AnalysisData } from "@/types/chat";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Star, Quote } from "lucide-react";

interface AnalysisDisplayProps {
    data: AnalysisData;
}

export function AnalysisDisplay({ data }: AnalysisDisplayProps) {
    return (
        <div className="space-y-6 w-full max-w-2xl bg-card border-2 border-muted p-6 rounded-2xl shadow-sm">
            {/* Summary Impression */}
            {data.summary_impression && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm font-medium text-foreground leading-relaxed"
                >
                    {data.summary_impression}
                </motion.div>
            )}

            {/* Vital Sign Feedback Grid */}
            {data.vital_sign_feedback && data.vital_sign_feedback.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                    {data.vital_sign_feedback.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                            className="bg-background border border-border/50 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1 flex items-center gap-1">
                                    {item.emoji && <span className="text-sm">{item.emoji}</span>}
                                    {item.label}
                                </span>
                                <span className="bg-primary/10 text-primary text-sm font-bold px-2 py-1 rounded-md">
                                    {item.value === true ? 'Yes' : item.value === false ? 'No' : item.value}
                                    {item.unit && <span className="text-xs ml-1 font-normal opacity-70">{item.unit}</span>}
                                </span>
                            </div>
                            <p className="text-sm text-card-foreground leading-snug">
                                {item.comment}
                            </p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Deep Dive Insights */}
            {data.deep_dive_insights && data.deep_dive_insights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide">
                        <Star className="w-4 h-4" />
                        <h3>Deep Dive Insights</h3>
                    </div>
                    <div className="space-y-3 pl-2 border-l-2 border-primary/20 ml-1">
                        {data.deep_dive_insights.map((insight, idx) => (
                            <div key={idx} className="relative pl-4">
                                <p className="text-sm text-foreground/90 leading-relaxed">
                                    {insight}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Next Action Items */}
            {data.next_action_items && data.next_action_items.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-semibold text-sm uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4" />
                        <h3>Next Actions</h3>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 space-y-3 border border-emerald-100 dark:border-emerald-900/50">
                        {data.next_action_items.map((action, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                className="flex gap-3 items-start"
                            >
                                <div className="mt-1 min-w-4 max-w-4 text-emerald-600 dark:text-emerald-500">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                                <p className="text-sm text-foreground/90 leading-relaxed">
                                    {action}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Closing Phrase */}
            {data.closing_phrase && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center pt-2"
                >
                    <div className="flex gap-2 items-center text-muted-foreground italic text-sm">
                        <Quote className="w-3 h-3 text-primary/40 rotate-180" />
                        <span>{data.closing_phrase}</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

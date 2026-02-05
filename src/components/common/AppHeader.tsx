import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
    children: ReactNode;
    className?: string;
    maxWidth?: "2xl" | "3xl" | "4xl" | "full";
}

export function AppHeader({ children, className, maxWidth = "3xl" }: AppHeaderProps) {
    const maxWidthClass = {
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "full": "w-full",
    }[maxWidth];

    return (
        <header className={cn("sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3", className)}>
            <div className={cn("mx-auto flex items-center justify-between", maxWidthClass)}>
                {children}
            </div>
        </header>
    );
}

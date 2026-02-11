import { cn } from "@/lib/utils";

interface DividerProps {
    className?: string;
}

/**
 * Atom: Divider
 *
 * Gradient horizontal line for separating sections.
 * Fades from transparent → subtle → transparent.
 */
export function Divider({ className }: DividerProps) {
    return (
        <div
            className={cn(
                "h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent",
                className,
            )}
            role="separator"
        />
    );
}

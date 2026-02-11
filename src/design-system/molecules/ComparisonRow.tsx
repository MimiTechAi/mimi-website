"use client";

import { cn } from "@/lib/utils";

interface ComparisonRowProps {
    feature: string;
    mimiValue: string;
    otherValue: string;
    className?: string;
}

/**
 * Molecule: ComparisonRow
 *
 * Table row for the USP comparison table.
 * MiMi column uses green checkmark, Others use gray X.
 */
export function ComparisonRow({
    feature,
    mimiValue,
    otherValue,
    className,
}: ComparisonRowProps) {
    return (
        <tr className={cn("transition-colors duration-150 hover:bg-white/[0.03]", className)}>
            <td className="border-b border-white/5 px-4 py-3 text-sm">{feature}</td>
            <td className="border-b border-white/5 px-4 py-3 text-sm font-bold text-[#76B900]">
                ✓ {mimiValue}
            </td>
            <td className="border-b border-white/5 px-4 py-3 text-sm text-[hsl(220,5%,50%)]">
                ✗ {otherValue}
            </td>
        </tr>
    );
}

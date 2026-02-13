import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    noBorder?: boolean;
}

export const GlassCard = ({ children, className = '', noBorder = false }: GlassCardProps) => {
    return (
        <div
            className={`
        relative overflow-hidden rounded-xl 
        bg-[rgba(8,12,25,0.65)] backdrop-blur-[40px] saturate-[1.2]
        ${noBorder ? '' : 'border border-[rgba(0,212,255,0.12)]'}
        shadow-[inset_0_1px_0_rgba(147,197,253,0.06),0_4px_16px_rgba(0,0,0,0.4),0_0_30px_rgba(0,212,255,0.03)]
        ${className}
      `}
        >
            {children}
        </div>
    );
};

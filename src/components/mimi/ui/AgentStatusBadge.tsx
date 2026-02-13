import React from 'react';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'paused' | 'error';

interface AgentStatusBadgeProps {
    status: AgentStatus;
    label?: string;
}

export const AgentStatusBadge = ({ status, label }: AgentStatusBadgeProps) => {
    const getStatusColor = (s: AgentStatus) => {
        switch (s) {
            case 'idle': return 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]';
            case 'thinking': return 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]';
            case 'working': return 'bg-sky-400 animate-spin-slow';
            case 'paused': return 'bg-slate-400 opacity-60';
            case 'error': return 'bg-red-500';
            default: return 'bg-cyan-500';
        }
    };

    const getStatusText = (s: AgentStatus) => {
        if (label) return label;
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(0,0,0,0.4)] border border-[rgba(0,212,255,0.1)]">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
            <span className="text-[10px] font-medium text-cyan-100/70 tracking-wide uppercase">
                {getStatusText(status)}
            </span>
        </div>
    );
};

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { AgentEvent, getAgentEventBus, AgentEventType } from '@/lib/mimi/agent-events';
import { Terminal, CheckCircle2, XCircle, Loader2, BrainCircuit, Activity } from 'lucide-react';

interface FeedItem {
    id: string;
    timestamp: number;
    type: AgentEventType;
    title: string;
    description?: string;
    status: 'pending' | 'active' | 'success' | 'error';
    agent?: string;
}

export function AgentActionFeed() {
    const [items, setItems] = useState<FeedItem[]>([]);
    const feedEndRef = useRef<HTMLDivElement>(null);
    const bus = getAgentEventBus();

    // Auto-scroll to bottom
    useEffect(() => {
        if (feedEndRef.current) {
            feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [items]);

    useEffect(() => {
        // Load initial snapshot
        const snapshot = bus.getSnapshot();
        const initialItems = processEvents(snapshot);
        setItems(initialItems);

        // Subscribe to new events
        const unsubscribe = bus.onAll((event: AgentEvent) => {
            setItems(prev => {
                const newItems = [...prev];

                if (event.type === 'PLAN_START') {
                    newItems.push({
                        id: event.planId || `evt-\${event.timestamp}`,
                        timestamp: event.timestamp,
                        type: event.type,
                        title: `Plan Initiated: \${(event.payload as any).title}`,
                        status: 'active'
                    });
                } else if (event.type === 'PLAN_STEP_ADD') {
                    const p = event.payload as any;
                    newItems.push({
                        id: p.stepId,
                        timestamp: event.timestamp,
                        type: event.type,
                        title: `Queued: \${p.title}`,
                        description: p.description,
                        status: 'pending'
                    });
                } else if (event.type === 'STEP_START') {
                    const p = event.payload as any;
                    const existingIdx = newItems.findIndex(i => i.id === p.stepId);
                    if (existingIdx >= 0) {
                        newItems[existingIdx].status = 'active';
                        newItems[existingIdx].timestamp = event.timestamp;
                    } else {
                        newItems.push({
                            id: p.stepId || `evt-\${event.timestamp}`,
                            timestamp: event.timestamp,
                            type: event.type,
                            title: `Step Started: \${p.title}`,
                            status: 'active'
                        });
                    }
                } else if (event.type === 'STEP_COMPLETE') {
                    const p = event.payload as any;
                    const existingIdx = newItems.findIndex(i => i.id === event.stepId);
                    if (existingIdx >= 0) {
                        newItems[existingIdx].status = 'success';
                        newItems[existingIdx].description = `Completed in \${p.duration}ms`;
                        newItems[existingIdx].timestamp = event.timestamp;
                    }
                } else if (event.type === 'STEP_FAIL') {
                    const p = event.payload as any;
                    const existingIdx = newItems.findIndex(i => i.id === event.stepId);
                    if (existingIdx >= 0) {
                        newItems[existingIdx].status = 'error';
                        newItems[existingIdx].description = `Error: \${p.error}`;
                        newItems[existingIdx].timestamp = event.timestamp;
                    }
                } else if (event.type === 'STATUS_CHANGE') {
                    const p = event.payload as any;
                    newItems.push({
                        id: `evt-\${event.timestamp}`,
                        timestamp: event.timestamp,
                        type: event.type,
                        title: `System Status: \${p.status}`,
                        agent: p.agent,
                        status: 'success'
                    });
                }

                // Keep only the last 30 items
                return newItems.slice(-30);
            });
        });

        return () => unsubscribe();
    }, []);

    const processEvents = (events: AgentEvent[]): FeedItem[] => {
        // Simplified processing of snapshot events for immediate render
        const initial: FeedItem[] = [];
        events.forEach(e => {
            if (e.type === 'STATUS_CHANGE') {
                const p = e.payload as any;
                initial.push({
                    id: `evt-\${e.timestamp}`,
                    timestamp: e.timestamp,
                    type: e.type,
                    title: `System Status: \${p.status}`,
                    agent: p.agent,
                    status: 'success'
                });
            }
        });
        return initial.slice(-30);
    };

    const renderIcon = (item: FeedItem) => {
        if (item.status === 'success') return <CheckCircle2 size={14} className="text-emerald-400" />;
        if (item.status === 'error') return <XCircle size={14} className="text-red-400" />;
        if (item.status === 'active') return <Loader2 size={14} className="text-blue-400 animate-spin" />;
        return <Activity size={14} className="text-white/40" />;
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-white/30 text-xs h-full italic">
                <BrainCircuit size={24} className="mb-2 opacity-20" />
                <span>Waiting for agent events...</span>
            </div>
        );
    }

    return (
        <div className="agent-action-feed flex flex-col p-4 gap-2 h-full overflow-y-auto">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Terminal size={12} />
                Live Action Feed
            </h3>

            <div className="flex flex-col gap-1.5 flex-1 w-full">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`feed-item p-2.5 rounded-lg border \${
                            item.status === 'active' ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' :
                            item.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/10' :
                            item.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                            'bg-white/[0.02] border-white/[0.05]'
                        } flex items-start gap-3 transition-colors duration-300 w-full overflow-hidden`}
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            {renderIcon(item)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                <span className="text-xs font-medium text-white/90 truncate">
                                    {item.title}
                                </span>
                                {item.agent && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0">
                                        {item.agent}
                                    </span>
                                )}
                            </div>

                            {item.description && (
                                <p className="text-[11px] text-white/50 mt-1 truncate">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={feedEndRef} />
            </div>
        </div>
    );
}

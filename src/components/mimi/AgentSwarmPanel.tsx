"use client";

/**
 * Agent Swarm Panel - Live Multi-Agent Visualization
 *
 * Visualizes the Mixture-of-Agents orchestration in real-time.
 * Shows active agents, inter-agent communication, and consensus voting.
 *
 * Inspired by Genspark's multi-model visualization.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JSX } from 'react';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface AgentNode {
    id: string;
    name: string;
    status: 'idle' | 'active' | 'verifying' | 'done';
    x: number;
    y: number;
    color: string;
}

interface AgentMessage {
    from: string;
    to: string;
    message: string;
    timestamp: number;
}

interface ConsensusVote {
    agentId: string;
    vote: string;
    confidence: number;
}

export interface AgentSwarmPanelProps {
    activeAgents: string[];
    messages?: AgentMessage[];
    consensusVotes?: ConsensusVote[];
    className?: string;
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const AGENT_COLORS: Record<string, string> = {
    'data-analyst': '#60a5fa',      // Blue
    'code-expert': '#34d399',       // Green
    'document-expert': '#fbbf24',   // Amber
    'creative-writer': '#f472b6',   // Pink
    'research-agent': '#a78bfa',    // Purple
    'web-researcher': '#00d4ff',    // Cyan (primary)
    'code-reviewer': '#22c55e',     // Emerald
    'math-specialist': '#8b5cf6',   // Violet
    'creative-storyteller': '#ec4899', // Fuchsia
    'verifier': '#ef4444',          // Red
    'orchestrator': '#c0c8d8'       // Silver
};

const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
    'orchestrator': { x: 200, y: 150 },
    'verifier': { x: 200, y: 50 },
    'data-analyst': { x: 50, y: 100 },
    'code-expert': { x: 350, y: 100 },
    'document-expert': { x: 50, y: 200 },
    'creative-writer': { x: 350, y: 200 },
    'research-agent': { x: 100, y: 250 },
    'web-researcher': { x: 300, y: 250 },
    'code-reviewer': { x: 100, y: 50 },
    'math-specialist': { x: 300, y: 50 },
    'creative-storyteller': { x: 200, y: 250 },
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function AgentSwarmPanel({
    activeAgents,
    messages = [],
    consensusVotes = [],
    className = ''
}: AgentSwarmPanelProps) {
    const [nodes, setNodes] = useState<AgentNode[]>([]);
    const [recentMessages, setRecentMessages] = useState<AgentMessage[]>([]);
    const canvasRef = useRef<SVGSVGElement>(null);

    // Initialize agent nodes
    useEffect(() => {
        const allAgents = [
            'orchestrator',
            'verifier',
            ...activeAgents
        ].filter((a, i, arr) => arr.indexOf(a) === i); // Deduplicate

        const agentNodes: AgentNode[] = allAgents.map(agentId => {
            const pos = AGENT_POSITIONS[agentId] || { x: 200, y: 150 };
            const status = activeAgents.includes(agentId) ? 'active' : 'idle';

            return {
                id: agentId,
                name: agentId
                    .split('-')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' '),
                status,
                x: pos.x,
                y: pos.y,
                color: AGENT_COLORS[agentId] || '#94a3b8'
            };
        });

        setNodes(agentNodes);
    }, [activeAgents]);

    // Track recent messages (last 5)
    useEffect(() => {
        if (messages.length > 0) {
            setRecentMessages(messages.slice(-5));
        }
    }, [messages]);

    // Draw connections between active agents
    const renderConnections = () => {
        const connections: JSX.Element[] = [];

        // Connect all active agents to orchestrator
        const orchestrator = nodes.find(n => n.id === 'orchestrator');
        if (!orchestrator) return connections;

        activeAgents.forEach((agentId, idx) => {
            const agent = nodes.find(n => n.id === agentId);
            if (!agent || agent.id === 'orchestrator') return;

            connections.push(
                <motion.line
                    key={`conn-${agentId}`}
                    x1={orchestrator.x}
                    y1={orchestrator.y}
                    x2={agent.x}
                    y2={agent.y}
                    stroke={agent.color}
                    strokeWidth="2"
                    strokeOpacity="0.3"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                />
            );
        });

        // Draw message paths
        recentMessages.forEach((msg, idx) => {
            const from = nodes.find(n => n.id === msg.from);
            const to = nodes.find(n => n.id === msg.to);
            if (!from || !to) return;

            connections.push(
                <motion.line
                    key={`msg-${msg.timestamp}-${idx}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#00d4ff"
                    strokeWidth="3"
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                />
            );
        });

        return connections;
    };

    return (
        <div
            className={`agent-swarm-panel relative h-full bg-gradient-to-br from-[rgba(8,12,24,0.4)] to-[rgba(14,20,36,0.5)] rounded-xl border border-white/5 p-6 ${className}`}
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white/90">
                        Agent Swarm <span className="text-white/50 font-normal">({activeAgents.length} active)</span>
                    </h3>
                </div>
                <div className="text-xs text-white/40">
                    Mixture-of-Agents
                </div>
            </div>

            {/* SVG Canvas */}
            <svg
                ref={canvasRef}
                className="w-full h-[280px]"
                viewBox="0 0 400 300"
                style={{ overflow: 'visible' }}
            >
                {/* Connections */}
                <g className="connections">
                    {renderConnections()}
                </g>

                {/* Agent Nodes */}
                <AnimatePresence>
                    {nodes.map(node => (
                        <g key={node.id} className="agent-node">
                            {/* Glow Effect */}
                            {node.status === 'active' && (
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r="20"
                                    fill={node.color}
                                    opacity="0.2"
                                    initial={{ r: 15, opacity: 0 }}
                                    animate={{
                                        r: [15, 25, 15],
                                        opacity: [0, 0.3, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                />
                            )}

                            {/* Node Circle */}
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r="12"
                                fill={node.status === 'active' ? node.color : 'rgba(148,163,184,0.2)'}
                                stroke={node.color}
                                strokeWidth="2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            />

                            {/* Status Indicator */}
                            {node.status === 'active' && (
                                <motion.circle
                                    cx={node.x + 8}
                                    cy={node.y - 8}
                                    r="3"
                                    fill="#22c55e"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [1, 0.7, 1]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity
                                    }}
                                />
                            )}

                            {/* Label */}
                            <text
                                x={node.x}
                                y={node.y + 25}
                                textAnchor="middle"
                                className="text-[9px] fill-white/70 font-medium pointer-events-none"
                                style={{ userSelect: 'none' }}
                            >
                                {node.name.split(' ').map((word, i) => (
                                    <tspan key={i} x={node.x} dy={i === 0 ? 0 : 10}>
                                        {word}
                                    </tspan>
                                ))}
                            </text>
                        </g>
                    ))}
                </AnimatePresence>
            </svg>

            {/* Status Bar */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-green-400" />
                            <span className="text-white/60">{activeAgents.length} Active</span>
                        </div>
                        {consensusVotes.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                                <span className="text-white/60">{consensusVotes.length} Voting</span>
                            </div>
                        )}
                    </div>
                    <div className="text-white/40">
                        Multi-Agent Orchestration
                    </div>
                </div>
            </div>

            {/* Consensus Votes (if any) */}
            {consensusVotes.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                    <div className="text-xs font-semibold text-white/80 mb-2">
                        Consensus Voting
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {consensusVotes.map((vote, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-[10px]"
                            >
                                <div
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: AGENT_COLORS[vote.agentId] || '#94a3b8' }}
                                />
                                <span className="text-white/60">{vote.vote}</span>
                                <span className="text-white/40">({Math.round(vote.confidence * 100)}%)</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export default AgentSwarmPanel;

import React from 'react';
import { GlassCard } from '@/components/mimi/ui/GlassCard';
import { AgentStatusBadge } from '@/components/mimi/ui/AgentStatusBadge';
import { ThinkingIndicator } from '@/components/mimi/ui/ThinkingIndicator';

// Mock Data
const agents = [
    { id: 1, name: 'Project Chimera', status: 'working', task: 'Optimizing data pipeline' },
    { id: 2, name: 'Code Analyst', status: 'idle', task: 'Waiting for input' },
    { id: 3, name: 'Data Miner', status: 'paused', task: 'Scheduled for 2 AM' },
    { id: 4, name: 'Market Research', status: 'working', task: 'Scraping competitor data' },
    { id: 5, name: 'Security Audit', status: 'idle', task: 'System check complete' },
    { id: 6, name: 'Report Gen', status: 'thinking', task: 'Drafting Q3 summary' },
];

const activity = [
    { id: 1, time: '12:45 PM', text: 'Data Analysis Completed for Chimera', icon: '📊' },
    { id: 2, time: '1:30 PM', text: 'Report Generated: Q3 Insights', icon: '📄' },
    { id: 3, time: '1:45 PM', text: 'Security Scan: No vulnerabilities', icon: '🛡️' },
    { id: 4, time: '2:15 PM', text: 'Market Research: 25 sources scraped', icon: '🌐' },
];

export default function DashboardPage() {
    return (
        <div className="p-6 h-full flex flex-col gap-6 text-cyan-50">

            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
                        Mimi Agent Hub
                    </h1>
                    <p className="text-sm text-cyan-100/50">System Status: Optimal • v2.0.4</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-all">
                        + New Agent
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">

                {/* Active Agents Grid (Left/Center) */}
                <div className="col-span-8 flex flex-col gap-6">

                    {/* Connection with GlassCard */}
                    <GlassCard className="flex-1 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-cyan-100">Active Agents</h2>
                            <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">6 Running</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 overflow-y-auto">
                            {agents.map((agent) => (
                                <div key={agent.id} className="p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(0,212,255,0.1)] hover:border-cyan-400/50 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                            {agent.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <AgentStatusBadge status={agent.status as any} />
                                    </div>
                                    <h3 className="text-sm font-medium text-cyan-50 mb-1 group-hover:text-cyan-300 transition-colors">{agent.name}</h3>
                                    <p className="text-[10px] text-cyan-200/50 truncate">{agent.task}</p>

                                    {/* Visualizer line */}
                                    <div className="mt-4 h-8 flex items-end gap-1 opacity-50">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-1 bg-cyan-500/50 rounded-t-sm transition-all duration-500 ${agent.status === 'working' ? 'animate-pulse' : ''}`}
                                                style={{ height: `${Math.random() * 100}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* System Status (Bottom Left) */}
                    <GlassCard className="h-48 p-6 flex gap-8 items-center">
                        <div className="flex-1 flex flex-col gap-2">
                            <h3 className="text-sm font-medium text-cyan-200/70">System Resources</h3>
                            <div className="flex gap-6 mt-2">
                                {/* Circular Progress Mockup */}
                                <div className="relative w-24 h-24 rounded-full border-4 border-[rgba(0,212,255,0.1)] flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="44" cy="44" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-cyan-500" strokeDasharray="251.2" strokeDashoffset="170" />
                                    </svg>
                                    <div className="text-center">
                                        <div className="text-xl font-bold">32%</div>
                                        <div className="text-[9px] text-cyan-200/50">CPU</div>
                                    </div>
                                </div>
                                <div className="relative w-24 h-24 rounded-full border-4 border-[rgba(0,212,255,0.1)] flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="44" cy="44" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-500" strokeDasharray="251.2" strokeDashoffset="90" />
                                    </svg>
                                    <div className="text-center">
                                        <div className="text-xl font-bold">64%</div>
                                        <div className="text-[9px] text-cyan-200/50">RAM</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-cyan-200/70 mb-3">Model Latency</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-cyan-100/50">Gemini 2.0</span>
                                    <span className="text-cyan-300">45ms</span>
                                </div>
                                <div className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                    <div className="bg-cyan-400 h-full w-[20%]" />
                                </div>

                                <div className="flex justify-between text-xs mt-2">
                                    <span className="text-cyan-100/50">Embedding</span>
                                    <span className="text-cyan-300">12ms</span>
                                </div>
                                <div className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                    <div className="bg-blue-400 h-full w-[10%]" />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Sidebar (Recent Activity) */}
                <div className="col-span-4 flex flex-col">
                    <GlassCard className="flex-1 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-semibold text-cyan-100 uppercase tracking-widest">Recent Activity</h2>
                            <button className="text-xs text-cyan-400 hover:text-cyan-200">View All</button>
                        </div>

                        <div className="space-y-4">
                            {activity.map((item) => (
                                <div key={item.id} className="flex gap-3 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors group">
                                    <div className="w-8 h-8 rounded-md bg-[rgba(0,212,255,0.05)] border border-cyan-500/20 flex items-center justify-center text-lg">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xs font-medium text-cyan-50 group-hover:text-cyan-300 transition-colors">{item.text}</h4>
                                        <span className="text-[10px] text-cyan-200/40">{item.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-3 p-3 rounded-lg opacity-50">
                                <div className="w-8 h-8 rounded-md bg-[rgba(0,212,255,0.05)] border border-cyan-500/10 flex items-center justify-center text-lg">
                                    🔄
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-medium text-cyan-50">System Update</h4>
                                    <span className="text-[10px] text-cyan-200/40">Yesterday</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

            </div>
        </div>
    );
}

import React from 'react';
import { GlassCard } from '@/components/mimi/ui/GlassCard';

export default function SettingsPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto text-cyan-50">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 mb-2">
                Agent Configuration
            </h1>
            <p className="text-sm text-cyan-200/50 mb-8">Customize how Mimi behaves and interacts with your environment.</p>

            <div className="grid gap-6">
                {/* Model Selection */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">🧠</span> Intelligence Model
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30 relative cursor-pointer hover:bg-cyan-500/20 transition-all">
                            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                            <h3 className="font-bold text-cyan-50">Gemini 2.0 Flash</h3>
                            <p className="text-xs text-cyan-200/60 mt-1">Recommended for speed & complex reasoning.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 opacity-70 hover:opacity-100 cursor-pointer transition-all">
                            <div className="absolute top-3 right-3 w-4 h-4 rounded-full border border-white/20"></div>
                            <h3 className="font-bold text-gray-200">Claude 3.5 Sonnet</h3>
                            <p className="text-xs text-gray-400 mt-1">Balanced performance for coding tasks.</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Tools & Permissions */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">🛡️</span> Tools & Permissions
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-300">🌐</div>
                                <div>
                                    <h4 className="text-sm font-medium text-cyan-50">Web Browsing</h4>
                                    <p className="text-[11px] text-cyan-200/40">Allow agent to search and read web pages</p>
                                </div>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-cyan-600 cursor-pointer">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-300">💻</div>
                                <div>
                                    <h4 className="text-sm font-medium text-cyan-50">Code Execution</h4>
                                    <p className="text-[11px] text-cyan-200/40">Allow agent to run terminal commands</p>
                                </div>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-cyan-600 cursor-pointer">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center text-orange-300">📁</div>
                                <div>
                                    <h4 className="text-sm font-medium text-cyan-50">File System Access</h4>
                                    <p className="text-[11px] text-cyan-200/40">Read/Write access to current workspace</p>
                                </div>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10 cursor-pointer">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* System Prompt */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">📝</span> System Persona
                    </h2>
                    <textarea
                        className="w-full h-32 bg-black/20 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-50 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                        defaultValue="You are Mimi, an advanced AI agent designed for autonomous coding and complex problem solving. You prefer efficient, clean code and modern aesthetics."
                    />
                    <div className="flex justify-end mt-3">
                        <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all">
                            Save Changes
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

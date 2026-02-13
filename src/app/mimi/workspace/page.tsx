import React from 'react';
import { GlassCard } from '@/components/mimi/ui/GlassCard';
import { AgentStatusBadge } from '@/components/mimi/ui/AgentStatusBadge';
import { ThinkingIndicator } from '@/components/mimi/ui/ThinkingIndicator';

export default function WorkspacePage() {
    return (
        <div className="flex w-full h-full text-cyan-50">

            {/* 3-Panel Layout (CSS Grid in global.css .mimi-workspace) */}
            <div className="mimi-workspace w-full h-full">

                {/* Left Panel: Context & Memory */}
                <div className="panel-left flex flex-col">
                    <div className="logo-row">
                        <div className="logo-avatar">M</div>
                        <h2 className="text-sm font-bold text-cyan-100">Mimi Agent</h2>
                    </div>

                    <div className="px-3 pb-2">
                        <div className="search-box">
                            <span className="icon">🔍</span>
                            <input type="text" placeholder="Search memory..." />
                        </div>
                    </div>

                    <div className="tasks-list">
                        <div className="task-item active">
                            <div className="task-dot dot-cyan" />
                            <div className="task-info">
                                <h4>Design Dashboard</h4>
                                <p>Current Task • 12m ago</p>
                            </div>
                        </div>
                        <div className="task-item">
                            <div className="task-dot dot-blue" />
                            <div className="task-info">
                                <h4>Analyze Requirements</h4>
                                <p>Completed • 1h ago</p>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-bottom">
                        <button className="new-thread-btn">+ New Thread</button>
                        <div className="user-row">
                            <div className="user-avatar">S</div>
                            <div>
                                <div className="user-name">Sanji</div>
                                <div className="user-plan">Pro Plan</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Chat Interface */}
                <div className="panel-center flex flex-col">
                    <div className="aurora-bar" />

                    <div className="status-pill-wrap">
                        <div className="status-pill">
                            <div className="pill-spinner"></div>
                            <span className="pill-label">STATUS:</span>
                            <span className="pill-value">WORKING</span>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {/* User Message */}
                        <div className="msg-user-wrap">
                            <div className="msg-user">
                                Create a high-fidelity dashboard for the new agent interface using a Silver/Cyan theme.
                            </div>
                            <div className="user-msg-avatar">S</div>
                        </div>

                        {/* Agent Message */}
                        <div className="msg-agent">
                            <div className="agent-dot">M</div>
                            <div className="agent-body">
                                <div className="agent-bubble">
                                    <div className="agent-text">
                                        <p>I'm on it. I'll design a dashboard that aligns with the "Silver/Cyan" aesthetic. Key elements will include:</p>
                                        <ul className="bullets">
                                            <li><b>Glassmorphic Panels</b> with cyan borders</li>
                                            <li><b>Neon Blue Accents</b> for active states</li>
                                            <li><b>Silver/White Text</b> for high contrast on dark backgrounds</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="agent-continue">
                                    <ThinkingIndicator />
                                    <span className="text-xs text-cyan-200/50 ml-2">Generating mockups...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="chat-input-bar">
                        <div className="input-row">
                            <input type="text" placeholder="Ask Mimi anything..." />
                            <button className="send-btn">➤</button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Artifacts / Sandbox */}
                <div className="panel-right flex flex-col">
                    <div className="sandbox-head">
                        <div className="sandbox-head-left">
                            <span className="sandbox-head-title">ARTIFACTS</span>
                            <span className="live-badge"><span className="live-dot" /> Live</span>
                        </div>
                        <div className="sandbox-head-actions">
                            <button>↗</button>
                            <button>×</button>
                        </div>
                    </div>

                    <div className="sandbox-tabs">
                        <button className="active" data-tab="browser">
                            <span className="tab-icon">🌐</span> Browser
                        </button>
                        <button data-tab="terminal">
                            <span className="tab-icon">💻</span> Terminal
                        </button>
                        <button data-tab="editor">
                            <span className="tab-icon">📝</span> Editor
                        </button>
                    </div>

                    <div className="sandbox-scroll">
                        <div className="sec-browser">
                            <div className="browser-frame h-64 bg-black/50 rounded-lg flex items-center justify-center border border-cyan-900/30">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">✨</div>
                                    <div className="text-sm text-cyan-200/50">Preview Loading...</div>
                                </div>
                            </div>
                        </div>

                        <div className="sec-terminal">
                            <div className="sec-label">System Logs</div>
                            <div className="terminal-box">
                                <div className="tline tline--cyan"><span className="prefix">➜</span> <span className="msg">Initializing render engine...</span></div>
                                <div className="tline tline--green"><span className="prefix">✔</span> <span className="msg">Assets loaded [23ms]</span></div>
                                <div className="tline"><span className="prefix">ℹ</span> <span className="msg">Applying theme: Silver/Cyan</span></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

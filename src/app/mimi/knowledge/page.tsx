"use client";

/**
 * MIMI Knowledge Base Page
 * Network graph visualization for stored knowledge
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import "@/styles/mimi-agent.css";

const CATEGORIES = ["Alle", "Architecture", "Data", "Security", "Models", "Infra"];

const KNOWLEDGE_NODES = [
    { id: 1, title: "Architecture Patterns", desc: "Microservices, event-driven design, CQRS patterns for scalable AI systems", cat: "Architecture", icon: "🏗️", color: "#3b82f6", bgColor: "rgba(59,130,246,0.12)" },
    { id: 2, title: "Data Processing", desc: "ETL pipelines, real-time processing, data lake solutions", cat: "Data", icon: "📊", color: "#22c55e", bgColor: "rgba(34,197,94,0.12)" },
    { id: 3, title: "Cost Optimization", desc: "Resource scaling, caching strategies, compute efficiency", cat: "Infra", icon: "💰", color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)" },
    { id: 4, title: "Model Management", desc: "Versioning, A/B testing, deployment strategies for ML models", cat: "Models", icon: "🤖", color: "#06b6d4", bgColor: "rgba(6,182,212,0.12)" },
    { id: 5, title: "Security & Privacy", desc: "Zero-trust architecture, data encryption, GDPR compliance", cat: "Security", icon: "🔒", color: "#ef4444", bgColor: "rgba(239,68,68,0.12)" },
    { id: 6, title: "API Design", desc: "RESTful patterns, GraphQL schemas, versioning strategies", cat: "Architecture", icon: "🔌", color: "#06b6d4", bgColor: "rgba(6,182,212,0.12)" },
    { id: 7, title: "Vector Databases", desc: "Embedding storage, similarity search, RAG pipeline optimization", cat: "Data", icon: "🗃️", color: "#22c55e", bgColor: "rgba(34,197,94,0.12)" },
    { id: 8, title: "Edge Computing", desc: "Local inference, WebGPU/WebLLM, on-device AI execution", cat: "Infra", icon: "⚡", color: "#f59e0b", bgColor: "rgba(245,158,11,0.12)" },
    { id: 9, title: "Fine-Tuning", desc: "LoRA, QLoRA, domain-specific model adaptation techniques", cat: "Models", icon: "🎯", color: "#3b82f6", bgColor: "rgba(59,130,246,0.12)" },
];

export default function KnowledgePage() {
    const [activeCategory, setActiveCategory] = useState("Alle");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredNodes = useMemo(() => {
        return KNOWLEDGE_NODES.filter(n => {
            if (activeCategory !== "Alle" && n.cat !== activeCategory) return false;
            if (searchQuery.trim()) return n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.desc.toLowerCase().includes(searchQuery.toLowerCase());
            return true;
        });
    }, [activeCategory, searchQuery]);

    return (
        <div className="knowledge-layout">
            {/* Left sidebar */}
            <div className="mimi-panel panel-left">
                <div className="logo-row">
                    <div className="logo-avatar">M</div>
                    <div className="search-box">
                        <span className="icon">🔍</span>
                        <input type="text" placeholder="Search Knowledge" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>}
                    </div>
                </div>
                <div className="tasks-list">
                    <div className="group-label">Categories</div>
                    {CATEGORIES.map(cat => (
                        <div key={cat} className={`task-item ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                            <div className="task-info"><h4>{cat}</h4><p>{cat === "Alle" ? KNOWLEDGE_NODES.length : KNOWLEDGE_NODES.filter(n => n.cat === cat).length} items</p></div>
                        </div>
                    ))}
                </div>
                <div className="panel-left-nav">
                    <Link href="/mimi" title="Chat">💬</Link>
                    <Link href="/mimi/knowledge" className="nav-active" title="Knowledge Base">🧠</Link>
                    <Link href="/mimi/settings" title="Settings">⚙️</Link>
                </div>
            </div>

            {/* Main area */}
            <div className="knowledge-main">
                <div className="knowledge-header">
                    <h2>🧠 Knowledge Base</h2>
                    <div className="knowledge-tabs">
                        {CATEGORIES.map(cat => (
                            <button key={cat} className={activeCategory === cat ? "active" : ""} onClick={() => setActiveCategory(cat)}>{cat}</button>
                        ))}
                    </div>
                </div>
                <div className="knowledge-graph">
                    {filteredNodes.map(node => (
                        <div key={node.id} className="knowledge-node">
                            <div className="knowledge-node-icon" style={{ background: node.bgColor }}>{node.icon}</div>
                            <h4>{node.title}</h4>
                            <p>{node.desc}</p>
                            <span className="knowledge-node-tag" style={{ background: node.bgColor, color: node.color }}>{node.cat}</span>
                        </div>
                    ))}
                    {filteredNodes.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                            <p style={{ fontSize: '13px' }}>Keine Knowledge-Nodes gefunden</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

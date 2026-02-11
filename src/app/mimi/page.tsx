"use client";

/**
 * MIMI Agent PWA - Hauptseite V2.0
 *
 * Refactored: All engine logic extracted to useMimiEngine hook.
 * This page component handles only rendering and layout.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MimiAgentChat from "@/components/mimi/MimiChat";
import ModelLoading from "@/components/mimi/ModelLoading";
import UnsupportedBrowser from "@/components/mimi/UnsupportedBrowser";
import { ErrorBoundary } from "@/components/mimi/ErrorBoundary";
import { useMimiEngine } from "@/hooks/useMimiEngine";

export default function MimiPage() {
    const engine = useMimiEngine();

    return (
        <main className="min-h-screen bg-black">
            {/* Gradient Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-cyan/10 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
                {/* Back to Main Site */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-brand-cyan transition-colors duration-300 mb-6 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Zurück zu MiMi Tech AI
                </Link>
                {/* Hardware Check */}
                {engine.state === "checking" && (
                    <ModelLoading
                        progress={10}
                        status={engine.loadingStatus}
                        isFirstTime={true}
                    />
                )}

                {/* Unsupported Browser */}
                {engine.state === "unsupported" && (
                    <UnsupportedBrowser error={engine.error} />
                )}

                {/* Loading Model */}
                {engine.state === "loading" && (
                    <ModelLoading
                        progress={engine.loadingProgress}
                        status={engine.loadingStatus}
                        modelSize={engine.deviceProfile?.modelSize}
                        isFirstTime={engine.loadingProgress < 50}
                    />
                )}

                {/* Error State */}
                {engine.state === "error" && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                            <span className="text-4xl">😔</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Etwas ist schiefgelaufen
                        </h2>
                        <p className="text-white/60 max-w-md mb-6">{engine.error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            Seite neu laden
                        </button>
                    </div>
                )}

                {/* Ready - Agent Chat */}
                {engine.state === "ready" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl md:text-4xl font-bold text-white mb-2"
                            >
                                🧠 MIMI Agent
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-white/50"
                            >
                                Souveräne Intelligenz • Denkt, plant & handelt • 100% Lokal
                            </motion.p>

                            {/* Capability Badges */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap justify-center gap-2 mt-4"
                            >
                                <Badge active={true}>✓ Chain-of-Thought</Badge>
                                <Badge active={engine.isVoiceReady}>
                                    {engine.isVoiceReady ? '✓' : '○'} Sprache
                                </Badge>
                                <Badge active={engine.isPythonReady}>
                                    {engine.isPythonReady ? '✓' : '○'} Python
                                </Badge>
                                <Badge active={true}>✓ Dokumente</Badge>
                            </motion.div>
                        </div>

                        {/* Chat Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                            style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}
                        >
                            <ErrorBoundary>
                                <MimiAgentChat
                                    onSendMessage={engine.handleSendMessage}
                                    isReady={true}
                                    isGenerating={engine.isGenerating}
                                    agentStatus={engine.agentStatus}
                                    onClearChat={engine.handleClearChat}
                                    onVoiceInput={engine.isVoiceReady ? engine.handleVoiceInput : undefined}
                                    isRecording={engine.isRecording}
                                    onExecuteCode={engine.isPythonReady ? engine.handleExecuteCode : undefined}
                                    onDownloadArtifact={engine.handleDownloadArtifact}
                                    onSpeak={engine.isVoiceReady ? engine.handleSpeak : undefined}
                                    isSpeaking={engine.isSpeaking}
                                    interimText={engine.interimText}
                                    currentLanguage={engine.currentLanguage}
                                    onLanguageChange={engine.isVoiceReady ? engine.handleLanguageChange : undefined}
                                    voiceTranscript={engine.voiceTranscript}
                                    onVoiceTranscriptHandled={() => engine.setVoiceTranscript("")}
                                    onPDFUpload={engine.handlePDFUpload}
                                    uploadedDocuments={engine.uploadedDocuments}
                                    isUploadingPDF={engine.isUploadingPDF}
                                    onDeleteDocument={engine.handleDeleteDocument}
                                    onImageUpload={engine.handleImageUpload}
                                    uploadedImage={engine.uploadedImage}
                                    isVisionReady={engine.isVisionReady}
                                    memoryUsageMB={engine.memoryUsageMB}
                                    isMemoryWarning={engine.isMemoryWarning}
                                    onUnloadVision={engine.isVisionReady ? engine.handleUnloadVision : undefined}
                                    onStopGeneration={engine.handleStopGeneration}
                                />
                            </ErrorBoundary>
                        </motion.div>

                        {/* Footer */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center text-white/30 text-xs mt-4"
                        >
                            Powered by WebGPU • Modell: {(engine.loadedModel || engine.deviceProfile?.model)?.split("-").slice(0, 3).join(" ")}
                        </motion.p>
                    </motion.div>
                )}
            </div>
        </main>
    );
}

// Badge Component
function Badge({ children, active }: { children: React.ReactNode; active: boolean }) {
    return (
        <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
      ${active
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-white/5 border border-white/10 text-white/40'}
    `}>
            {children}
        </span>
    );
}

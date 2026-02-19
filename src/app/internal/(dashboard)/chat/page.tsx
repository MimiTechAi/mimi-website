"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, FileText, Image, Download, Bell, BellOff, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import { useChat, useInternalUsers } from "@/hooks/use-local-data";

export default function ChatPage() {
  const [messageInput, setMessageInput] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 🔥 Local-first: Reactive data from IndexedDB — no polling, no API calls
  const { messages, actions: chatActions } = useChat('general');
  const { users } = useInternalUsers();

  // Use first user as current user (in real app, from auth)
  const currentUser = users.length > 0 ? users[0] : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((messageInput.trim() || pendingFile) && currentUser) {
      const content = messageInput.trim() || (pendingFile ? `Datei angehängt: ${pendingFile.name}` : "");

      await chatActions.send({
        user: currentUser.name,
        content,
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        type: pendingFile ? "file" : "text",
        fileName: pendingFile?.name,
        fileSize: pendingFile ? formatFileSize(pendingFile.size) : undefined,
        isOnline: true,
      });

      setMessageInput("");
      setPendingFile(null);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && currentUser) {
      const file = acceptedFiles[0];
      setPendingFile(file);
      toast.info("Datei bereit zum Senden", {
        description: `${file.name} (${formatFileSize(file.size)})`,
        duration: 5000,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    maxSize: 10485760,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    }
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " Bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const onlineUsersCount = users.filter(user => user.isOnline).length;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Team Chat <Sparkles className="text-brand-cyan h-6 w-6" />
          </h1>
          <p className="mt-1 text-muted-foreground">
            Echtzeit-Kommunikation mit Ihrem Team
          </p>
        </div>
      </div>

      <div className="flex-1 relative perspective-container" {...getRootProps()}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-nvidia-green/5 rounded-3xl blur-xl" />

        <SpotlightCard className="glass-premium border-none h-[calc(100vh-250px)] flex flex-col relative z-10 overflow-hidden shadow-2xl group">
          <div className="card-gradient-overlay" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="border-b border-white/10 bg-white/5 backdrop-blur-md p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-green-500 blur-sm opacity-50" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">General Channel</h2>
                    <p className="text-xs text-gray-400">{onlineUsersCount} Mitglieder online</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="hover:bg-white/10 rounded-full transition-colors"
                  aria-label={notificationsEnabled ? "Benachrichtigungen deaktivieren" : "Benachrichtigungen aktivieren"}
                >
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-brand-cyan" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isCurrentUser = msg.user === currentUser?.name;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start gap-4 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10 border-2 border-white/10 shadow-lg">
                            <AvatarImage src={msg.avatar} alt={msg.user} />
                            <AvatarFallback className={`text-white font-medium ${isCurrentUser ? 'bg-brand-cyan' : 'bg-nvidia-green'}`}>
                              {msg.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {msg.isOnline && (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                          )}
                        </div>

                        <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-baseline gap-2 mb-1 px-1">
                            <span className="font-medium text-sm text-foreground/90">{msg.user}</span>
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>

                          <div className={`p-4 rounded-2xl shadow-md backdrop-blur-sm ${isCurrentUser
                            ? 'bg-brand-cyan/20 border border-brand-cyan/30 text-foreground rounded-tr-none'
                            : 'bg-white/5 border border-white/10 text-foreground rounded-tl-none'
                            }`}>
                            {msg.type === "file" ? (
                              <div className="flex items-center gap-3 bg-black/20 rounded-lg p-3 min-w-[200px]">
                                <div className="p-2 bg-white/10 rounded-lg">
                                  {msg.fileName?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                                    <Image className="h-5 w-5 text-brand-cyan" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-brand-cyan" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{msg.fileName}</p>
                                  <p className="text-xs text-muted-foreground">{msg.fileSize}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-full">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {isDragActive && (
                <div className="absolute inset-0 bg-brand-cyan/10 backdrop-blur-sm border-2 border-dashed border-brand-cyan rounded-3xl flex items-center justify-center z-50 m-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-brand-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <Download className="h-8 w-8 text-brand-cyan" />
                    </div>
                    <p className="text-brand-cyan font-medium text-lg">Datei hier ablegen...</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
                {pendingFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-3 p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-cyan/20 rounded-lg">
                        <Paperclip className="h-4 w-4 text-brand-cyan" />
                      </div>
                      <div>
                        <span className="text-sm font-medium block">{pendingFile.name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(pendingFile.size)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingFile(null)}
                      className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    >
                      Entfernen
                    </Button>
                  </motion.div>
                )}

                <div className="flex items-end gap-2">
                  <div className="relative flex-1 bg-black/20 rounded-2xl border border-white/10 focus-within:border-brand-cyan/50 transition-colors">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Nachricht eingeben..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="pr-12 bg-transparent border-none focus-visible:ring-0 min-h-[50px] py-3 text-white placeholder:text-gray-500"
                    />
                    <input {...getInputProps()} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-white/10 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={(!messageInput.trim() && !pendingFile)}
                    className="h-[50px] w-[50px] rounded-2xl bg-brand-cyan hover:bg-brand-cyan-dark text-black shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all duration-300"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
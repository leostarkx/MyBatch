import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Lock,
  Unlock,
  Clock,
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  File,
  Link as LinkIcon,
  X,
  ExternalLink,
  Trash2,
  Eye,
} from "lucide-react";
import { User, ChatMessage, UserRole, ASSISTANT_DUTIES_CONFIG } from "../types";
import { compressImage } from "../services/imageCompressor";

export interface ChatViewProps {
  currentUser: User | null;
  appUsers: User[];
  chatMessages: ChatMessage[];
  isChatLocked: boolean;
  isManager: boolean;
  onToggleChatLock: () => Promise<void>;
  onSendMessage: (data: {
    content: string;
    mediaUrl?: string;
    mediaType?: "text" | "image" | "video" | "file" | "link";
    replyTo?: { id: string; senderName: string; content: string };
  }) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
  onPreviewImage: (title: string, url: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  appUsers,
  chatMessages,
  isChatLocked,
  isManager,
  onToggleChatLock,
  onSendMessage,
  onDeleteMessage,
  onViewProfile,
  onPreviewImage,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [chatMediaUrl, setChatMediaUrl] = useState("");
  const [chatMediaType, setChatMediaType] = useState<"text" | "image" | "video" | "file" | "link">("text");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMediaInputRef = useRef<HTMLInputElement>(null);

  const now = Date.now();
  const visibleMessages = chatMessages.filter((m) => !m.expiresAt || m.expiresAt > now);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "rounded-2xl");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "rounded-2xl");
      }, 2000);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.75 });
        setChatMediaUrl(compressed);
        setChatMediaType("image");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setChatMediaUrl(reader.result as string);
          setChatMediaType(file.type.startsWith("video/") ? "video" : "file");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !chatMediaUrl) return;

    await onSendMessage({
      content: newMessage.trim(),
      mediaUrl: chatMediaUrl || undefined,
      mediaType: chatMediaUrl ? chatMediaType : "text",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined,
    });

    setNewMessage("");
    setChatMediaUrl("");
    setChatMediaType("text");
    setReplyingTo(null);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mx-4 my-4 animate-in fade-in duration-500">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 dark:text-white">
                محادثة الدفعة
              </h3>
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                {currentUser?.batchCode || "ENG26"}
              </span>
            </div>
            <p className="text-[10px] text-green-500 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {appUsers.length} عضو نشط
              {isChatLocked && (
                <span className="text-red-500 font-bold mr-2 flex items-center gap-1">
                  <Lock size={12} />
                  (مقفلة)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <button
              onClick={onToggleChatLock}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                isChatLocked
                  ? "bg-red-500 text-white shadow-red-200"
                  : "bg-emerald-600 text-white shadow-emerald-200"
              }`}
            >
              {isChatLocked ? <Lock size={12} /> : <Unlock size={12} />}
              {isChatLocked ? "فتح" : "قفل"}
            </button>
          )}
          <div
            className="p-2 bg-gray-50 dark:bg-slate-700 rounded-xl text-gray-400"
            title="يتم حذف الوسائط تلقائياً بعد 7 أيام للحفاظ على المساحة"
          >
            <Clock size={16} />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900 no-scrollbar">
        {visibleMessages.length > 0 ? (
          visibleMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            const isOwner = msg.senderRole === UserRole.OWNER;
            const isRep = msg.senderRole === UserRole.REPRESENTATIVE;
            const isAssistant = msg.senderRole === UserRole.ASSISTANT_REP;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""} group/msg`}
              >
                <div
                  onClick={() => onViewProfile(msg.senderId)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 relative cursor-pointer hover:opacity-80 transition ${
                    isOwner
                      ? "bg-amber-600"
                      : isRep
                      ? "bg-purple-600"
                      : isAssistant
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }`}
                  style={msg.senderColor ? { backgroundColor: msg.senderColor } : {}}
                >
                  {msg.senderAvatar ? (
                    <img
                      src={msg.senderAvatar}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    msg.senderName.charAt(0)
                  )}
                </div>

                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      {msg.senderName}
                    </span>
                    {isOwner && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded font-bold">
                        المطور 💻
                      </span>
                    )}
                    {isRep && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded font-bold">
                        الممثل 👑
                      </span>
                    )}
                    {isAssistant && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded font-bold">
                        معاون 🎖️
                      </span>
                    )}
                    {(() => {
                      const senderUser = appUsers.find((u) => u.uid === msg.senderId);
                      const duties = senderUser?.assistantDuties || [];
                      return duties.map((dutyKey) => {
                        const dutyConf = ASSISTANT_DUTIES_CONFIG[dutyKey];
                        if (!dutyConf) return null;
                        return (
                          <span
                            key={dutyKey}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${dutyConf.color} ${dutyConf.bgLight}`}
                            title={dutyConf.description}
                          >
                            {dutyConf.badge}
                          </span>
                        );
                      });
                    })()}
                    <span className="text-[8px] text-gray-300">
                      {new Date(msg.timestamp).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    onClick={() => !isMe && setReplyingTo(msg)}
                    className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group cursor-pointer transition-all hover:brightness-95 ${
                      isMe
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-slate-700"
                    }`}
                    style={isMe && msg.senderColor ? { backgroundColor: msg.senderColor } : {}}
                  >
                    {msg.replyTo && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMessage(msg.replyTo!.id);
                        }}
                        className="text-[10px] mb-2 p-2 rounded-lg border-r-2 border-white/30 bg-black/10 flex flex-col cursor-pointer"
                      >
                        <span className="font-bold opacity-80">{msg.replyTo.senderName}</span>
                        <span className="opacity-70 truncate">{msg.replyTo.content}</span>
                      </div>
                    )}

                    {msg.type === "image" && msg.mediaUrl && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewImage(`صورة من ${msg.senderName}`, msg.mediaUrl!);
                        }}
                        className="mb-2 rounded-xl overflow-hidden border border-white/20 cursor-pointer group/chatimg relative"
                        title="اضغط لتكبير الصورة"
                      >
                        <img
                          src={msg.mediaUrl}
                          alt="chat"
                          className="max-w-full h-auto max-h-60 object-cover group-hover/chatimg:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/chatimg:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                            <Eye size={12} />
                            <span>تكبير</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {msg.type === "video" && msg.mediaUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                        <video src={msg.mediaUrl} controls className="max-w-full h-auto max-h-60" />
                      </div>
                    )}

                    {msg.type === "link" && msg.mediaUrl && (
                      <a
                        href={msg.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg text-xs hover:underline"
                      >
                        <ExternalLink size={12} />
                        {msg.mediaUrl.length > 30 ? msg.mediaUrl.substring(0, 30) + "..." : msg.mediaUrl}
                      </a>
                    )}

                    {msg.type === "file" && msg.mediaUrl && (
                      <a
                        href={msg.mediaUrl}
                        download
                        className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-lg text-xs hover:underline"
                      >
                        <File size={14} />
                        تحميل ملف مرفق
                      </a>
                    )}

                    <span className="whitespace-pre-wrap">{msg.content}</span>

                    {msg.expiresAt && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 text-[8px] opacity-60">
                        <Clock size={10} />
                        توفير مساحة: سيحذف تلقائياً
                      </div>
                    )}

                    {/* Managers Delete Button */}
                    {isManager && !isMe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMessage(msg.id);
                        }}
                        className="absolute -top-2 -left-2 bg-white dark:bg-slate-700 text-red-500 p-1 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm">بداية المحادثة... كن أول من يرسل!</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
        {isChatLocked && currentUser?.role === UserRole.STUDENT ? (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl text-center text-xs font-bold border border-red-200 dark:border-red-800 flex items-center justify-center gap-2">
            <Lock size={16} />
            الدردشة مقفلة حالياً للمراجعة من قبل الممثل.
          </div>
        ) : (
          <div className="space-y-3">
            {replyingTo && (
              <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-xl text-xs border-r-4 border-primary">
                <span className="truncate opacity-70">رد على: {replyingTo.content}</span>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}
            {chatMediaUrl && (
              <div className="flex items-center justify-between bg-primary/5 p-2 rounded-xl text-xs border border-primary/20">
                <div className="flex items-center gap-2">
                  {chatMediaType === "image" ? (
                    <ImageIcon size={14} />
                  ) : chatMediaType === "video" ? (
                    <Video size={14} />
                  ) : (
                    <File size={14} />
                  )}
                  <span className="text-primary font-bold font-mono">مرفق جاهز للإرسال</span>
                </div>
                <button
                  onClick={() => {
                    setChatMediaUrl("");
                    setChatMediaType("text");
                  }}
                  className="text-red-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => chatMediaInputRef.current?.click()}
                className="p-3 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-200 transition shrink-0 cursor-pointer"
              >
                <Plus size={20} />
              </button>
              <input
                type="file"
                ref={chatMediaInputRef}
                hidden
                onChange={handleMediaUpload}
                accept="image/*,video/*,.pdf"
              />
              <div className="flex-1 flex items-center bg-gray-50 dark:bg-slate-700 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-primary/20 transition">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white"
                />
                {newMessage.startsWith("http") && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatMediaUrl(newMessage);
                      setChatMediaType("link");
                      setNewMessage("");
                    }}
                    className="text-primary p-1 hover:bg-primary/10 rounded-lg transition cursor-pointer"
                  >
                    <LinkIcon size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() && !chatMediaUrl}
                className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition shrink-0 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} className="rtl:rotate-180" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

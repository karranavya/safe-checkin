// src/pages/PoliceAiAgent.tsx
// Safe CheckIn — Police AI Assistant chat page
// Place this file at: police-insight-dashboard-app-main/src/pages/PoliceAiAgent.tsx

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Loader2,
  RotateCcw,
  Sparkles,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePoliceAuth } from "@/contexts/PoliceAuthContext";
import ReactMarkdown from "react-markdown";

const BACKEND = (import.meta.env.VITE_API_URL ?? "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

// Different starter prompts based on role
const SUB_POLICE_STARTERS = [
  "Show all pending alerts",
  "Who checked in across all hotels today?",
  "Any high-priority unresolved cases?",
  "Search alerts mentioning suspicious",
  "List guests from outside the state",
  "Show stats for this week",
];

const ADMIN_STARTERS = [
  "Show all pending alerts",
  "System stats for this week",
  "Show officer activity today",
  "Which hotel raised the most alerts?",
  "Search alerts mentioning weapon",
  "List all high-priority unresolved alerts",
];

// Reads police JWT — tries both localStorage and sessionStorage
function getToken(): string | null {
  return (
    localStorage.getItem("policeToken") ||
    sessionStorage.getItem("policeToken") ||
    localStorage.getItem("token") ||
    null
  );
}

export default function PoliceAiAgent() {
  const { user } = usePoliceAuth();
  const isAdmin = user?.role === "admin_police";

  // Welcome message is personalised with the officer's name and rank
  const welcomeContent = `Hello, ${user?.rank ?? "Officer"} ${user?.name ?? ""}.\n\nI'm SafeAI, your police dashboard assistant. I can search guests and alerts across all hotels, run keyword searches across case descriptions, get system statistics${isAdmin ? ", and monitor officer activity logs" : ""}.\n\nWhat would you like to investigate?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeContent },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setError(null);
    const userMsg: Message = { role: "user", content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/agent/police/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err: any) {
      const msg = err.message ?? "Unknown error";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${msg}\n\nPlease try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{ role: "assistant", content: welcomeContent }]);
    setInput("");
    setError(null);
  };

  const starters = isAdmin ? ADMIN_STARTERS : SUB_POLICE_STARTERS;
  const isFresh = messages.length === 1;

  // Admin gets yellow/purple theme, sub-police gets blue
  const accentBg = isAdmin ? "bg-yellow-400/15" : "bg-blue-500/15";
  const accentText = isAdmin ? "text-yellow-400" : "text-blue-400";
  const accentBorder = isAdmin ? "border-yellow-400/25" : "border-blue-400/25";
  const IconComponent = isAdmin ? Crown : Bot;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto px-4 pt-6 pb-4">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${accentBg} rounded-xl`}>
            <IconComponent className={`h-5 w-5 ${accentText}`} />
          </div>
          <div>
            <p className="font-semibold text-base">SafeAI — Police Assistant</p>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "Admin access · Full system visibility"
                : "Jurisdiction-wide access"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetChat}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      {/* ── Admin access badge ────────────────────────────────────────── */}
      {isAdmin && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${accentBorder} ${accentBg} mb-4`}
        >
          <Crown className={`h-3.5 w-3.5 ${accentText}`} />
          <span className={`text-xs font-medium ${accentText}`}>
            ADMINISTRATOR — activity logs and all officer data accessible
          </span>
        </div>
      )}

      {/* ── Starter prompts ───────────────────────────────────────────── */}
      {isFresh && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {starters.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className={`text-left text-xs px-3 py-2.5 rounded-xl border ${accentBorder} bg-muted/30 hover:bg-muted transition-all leading-snug`}
            >
              <Sparkles
                className={`inline h-3 w-3 mr-1.5 ${accentText} opacity-70`}
              />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Message list ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div
                className={`shrink-0 w-7 h-7 mt-0.5 ${accentBg} rounded-full flex items-center justify-center`}
              >
                <IconComponent className={`h-3.5 w-3.5 ${accentText}`} />
              </div>
            )}

            <div className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ...">
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="rounded-lg max-w-full mt-2 mb-1 border border-border"
                        loading="lazy"
                      />
                    ),
                    p: ({ children }) => (
                      <p className="mb-1.5 last:mb-0">{children}</p>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-7 h-7 mt-0.5 bg-primary rounded-full flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div
              className={`shrink-0 w-7 h-7 mt-0.5 ${accentBg} rounded-full flex items-center justify-center`}
            >
              <Loader2 className={`h-3.5 w-3.5 animate-spin ${accentText}`} />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Searching database...
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ────────────────────────────────────────────────── */}
      <div className="mt-4 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAdmin
              ? "Ask about alerts, guests, officers, statistics..."
              : "Ask about alerts, guests, hotel activity..."
          }
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden"
          style={{ minHeight: "42px", maxHeight: "120px" }}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          size="icon"
          className="rounded-xl h-[42px] w-[42px] shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-2">
        All queries are role-scoped · Aadhaar numbers are always masked
      </p>
    </div>
  );
}

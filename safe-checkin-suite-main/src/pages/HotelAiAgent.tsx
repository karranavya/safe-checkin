// src/pages/HotelAiAgent.tsx
import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND = (import.meta.env.VITE_API_URL ?? "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}

const STARTERS = [
  "Who is currently checked in?",
  "Show me guests in room 101",
  "How many guests checked in today?",
  "Show our pending police alerts",
  "Find guest with Aadhaar ending 4567",
  "Show photos of guest in room 201",
];

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hello! I'm SafeAI, your hotel assistant.\n\nI can help you find guest information, check room occupancy, view alert statuses, get daily statistics, and show guest photos.\n\nWhat would you like to know?",
};

function getToken(): string | null {
  return (
    localStorage.getItem("hotelToken") ||
    sessionStorage.getItem("hotelToken") ||
    localStorage.getItem("token") ||
    null
  );
}

// ── Render message content with inline image support ─────────────────────────
// Detects markdown images: ![alt](url) and renders them as <img> tags
function MessageContent({ content }: { content: string }) {
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    // Text before the image
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {text}
        </span>,
      );
    }
    // The image
    parts.push(
      <div key={key++} className="mt-2 mb-1">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          {match[1]}
        </p>
        <img
          src={match[2]}
          alt={match[1]}
          className="max-w-[180px] rounded-lg border border-border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(match![2], "_blank")}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>,
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </span>,
    );
  }

  return parts.length > 0 ? (
    <>{parts}</>
  ) : (
    <span className="whitespace-pre-wrap">{content}</span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HotelAiAgent() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Thinking...");
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

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const msgs = [
      "Thinking...",
      "Querying database...",
      "Preparing response...",
    ];
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 1500);
    return () => clearInterval(t);
  }, [loading]);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    const userMsg: Message = { role: "user", content: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);
    setLoadingMsg("Thinking...");

    try {
      const res = await fetch(`${BACKEND}/api/agent/hotel/chat`, {
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I ran into a problem: ${err.message}\n\nPlease try again.`,
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

  const reset = () => {
    setMessages([WELCOME]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base">SafeAI Assistant</p>
            <p className="text-xs text-muted-foreground">
              Hotel guest & operations assistant
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-left text-xs px-3 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-all leading-snug"
            >
              <Sparkles className="inline h-3 w-3 mr-1.5 text-primary/60" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 w-7 h-7 mt-0.5 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
                  : "bg-muted rounded-tl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <MessageContent content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-7 h-7 mt-0.5 bg-primary rounded-full flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="shrink-0 w-7 h-7 mt-0.5 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {loadingMsg}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about guests, rooms, alerts, photos..."
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
        SafeAI only accesses your hotel's data · Aadhaar numbers are always
        masked
      </p>
    </div>
  );
}

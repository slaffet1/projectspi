import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useBusiness } from "@/app/context/BusinessContext";
import { aiAdvisorService } from "@/app/services/aiAdvisorService";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's my financial situation this month?",
  "Which invoices are overdue?",
  "What are my biggest expenses?",
  "How is my business performing?",
];

export function AiAdvisor() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! 👋 I'm your AI Financial Advisor for **${activeBusiness?.name ?? "your business"}**.\n\nI have access to your real data — invoices, expenses, stock, and clients. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || !businessId) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await aiAdvisorService.chat(businessId, newMessages);
      const reply = res.data?.reply ?? "Sorry, I could not get a response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Floating button ───────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-2xl shadow-lg transition-all hover:scale-105"
        aria-label="Open AI Advisor"
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold">AI Advisor</span>
      </button>
    );
  }

  // ── Chat window ───────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Financial Advisor</p>
            <p className="text-xs text-white/70">Powered by LLaMA 3.3</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center mr-2 shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-border flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your business..."
          className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="rounded-xl shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
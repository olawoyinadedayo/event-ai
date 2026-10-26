"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoPilotContext {
  eventId: string;
  eventName: string;
  eventType: string | null;
  date: string | null;
  totalGuests: number;
  confirmedGuests: number;
  seatedGuests: number;
  tableCount: number;
  tags: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface CoPilotChatProps {
  open: boolean;
  onClose: () => void;
  context: CoPilotContext;
}

export function CoPilotChat({ open, onClose, context }: CoPilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const welcomeShown = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!welcomeShown.current) {
      welcomeShown.current = true;
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hi! I'm your Event Co-Pilot for **${context.eventName}**. I can help with timelines, vendor checklists, seating ideas, and more. What would you like to plan?`,
        },
      ]);
    }
  }, [context.eventName]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "loading") return;

      const history: ChatMessage[] = [
        ...messages,
        { id: crypto.randomUUID(), role: "user", content },
      ];
      setMessages(history);
      setInput("");
      setStatus("loading");
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: context.eventId,
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? `Request failed (${res.status})`);
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        const assistantId = crypto.randomUUID();

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m)),
          );
        }

        setStatus("ready");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    },
    [messages, status, context.eventId],
  );

  if (!open) return null;

  const quickPrompts = [
    "Generate a 5-hour timeline",
    "What vendors do I need?",
    "Suggest seating arrangements",
  ];

  return (
    <aside className="flex h-full w-full flex-col bg-white/95">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-950">
                Event Co-Pilot
              </h2>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.5)]" />
            </div>
            <p className="text-[10px] text-zinc-400">
              {context.confirmedGuests} confirmed · {context.tableCount} tables
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close Co-Pilot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
              m.role === "user"
                ? "ml-auto rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-indigo-600/10"
                : "rounded-bl-md bg-zinc-100/80 text-zinc-700 ring-1 ring-inset ring-zinc-200/60",
            )}
          >
            {m.content}
          </div>
        ))}

        {status === "loading" && (
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-zinc-100/80 px-3.5 py-2.5 text-sm text-zinc-500 ring-1 ring-inset ring-zinc-200/60">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0.3s]" />
          </div>
        )}

        {status === "error" && error && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && status === "ready" && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-500 shadow-sm shadow-zinc-950/[0.02] transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="border-t border-zinc-100 p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm shadow-zinc-950/[0.03] transition-colors focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about timelines, vendors, seating…"
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent px-1.5 py-1 shadow-none focus:bg-transparent focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="mb-0.5 shrink-0"
            disabled={status === "loading" || !input.trim()}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </aside>
  );
}
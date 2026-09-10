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
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Event Co-Pilot</h2>
            <p className="text-[10px] text-zinc-500">
              {context.confirmedGuests} confirmed · {context.tableCount} tables
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Close Co-Pilot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-800",
            )}
          >
            {m.content}
          </div>
        ))}

        {status === "loading" && (
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.3s]" />
          </div>
        )}

        {status === "error" && error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && status === "ready" && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
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
        className="border-t border-zinc-200 p-3"
      >
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about timelines, vendors, seating…"
            rows={2}
            className="resize-none"
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
            disabled={status === "loading" || !input.trim()}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </aside>
  );
}
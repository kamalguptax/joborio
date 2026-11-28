"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/lib/api/public";

const STORAGE_KEY = "joborio-chat-v1";
const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm the Upclift Assistant. Ask me about earnings, Refer & Earn, payouts, jobs or signing up.",
};
const SUGGESTIONS = ["How much do I keep?", "How does Refer & Earn work?", "When do I get paid?", "Is it free?"];

/** Only known site pages and emails are turned into links (no lookbehind: older Safari would crash on it). */
const LINK_RE =
  /(\/(?:signup|forgot-password|jobs|opportunities|refer-and-earn|brands|partners|feedback|contact)\b|[\w.+-]+@[\w-]+\.[\w.]+)/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(LINK_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        if (part.includes("@")) {
          return (
            <a key={i} href={`mailto:${part}`} className="font-semibold underline underline-offset-2">
              {part}
            </a>
          );
        }
        return (
          <Link key={i} href={part} className="font-semibold underline underline-offset-2">
            {part}
          </Link>
        );
      })}
    </>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore the conversation after a full page reload.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed.slice(-30));
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [open, messages, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text.slice(0, 1000) }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // The greeting is UI-only; send just the real conversation.
      const history = next
        .filter((m, i) => !(i === 0 && m.role === "assistant" && m.content === GREETING.content))
        .slice(-8);
      const { reply } = await sendChatMessage(history);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I could not reach the server just now. Please try again, or write to hello@joborio.com.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const showSuggestions = messages.length === 1 && !busy;

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open ? (
        <div
          role="dialog"
          aria-label="Upclift Assistant"
          className="mb-3 flex h-[min(34rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_70px_-20px_rgba(10,33,80,0.45)]"
        >
          <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">Upclift Assistant</p>
              <p className="text-xs text-white/80">AI chat · free to use</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-[#F7F8FC] px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-md bg-violet-600 text-white"
                      : "rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-100"
                  }`}
                >
                  {m.role === "assistant" ? <Linkified text={m.content} /> : m.content}
                </p>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <p className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
                  Typing…
                </p>
              </div>
            ) : null}
            {showSuggestions ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Type your question…"
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0A2150] placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat assistant"}
          aria-expanded={open}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_14px_30px_-8px_rgba(10,95,207,0.6)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          {open ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>
    </div>
  );
}

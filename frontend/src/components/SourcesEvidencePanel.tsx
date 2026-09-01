"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, FileText, Database, CheckCircle2 } from "lucide-react";
import { TraceableEvidenceItem } from "@/lib/api";

interface Props {
  evidence?: TraceableEvidenceItem[];
  sources?: { title: string; url: string; doc_type?: string; data_source?: string }[];
  ticker?: string;
}

export default function SourcesEvidencePanel({ evidence = [], sources = [], ticker }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const totalCitations = evidence.length + sources.length;
  if (totalCitations === 0) return null;

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-4 shadow-2xl">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white group-hover:text-blue-300 transition-colors">
                📚 Sources & Traceable Evidence ({totalCitations})
              </h3>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                ChromaDB RAG + Free Feeds
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Click to {isOpen ? "collapse" : "expand"} regulatory SEC 10-K document chunks, news citations, and price feeds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-xs font-bold text-zinc-300 group-hover:border-blue-500/50">
          <span>{isOpen ? "Hide Evidence" : "View Evidence"}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in duration-200">
          {/* RAG Chunk Evidence List */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-indigo-400" />
                Retrieved Vector Document Chunks (ChromaDB RAG)
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                {evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] p-4 space-y-2 shadow-inner"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                        <span className="font-bold text-white truncate max-w-[180px]">
                          {ev.document_name}
                        </span>
                      </div>
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
                        Score: {Math.round(ev.relevance_score * 100)}%
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                      "{ev.excerpt}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono pt-1">
                      <span>Chunk ID: {ev.chunk_id}</span>
                      <a
                        href={ev.source_url.startsWith("http") ? ev.source_url : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline font-bold"
                      >
                        <span>View Document</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard Sources */}
          {sources.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                External Financial & News Citations
              </span>

              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url && s.url.startsWith("http") ? s.url : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition-all shadow-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[280px]">{s.title}</span>
                    {s.data_source && (
                      <span className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] text-zinc-400 font-mono">
                        {s.data_source}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

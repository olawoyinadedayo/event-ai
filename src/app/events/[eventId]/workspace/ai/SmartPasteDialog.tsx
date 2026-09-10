"use client";

import { useRef, useState, useTransition } from "react";
import { parseGuestsFromTextAction, bulkAddParsedGuestsAction } from "../../ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2, Loader2, Upload, FileText, Download } from "lucide-react";
import { csvToGuests } from "@/lib/csv";
import type { ParsedGuest } from "@/types/ai";
import type { Guest } from "@/types/app";
import { cn } from "@/lib/utils";

interface SmartPasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onGuestsImported: (guests: Guest[]) => void;
}

type InputMode = "paste" | "csv";

export function SmartPasteDialog({
  open,
  onOpenChange,
  eventId,
  onGuestsImported,
}: SmartPasteDialogProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedGuest[] | null>(null);
  const [editing, setEditing] = useState<ParsedGuest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isParsing, startParse] = useTransition();
  const [isImporting, startImport] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleClose() {
    setRawText("");
    setFileName(null);
    setParsed(null);
    setEditing([]);
    setError(null);
    setWarning(null);
    onOpenChange(false);
  }

  function switchMode(next: InputMode) {
    setMode(next);
    setError(null);
    setWarning(null);
    setFileName(null);
  }

  function handleParse() {
    setError(null);
    startParse(async () => {
      const result = await parseGuestsFromTextAction(rawText);
      if (result.error) {
        setError(result.error);
        return;
      }
      setParsed(result.data ?? []);
      setEditing(result.data ?? []);
    });
  }

  function handleFile(file: File) {
    setError(null);
    setWarning(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (!text.trim()) {
        setError("The file is empty.");
        setParsed(null);
        return;
      }
      const result = csvToGuests(text);
      if (result.error) {
        setError(result.error);
        setParsed(null);
        return;
      }
      setParsed(result.guests);
      setEditing(result.guests);
      if (result.skipped > 0) {
        setWarning(
          `${result.skipped} row${result.skipped === 1 ? "" : "s"} skipped (missing name).`,
        );
      }
    };
    reader.onerror = () => {
      setError("Could not read the file.");
    };
    reader.readAsText(file);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function updateEditing(index: number, field: keyof ParsedGuest, value: string) {
    setEditing((prev) =>
      prev.map((g, i) =>
        i === index
          ? {
              ...g,
              [field]:
                field === "tags"
                  ? value.split(",").map((t) => t.trim()).filter(Boolean)
                  : value,
            }
          : g,
      ),
    );
  }

  function removeRow(index: number) {
    setEditing((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImport() {
    setError(null);
    startImport(async () => {
      const result = await bulkAddParsedGuestsAction(eventId, editing);
      if (result.error) {
        setError(result.error);
        return;
      }
      onGuestsImported(
        editing.map((g) => ({
          id: crypto.randomUUID(),
          event_id: eventId,
          name: g.name,
          email: g.email ?? null,
          rsvp_status: g.rsvp_status ?? "pending",
          dietary_notes: g.dietary_notes ?? null,
          tags: g.tags ?? [],
          table_id: null,
          seat_number: null,
        })),
      );
      handleClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-zinc-900">AI Smart Paste</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            <Trash2 className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {!parsed ? (
            <div>
              {/* Mode tabs */}
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("paste")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    mode === "paste"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Paste text
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("csv")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    mode === "csv"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700",
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload CSV
                </button>
              </div>

              {mode === "paste" ? (
                <div>
                  <p className="mb-3 text-sm text-zinc-500">
                    Paste an email thread, chat log, or messy guest list. AI extracts
                    names, emails, RSVPs, dietary notes, and tags.
                  </p>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Paste here… e.g.\n\nSarah Johnson <sarah@gmail.com> — confirmed, gluten free, Bride Side\nUncle Bob — maybe coming\nAlex's college friends: Mike, Dave, Steve\n\nFamily dinner at 7pm, they'll all attend`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-zinc-500">
                    Upload a CSV/Excel-exported guest list. Columns like{" "}
                    <code className="rounded bg-zinc-100 px-1 text-xs">name</code>,{" "}
                    <code className="rounded bg-zinc-100 px-1 text-xs">email</code>,{" "}
                    <code className="rounded bg-zinc-100 px-1 text-xs">rsvp</code>,{" "}
                    <code className="rounded bg-zinc-100 px-1 text-xs">dietary</code>,{" "}
                    <code className="rounded bg-zinc-100 px-1 text-xs">tags</code> are
                    detected automatically.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      e.target.value = "";
                    }}
                  />

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 py-12 transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
                  >
                    {fileName ? (
                      <>
                        <FileText className="mb-2 h-8 w-8 text-indigo-500" />
                        <p className="text-sm font-medium text-zinc-800">{fileName}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Click to choose a different file
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="mb-2 h-8 w-8 text-zinc-400" />
                        <p className="text-sm font-medium text-zinc-700">
                          Drop your CSV here, or click to browse
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">.csv up to 5MB</p>
                      </>
                    )}
                  </div>

                  <div className="mt-3 rounded-lg bg-zinc-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          Supported columns
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          <strong className="text-zinc-600">name</strong> (required) ·
                          email · rsvp/status · dietary/allergies · tags/group.
                          Semicolons or pipes in the tags column are treated as
                          separate tags.
                        </p>
                      </div>
                      <a
                        href="/sample-guests.csv"
                        download="sample-guests.csv"
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Sample CSV
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              {warning && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {warning}
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">
                  {editing.length} guest{editing.length === 1 ? "" : "s"} extracted
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setParsed(null);
                      setEditing([]);
                    }}
                  >
                    Start over
                  </Button>
                  <Button size="sm" onClick={handleImport} loading={isImporting}>
                    Import all
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">RSVP</th>
                      <th className="px-3 py-2 font-medium">Dietary</th>
                      <th className="px-3 py-2 font-medium">Tags</th>
                      <th className="w-8 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {editing.map((guest, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">
                          <input
                            value={guest.name}
                            onChange={(e) => updateEditing(i, "name", e.target.value)}
                            className="w-full min-w-[110px] rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-zinc-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={guest.email ?? ""}
                            onChange={(e) => updateEditing(i, "email", e.target.value)}
                            className="w-full min-w-[140px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-zinc-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={guest.rsvp_status ?? "pending"}
                            onChange={(e) => updateEditing(i, "rsvp_status", e.target.value)}
                            className="rounded border border-zinc-200 px-1 py-0.5 text-xs"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="declined">Declined</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={guest.dietary_notes ?? ""}
                            onChange={(e) =>
                              updateEditing(i, "dietary_notes", e.target.value)
                            }
                            placeholder="—"
                            className="w-full min-w-[120px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-zinc-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={(guest.tags ?? []).join(", ")}
                            onChange={(e) => updateEditing(i, "tags", e.target.value)}
                            className="w-full min-w-[120px] rounded border border-transparent bg-transparent px-1 py-0.5 text-xs hover:border-zinc-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            onClick={() => removeRow(i)}
                            className="rounded p-1 text-zinc-300 hover:text-red-500"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="neutral">Review before importing</Badge>
                <Badge variant="outline">Editable fields</Badge>
              </div>
            </div>
          )}
        </div>

        {!parsed && (
          <div className="flex justify-end gap-3 border-t border-zinc-200 px-6 py-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {mode === "paste" ? (
              <Button
                onClick={handleParse}
                loading={isParsing}
                disabled={!rawText.trim()}
              >
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Parse with AI
              </Button>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
              >
                <Upload className="h-4 w-4" />
                {fileName ? "Choose another file" : "Upload CSV"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Mail, Check, Copy, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import type { Guest } from "@/types/app";

interface InvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  guests: Guest[];
}

export function InvitesDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  guests,
}: InvitesDialogProps) {
  const [sending, setSending] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [baseUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : "",
  );

  const pendingGuests = guests.filter((g) => !g.invite_sent);
  const sentGuests = guests.filter((g) => g.invite_sent);

  const getRsvpUrl = (token: string) => `${baseUrl}/rsvp/${token}`;

  const copyToClipboard = async (text: string, guestId: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(guestId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendInvite = async (guestId: string) => {
    setSending(guestId);
    try {
      const res = await fetch(`/api/events/${eventId}/guests/${guestId}/invite`, {
        method: "POST",
      });
      if (res.ok) {
        // The realtime subscription will update the guests list
      }
    } finally {
      setSending(null);
    }
  };

  const handleBulkSend = async () => {
    if (pendingGuests.length === 0) return;
    setBulkSending(true);
    try {
      const ids = pendingGuests.map((g) => g.id);
      const res = await fetch(`/api/events/${eventId}/guests/bulk-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: ids }),
      });
      if (res.ok) {
        // The realtime subscription will update the guests list
      }
    } finally {
      setBulkSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Send Invitations</h2>
            <p className="text-sm text-zinc-500">{eventName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          {/* Pending invites section */}
          {pendingGuests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-zinc-900">
                  Ready to Send ({pendingGuests.length})
                </h3>
                <button
                  onClick={handleBulkSend}
                  disabled={bulkSending}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 border border-zinc-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-700">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{guest.name}</p>
                        <p className="text-xs text-zinc-500">{guest.email || "No email"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendInvite(guest.id)}
                      disabled={sending === guest.id}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {sending === guest.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Mail className="h-3.5 w-3.5" />
                      )}
                      Send
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent invites section */}
          {sentGuests.length > 0 && (
            <div>
              <h3 className="font-medium text-zinc-900 mb-3">Sent ({sentGuests.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sentGuests.map((guest) => {
                  const rsvpUrl = getRsvpUrl(guest.invite_token);
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3 border border-zinc-100"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 truncate">{guest.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{guest.email || "No email"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(rsvpUrl, guest.id)}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5"
                        >
                          {copied === guest.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copied === guest.id ? "Copied!" : "Copy Link"}
                        </button>
                        <a
                          href={rsvpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                          aria-label="Open RSVP page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {guests.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Mail className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
              <p>No guests yet. Add guests to send invitations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
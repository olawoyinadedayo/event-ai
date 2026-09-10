"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, MinusCircle, Utensils, Calendar, Loader2 } from "lucide-react";

interface GuestData {
  id: string;
  name: string;
  email: string | null;
  rsvp_status: "pending" | "confirmed" | "declined";
  dietary_notes: string | null;
  tags: string[];
  events: {
    name: string;
    event_type: string | null;
    date: string | null;
  } | null;
  invite_token: string;
}

export default function RSVPPage({ params }: { params: Promise<{ token: string }> }) {
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"pending" | "confirmed" | "declined">("pending");
  const [dietaryNotes, setDietaryNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchGuest = async () => {
      const { token } = await params;
      try {
        const res = await fetch(`/api/rsvp/${token}`);
        const data = await res.json();
        if (!cancelled) {
          if (data.error) {
            setError(data.error);
          } else if (data.data) {
            setGuest(data.data);
            setRsvpStatus(data.data.rsvp_status);
            setDietaryNotes(data.data.dietary_notes || "");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load invitation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchGuest();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const handleRsvpChange = async (status: "pending" | "confirmed" | "declined") => {
    if (!guest) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rsvp/${guest.invite_token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp_status: status, dietary_notes: dietaryNotes }),
      });
      const data = await res.json();
      if (!data.error) {
        setRsvpStatus(status);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDietaryChange = (e: React.ChangeEvent<HTMLTextareaElement>) => {
    setDietaryNotes(e.target.value);
  };

  const handleSaveNotes = async () => {
    if (!guest) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rsvp/${guest.invite_token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dietary_notes: dietaryNotes }),
      });
      const data = await res.json();
      if (!data.error) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="text-center max-w-md">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Invitation Not Found</h1>
          <p className="text-zinc-600">{error || "This invitation link is invalid or has expired."}</p>
        </div>
      </div>
    );
  }

  const event = guest.events;

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Invitation Card */}
        <div className="rounded-2xl bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">You&apos;re Invited!</h1>
                <p className="text-indigo-100">{event?.name || "Event"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {event?.event_type && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <span>{event.event_type}</span>
                </div>
              )}
              {event?.date && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Guest Name */}
            <div className="text-center">
              <p className="text-zinc-500 text-sm mb-1">Hello,</p>
              <h2 className="text-3xl font-bold text-zinc-900">{guest.name}</h2>
              {guest.email && <p className="text-zinc-500 mt-1">{guest.email}</p>}
            </div>

            {/* RSVP Status */}
            <div className="rounded-xl bg-zinc-50 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4 text-center">Will you be joining us?</h3>
              <div className="grid grid-cols-3 gap-3">
                {(["confirmed", "declined", "pending"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleRsvpChange(status)}
                    disabled={saving}
                    className={`
                      relative flex flex-col items-center gap-2 rounded-xl p-6 border-2 transition-all
                      ${rsvpStatus === status
                        ? "border-indigo-500 bg-indigo-50 shadow-lg"
                        : "border-zinc-200 hover:border-indigo-300 hover:bg-white"
                      }
                    `}
                  >
                    <div className={`
                      h-12 w-12 rounded-full flex items-center justify-center
                      ${rsvpStatus === status ? "bg-indigo-600" : "bg-zinc-100"}
                    `}>
                      {status === "confirmed" && (
                        <CheckCircle className={cn("h-7 w-7", rsvpStatus === status ? "text-white" : "text-emerald-600")} />
                      )}
                      {status === "declined" && (
                        <XCircle className={cn("h-7 w-7", rsvpStatus === status ? "text-white" : "text-red-600")} />
                      )}
                      {status === "pending" && (
                        <MinusCircle className={cn("h-7 w-7", rsvpStatus === status ? "text-white" : "text-amber-600")} />
                      )}
                    </div>
                    <span className={cn(
                      "font-medium text-sm",
                      rsvpStatus === status ? "text-indigo-700" : "text-zinc-600"
                    )}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
              {saving && (
                <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>

            {/* Dietary Notes */}
            <div className="rounded-xl bg-zinc-50 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-indigo-600" />
                Dietary Requirements
              </h3>
              <textarea
                value={dietaryNotes}
                onChange={handleDietaryChange}
                rows={3}
                placeholder="Any allergies, dietary restrictions, or food preferences?"
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Notes"}
                </button>
              </div>
            </div>

            {/* Event Details */}
            {event && (
              <div className="rounded-xl border border-zinc-200 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Event Details</h3>
                <div className="space-y-3">
                  {event.event_type && (
                    <div className="flex items-center gap-3 text-zinc-700">
                      <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Calendar className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-zinc-500">Type</p>
                        <p className="font-medium">{event.event_type}</p>
                      </div>
                    </div>
                  )}
                  {event.date && (
                    <div className="flex items-center gap-3 text-zinc-700">
                      <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Calendar className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-zinc-500">Date</p>
                        <p className="font-medium">{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-emerald-700 text-sm animate-fade-in">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                Changes saved successfully!
              </div>
            )}

            <p className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-200">
              This is your personal RSVP link. Changes update in real-time for the event organizer.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
import type { ParsedGuest } from "@/types/ai";

/**
 * Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes,
 * commas inside quotes, and \r\n / \n line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface CsvColumnMap {
  nameIndex: number;
  emailIndex: number | null;
  rsvpIndex: number | null;
  dietaryIndex: number | null;
  tagsIndex: number | null;
  extraIndexes: number[];
}

/**
 * Detect column indexes by fuzzy-matching common header names.
 * Falls back to first-column-as-name when no recognizable header row exists.
 */
export function mapCsvColumns(headers: string[]): CsvColumnMap {
  const normalized = headers.map(normalizeHeader);

  const find = (candidates: string[]): number | null => {
    for (const candidate of candidates) {
      const idx = normalized.findIndex((h) => h === candidate);
      if (idx !== -1) return idx;
    }
    return null;
  };

  const nameIndex =
    find([
      "name",
      "full_name",
      "guest",
      "guest_name",
      "guestname",
      "attendee",
      "attendee_name",
      "first_last",
    ]) ??
    find(["first_name", "firstname"]) ??
    0;

  const emailIndex = find(["email", "e_mail", "email_address", "mail", "contact_email"]);
  const rsvpIndex = find(["rsvp", "rsvp_status", "status", "attending", "response", "rsvp_state"]);
  const dietaryIndex = find([
    "dietary",
    "dietary_notes",
    "dietary_requirements",
    "allergies",
    "restrictions",
    "diet",
    "notes",
    "special_requests",
  ]);
  const tagsIndex = find(["tags", "tag", "group", "category", "side", "guest_of", "party"]);

  const extraIndexes = normalized
    .map((h, i) => (h ? i : -1))
    .filter((i) => i !== -1)
    .filter(
      (i) => i !== nameIndex && i !== emailIndex && i !== rsvpIndex && i !== dietaryIndex && i !== tagsIndex,
    );

  return { nameIndex, emailIndex, rsvpIndex, dietaryIndex, tagsIndex, extraIndexes };
}

function looksLikeHeaderRow(row: string[]): boolean {
  return row.some((cell) => /name|email|rsvp|diet|tag|group|attendee/i.test(cell));
}

function normalizeRsvp(value: string): ParsedGuest["rsvp_status"] {
  const v = value.trim().toLowerCase();
  if (/^(yes|y|confirmed|accepted|attending|going|1|true|rsvp)$/.test(v)) return "confirmed";
  if (/^(no|n|declined|not_attending|cannot|regret|0|false)$/.test(v)) return "declined";
  return "pending";
}

function splitTags(value: string): string[] {
  return value
    .split(/[,;|]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Convert parsed CSV rows into ParsedGuest objects.
 * Handles a header row, first/last name split, and column-name overrides.
 */
export function csvToGuests(text: string): {
  guests: ParsedGuest[];
  skipped: number;
  error: string | null;
} {
  const rows = parseCsv(text);
  if (rows.length === 0) return { guests: [], skipped: 0, error: "The file is empty." };

  const hasHeader = looksLikeHeaderRow(rows[0]);
  const headers = hasHeader ? rows[0] : [];
  const map = mapCsvColumns(headers.length > 0 ? headers : rows[0]);

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const guests: ParsedGuest[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    if (row.every((cell) => !cell.trim())) continue;

    let name = (row[map.nameIndex] ?? "").trim();

    // Detect first_name / last_name split columns
    const firstIdx = headers.findIndex((h) => normalizeHeader(h) === "first_name" || normalizeHeader(h) === "firstname");
    const lastIdx = headers.findIndex((h) => normalizeHeader(h) === "last_name" || normalizeHeader(h) === "lastname");
    if (hasHeader && firstIdx !== -1 && lastIdx !== -1) {
      const first = (row[firstIdx] ?? "").trim();
      const last = (row[lastIdx] ?? "").trim();
      if (first || last) name = [first, last].filter(Boolean).join(" ");
    }

    if (!name) {
      skipped++;
      continue;
    }

    guests.push({
      name,
      email: map.emailIndex !== null && (row[map.emailIndex] ?? "").trim() ? (row[map.emailIndex] ?? "").trim() : null,
      rsvp_status:
        map.rsvpIndex !== null && (row[map.rsvpIndex] ?? "").trim()
          ? normalizeRsvp(row[map.rsvpIndex] ?? "")
          : "pending",
      dietary_notes:
        map.dietaryIndex !== null && (row[map.dietaryIndex] ?? "").trim()
          ? (row[map.dietaryIndex] ?? "").trim()
          : null,
      tags:
        map.tagsIndex !== null && (row[map.tagsIndex] ?? "").trim()
          ? splitTags(row[map.tagsIndex] ?? "")
          : [],
    });
  }

  return {
    guests,
    skipped,
    error:
      guests.length === 0
        ? "No valid guest rows found. Make sure there is a name column."
        : null,
  };
}
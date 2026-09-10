import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EventPilot — AI Event Planning",
  description:
    "Collaborative guest lists, drag-and-drop seating charts, and AI-powered event planning.",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
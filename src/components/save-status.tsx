import type { SaveStatus } from "@/lib/use-autosave";

export function SaveStatusPill({ status, error }: { status: SaveStatus; error: string | null }) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? `Error: ${error ?? ""}`
          : "Up to date";
  const cls =
    status === "error"
      ? "bg-red-50 text-red-700"
      : status === "saving"
        ? "bg-stone-100 text-stone-700"
        : "bg-calabar-green-50 text-calabar-green-800";
  return <span className={`pill ${cls}`}>{label}</span>;
}

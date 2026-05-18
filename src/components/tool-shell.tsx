"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Circle,
  FileDown,
  Maximize2,
  Menu,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import type { SaveStatus } from "@/lib/use-autosave";

export type ToolShellAuthor = {
  name: string;
  form: string | null;
  classGroup: string | null;
};

type Props = {
  appName: string;
  appTagline?: string;
  badge?: string;
  title: string;
  setTitle?: (s: string) => void;
  saveStatus?: SaveStatus;
  author: ToolShellAuthor;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (t: string) => void;
  rightActions?: React.ReactNode;
  toolbar?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  statusItems?: React.ReactNode;
  zoom?: number;
  setZoom?: (n: number) => void;
  children: React.ReactNode;
  canEdit?: boolean;
};

export function ToolShell({
  appName,
  appTagline = "Write like a Lion. Submit with pride.",
  badge,
  title,
  setTitle,
  saveStatus = "idle",
  author,
  tabs,
  activeTab,
  onTabChange,
  rightActions,
  toolbar,
  leftPanel,
  rightPanel,
  statusItems,
  zoom,
  setZoom,
  children,
  canEdit = true,
}: Props) {
  const [outlineOpen, setOutlineOpen] = useState(Boolean(leftPanel));
  const [assistantOpen, setAssistantOpen] = useState(Boolean(rightPanel));

  const initials = author.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasLeft = Boolean(leftPanel) && outlineOpen;
  const hasRight = Boolean(rightPanel) && assistantOpen;
  const centerSpan =
    hasLeft && hasRight ? "col-span-6" : hasLeft || hasRight ? "col-span-9" : "col-span-12";

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900 print:h-auto print:bg-white">
      {/* Top brand bar */}
      <header className="flex h-14 items-center justify-between gap-4 bg-calabar-green-900 px-4 text-white print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-calabar-gold-500 text-base font-black text-calabar-green-900">
            L
          </div>
          <div className="leading-none">
            <p className="font-display text-base font-black uppercase tracking-wide">
              {appName}
            </p>
            <p className="mt-0.5 text-[10px] italic text-calabar-gold-200">{appTagline}</p>
          </div>
          {badge && (
            <span className="ml-3 hidden items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold sm:inline-flex">
              {badge} <ChevronDown className="h-3 w-3 opacity-70" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          {setTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              placeholder="Untitled"
              className="min-w-0 max-w-md flex-1 bg-transparent text-center text-sm font-semibold tracking-tight outline-none placeholder:text-white/50 disabled:opacity-90"
            />
          ) : (
            <p className="min-w-0 max-w-md flex-1 truncate text-center text-sm font-semibold">
              {title}
            </p>
          )}
          <SaveBadge status={saveStatus} />
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded p-1.5 hover:bg-white/10" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative rounded p-1.5 hover:bg-white/10" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 hover:bg-white/10" aria-label="Help">
            <Circle className="h-4 w-4" />
          </button>
          <div className="ml-1 flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-calabar-gold-500 text-[11px] font-black text-calabar-green-900">
              {initials}
            </div>
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-xs font-semibold">{author.name}</p>
              <p className="text-[10px] text-white/70">
                {author.form ? `Form ${author.form}` : "Calabar"}
                {author.classGroup ? ` · ${author.classGroup}` : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs + right-side action buttons */}
      {(tabs?.length || rightActions) && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white pl-3 pr-3 print:hidden">
          <nav className="flex items-end gap-1 overflow-x-auto">
            {tabs?.map((t) => (
              <button
                key={t}
                onClick={() => onTabChange?.(t)}
                className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold transition ${
                  activeTab === t
                    ? "border-b-2 border-calabar-green-800 text-calabar-green-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 py-1.5">{rightActions}</div>
        </div>
      )}

      {/* Ribbon toolbar */}
      {toolbar && (
        <div className="flex flex-wrap items-stretch gap-4 border-b border-slate-200 bg-slate-50 px-3 py-1.5 print:hidden">
          {toolbar}
        </div>
      )}

      {/* Three-column main */}
      <main className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden print:block">
        {leftPanel && outlineOpen && (
          <aside className="col-span-3 flex min-h-0 flex-col border-r border-slate-200 bg-white text-slate-900 print:hidden">
            {leftPanel}
          </aside>
        )}

        <section className={`relative flex min-h-0 flex-col overflow-hidden bg-[#c9cfdb] ${centerSpan}`}>
          {children}
        </section>

        {rightPanel && assistantOpen && (
          <aside className="col-span-3 flex min-h-0 flex-col border-l border-slate-200 bg-white text-slate-900 print:hidden">
            {rightPanel}
          </aside>
        )}
      </main>

      {/* Status footer */}
      <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-1.5 text-[11px] text-slate-600 print:hidden">
        <div className="flex items-center gap-4">
          {leftPanel && (
            <button
              onClick={() => setOutlineOpen((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-slate-900"
              title="Toggle outline"
            >
              <Menu className="h-3.5 w-3.5" />
              {outlineOpen ? "Hide outline" : "Outline"}
            </button>
          )}
          {statusItems}
        </div>
        <div className="flex items-center gap-3">
          {rightPanel && (
            <button
              onClick={() => setAssistantOpen((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-slate-900"
              title="Toggle assistant"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {assistantOpen ? "Hide assistant" : "Assistant"}
            </button>
          )}
          {typeof zoom === "number" && setZoom && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(60, zoom - 10))}
                className="rounded px-1.5 hover:bg-slate-100"
              >
                −
              </button>
              <input
                type="range"
                min={60}
                max={200}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24"
              />
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="rounded px-1.5 hover:bg-slate-100"
              >
                +
              </button>
              <span className="ml-1 w-9 text-right">{zoom}%</span>
            </div>
          )}
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
      </footer>
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "error"
        ? "Save failed"
        : "Saved";
  const cls =
    status === "error" ? "bg-red-500/30 text-red-100" : "bg-white/10 text-white/90";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}>
      <Check className="h-3 w-3" /> {label}
    </span>
  );
}

// Convenience exports for tool toolbars

export function RibbonGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-stretch border-r border-slate-200 pr-3 last:border-r-0">
      <div className="flex flex-1 items-center gap-2">{children}</div>
      <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </div>
  );
}

export function RibbonIcon({
  icon: Icon,
  title,
  onClick,
  active,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-8 w-8 place-items-center rounded text-slate-700 transition disabled:opacity-40 ${
        active ? "bg-calabar-green-100 text-calabar-green-900" : "hover:bg-slate-200"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function HeaderAction({
  icon: Icon,
  label,
  onClick,
  variant = "secondary",
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "secondary" | "primary";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
        variant === "primary"
          ? "bg-calabar-green-700 text-white hover:bg-calabar-green-800"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export const HeaderIcons = { Share: Users, Export: FileDown, Submit: Send };

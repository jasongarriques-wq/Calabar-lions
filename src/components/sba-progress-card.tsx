type Project = {
  id: string | number;
  title: string;
  subject: string;
  due_date: string | null;
  status: string | null;
  percent_complete: number | null;
};

export function SbaProgressCard({ projects }: { projects: Array<Record<string, unknown>> }) {
  const items = projects as unknown as Project[];
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-calabar-green-800">SBA tracker</h2>
        <a href="/sba" className="text-sm font-medium text-calabar-green-700 hover:underline">
          Open →
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">No SBAs added yet.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li key={String(p.id)}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{p.title}</span>
                <span className="text-stone-500">{p.subject}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full bg-calabar-green-600"
                  style={{ width: `${Math.max(0, Math.min(100, p.percent_complete ?? 0))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-stone-500">
                <span>{p.status ?? "Not started"}</span>
                {p.due_date && <span>Due {new Date(p.due_date).toLocaleDateString()}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

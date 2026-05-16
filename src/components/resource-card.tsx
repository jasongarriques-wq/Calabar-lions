export function ResourceCard({
  title,
  subject,
  kind,
  url,
}: {
  title: string;
  subject: string;
  kind: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-stone-200 p-4 transition hover:border-calabar-green-300 hover:bg-calabar-green-50/40"
    >
      <div className="flex items-center justify-between">
        <span className="pill bg-stone-100 text-stone-700">{subject}</span>
        <span className="text-xs uppercase tracking-wider text-stone-500">{kind}</span>
      </div>
      <p className="mt-2 text-sm font-medium">{title}</p>
    </a>
  );
}

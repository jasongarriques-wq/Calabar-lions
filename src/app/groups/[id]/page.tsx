import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { GroupFeed, type GroupPost } from "./group-feed";
import { JoinGroupButton } from "./join-group-button";

type Group = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  parent_id: string | null;
};

type PostRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  attachments: unknown;
  author?:
    | { display_name: string | null; full_name: string | null }[]
    | { display_name: string | null; full_name: string | null }
    | null;
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, type, description, parent_id")
    .eq("id", id)
    .maybeSingle<Group>();
  if (!group) notFound();

  const { data: children } = await supabase
    .from("groups")
    .select("id, name, type")
    .eq("parent_id", id)
    .order("name");

  const { data: membership } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", id)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const isMember = Boolean(membership);

  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, body, created_at, author_id, attachments, author:profiles!posts_author_id_fkey(display_name, full_name)",
    )
    .eq("group_id", id)
    .order("created_at", { ascending: false })
    .limit(40);

  const posts: GroupPost[] = ((postsData as PostRow[] | null) ?? []).map((p) => {
    const a = Array.isArray(p.author) ? p.author[0] : p.author;
    return {
      id: p.id,
      body: p.body,
      created_at: p.created_at,
      author_id: p.author_id,
      author_name: a?.display_name ?? a?.full_name ?? "Unknown",
    };
  });

  return (
    <main>
      <Navbar />
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-6 py-8">
          <div>
            <span className="pill bg-calabar-gold-100 text-calabar-gold-800">
              {group.type}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-1 text-stone-600">{group.description}</p>
            )}
          </div>
          <JoinGroupButton groupId={group.id} initialIsMember={isMember} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_18rem]">
        <GroupFeed
          groupId={group.id}
          initialPosts={posts}
          isMember={isMember}
          currentUserId={user?.id ?? null}
        />

        <aside className="space-y-4">
          {(children ?? []).length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-calabar-green-800">Channels</h2>
              <ul className="mt-3 space-y-1">
                {(children ?? []).map((c) => {
                  const row = c as { id: string; name: string };
                  return (
                    <li key={row.id}>
                      <a
                        href={`/groups/${row.id}`}
                        className="block rounded-lg px-2 py-1 text-sm hover:bg-stone-100"
                      >
                        {row.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

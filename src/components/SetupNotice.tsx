interface SetupNoticeProps {
  title?: string;
  message?: string;
}

export default function SetupNotice({
  title = 'Connect Supabase to continue',
  message = 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then run the SQL in supabase_schema.sql.',
}: SetupNoticeProps) {
  return (
    <div className="glass-panel p-6 border-t-2 border-[var(--color-warning-500)]">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm text-gray-300">{message}</p>
      <div className="mt-4 rounded-lg border border-[var(--color-surface-border)] bg-black/20 p-4 text-sm text-gray-300">
        <p>`NEXT_PUBLIC_SUPABASE_URL`</p>
        <p>`NEXT_PUBLIC_SUPABASE_ANON_KEY`</p>
        <p className="mt-2 text-xs text-gray-500">These values need to exist in both `.env.local` and your Vercel project settings.</p>
      </div>
    </div>
  );
}

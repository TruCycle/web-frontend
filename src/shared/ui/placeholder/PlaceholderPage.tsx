export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="m-0 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">
        This is a placeholder for the {title.toLowerCase()} feature.
      </p>
    </section>
  )
}

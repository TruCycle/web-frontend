export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-tc-lg border border-tc-brand-line bg-white p-6">
      <h1 className="m-0 text-[30px] leading-9 font-semibold tracking-[-0.02em] text-tc-brand-ink">{title}</h1>
      <p className="mt-2 text-base leading-6 text-tc-brand-body">
        This is a placeholder for the {title.toLowerCase()} feature.
      </p>
    </section>
  )
}

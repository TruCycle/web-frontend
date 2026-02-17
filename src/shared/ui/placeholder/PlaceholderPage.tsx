export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <section className="page-card">
            <h1>{title}</h1>
            <p>This is a placeholder for the {title.toLowerCase()} feature.</p>
        </section>
    )
}

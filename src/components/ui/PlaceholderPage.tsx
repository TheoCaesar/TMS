interface PlaceholderPageProps {
  title: string;
  description: string;
}

// Temporary stand-in until each module's screens are built from the Figma designs.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}

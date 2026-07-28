import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center px-6 py-28">
      <div className="mx-auto max-w-[620px] text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">404</p>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text-primary md:text-5xl">
          That page does not exist.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-text-secondary">
          It may have moved during the rebuild. Here is everything worth reading.
        </p>

        <div className="mt-10 grid gap-3 text-left">
          {[
            { href: "/", label: "Home" },
            { href: "/work/peaceway", label: "Peaceway Online, the health build" },
            { href: "/work/alpha-plays", label: "Big_Quiv Alpha plays, community and markets" },
            { href: "/work/content-engine", label: "The Content Engine, technical" },
            { href: "/services", label: "The Growth Operating System" },
            { href: "/articles", label: "Articles" },
            { href: "/contact", label: "Contact" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-border bg-bg-secondary px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:border-border-hover"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

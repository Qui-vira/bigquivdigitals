import type { MDXComponents } from "mdx/types";
import { Evidence } from "@/components/Evidence";

/**
 * Global MDX component map. `Evidence` is available in every .mdx file without
 * an import, because a case study that renders a claim without its screenshot
 * is the exact failure this rebuild exists to fix.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Evidence,
    h1: ({ children }) => (
      <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-5xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-16 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 text-xl font-bold text-text-primary">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mt-5 space-y-3 text-base leading-relaxed text-text-secondary md:text-lg">
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li className="border-l-2 border-border pl-4">{children}</li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-text-primary">{children}</strong>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-accent underline underline-offset-4 hover:text-accent-hover"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-14 border-border" />,
    ...components,
  };
}

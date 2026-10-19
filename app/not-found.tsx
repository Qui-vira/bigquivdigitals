import Link from "next/link";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/notfound.css";

/**
 * 404, v3 (rebuild approved 19 Oct 2026; comp: NotFound.dc.html).
 *
 * One navy screen: "404" in the ground's second tone, scrambling once (#41),
 * the gold dot from the wordmark rolling along the rule under it (scene "dot",
 * which finds the rule by [data-dot-track] and leans towards the pointer on
 * desktop), the line, and every page worth reading. Copy and links are
 * unchanged. On phones the list drops below the stage.
 */

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/work/peaceway", label: "Peaceway Online, the health build" },
  { href: "/work/alpha-plays", label: "Big_Quiv Alpha plays, community and markets" },
  { href: "/work/content-engine", label: "The Content Engine, technical" },
  { href: "/work/nigeria-business-costs", label: "Nigeria Business Cost Intelligence, the data build" },
  { href: "/services", label: "The Growth Operating System" },
  { href: "/articles", label: "Articles" },
  { href: "/contact", label: "Contact" },
];

function LinkList({ className }: { className: string }) {
  return (
    <ul className={`v3-nf__links ${className}`}>
      {LINKS.map((l, i) => (
        <li key={l.href}>
          <Link href={l.href}>
            <span className="v3-nf__n" aria-hidden="true">
              [{String(i + 1).padStart(2, "0")}]
            </span>
            <span className="v3-nf__label">{l.label}</span>
            <Arrow className="v3-nf__arrow" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function NotFound() {
  return (
    <div className="v3 v3-nf">
      <Stage scene="dot" params={{ track: "[data-dot-track]", rest: 0.86 }} ground="navy" height={100} heightPhone={100} label="Page not found">
        <div className="v3-nf__grid">
          <div className="v3-nf__left">
            <div className="v3-nf__num-wrap">
              <p className="v3-display v3-nf__num" data-scramble>
                404
              </p>
              <div className="v3-nf__track" data-dot-track aria-hidden="true" />
            </div>
            <h1 id="nf-heading" className="v3-display v3-nf__h">
              That page does not <span className="mark">exist.</span>
            </h1>
            <p className="v3-nf__p">It may have moved during the rebuild. Here is everything worth reading.</p>
          </div>
          <LinkList className="v3-nf__links--stage" />
        </div>
      </Stage>
      <section className="v3-section v3-section--navy v3-nf__more" data-nav="navy" aria-label="Pages worth reading">
        <LinkList className="v3-nf__links--below" />
      </section>
    </div>
  );
}

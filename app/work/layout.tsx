import { CaseClose } from "@/components/work/CaseClose";
import "./work.css";

/**
 * Case-study shell, v3 (rebuild approved 19 Oct 2026; comps WorkPeaceway,
 * WorkAlphaPlays, WorkNigeriaBusinessCosts, WorkContentEngine).
 *
 * The MDX page renders inside `.v3-work__article`: its `# title` becomes the
 * navy stage with the page's device (components/work/CaseStage.tsx), and its
 * <Lede>, <Part> and <PullQuote> wrappers become the paper and cloud
 * sections (components/work/CaseParts.tsx, styles in ./work.css). Every case
 * study ends on the same live close; its copy and its /contact target are
 * unchanged.
 */
export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v3 v3-work">
      <article className="v3-work__article">{children}</article>
      <CaseClose />
    </div>
  );
}

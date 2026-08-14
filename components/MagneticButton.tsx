"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
  showArrow?: boolean;
  strength?: number;
  /**
   * Attention motion: a slow sheen sweep, and on the primary variant a ring
   * that expands out of the edge. Both loop, both live on pseudo-elements, and
   * both stop the moment the pointer arrives — the animation exists to win
   * attention, and once it has it it is competing with the hover state.
   *
   * On by default. Turn it OFF where several buttons share a viewport: if
   * everything pulses, nothing does, and the page reads as a landing-page
   * template. One emphasised control per screenful is the intent.
   */
  emphasis?: boolean;
}

export function MagneticButton({
  children,
  href,
  variant = "primary",
  className = "",
  showArrow = true,
  strength = 0.3,
  emphasis = true,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles =
    "group inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-base font-semibold tracking-wide cursor-pointer";
  // No glow on hover. This carried a 30px red bloom
  // (hover:shadow-[0_4px_30px_rgba(230,57,70,0.4)]); the hover state is now
  // carried by the colour shift alone.
  //
  // Label is near-black, not white. The accent moved from red to the sampled
  // amber (#E8A33D), against which white text is about 2.2:1 and fails WCAG
  // outright. Black on amber is 9.7:1.
  const primaryStyles =
    "bg-gradient-to-br from-accent to-[#F0B457] text-[#0A0806] hover:brightness-110";
  const secondaryStyles =
    "border border-border text-text-primary hover:border-accent/50 hover:bg-bg-tertiary";

  const styles = `${baseStyles} ${variant === "primary" ? primaryStyles : secondaryStyles} ${
    emphasis ? "cta-emphasis" : ""
  } ${className}`;

  const Tag = href ? "a" : "button";

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
      // Press feedback. A control that does not move under the finger reads as
      // unresponsive on touch, where there is no hover state to fall back on.
      // Scale only, so it cannot shift anything around it.
      whileTap={{ scale: 0.96 }}
    >
      <Tag href={href} className={styles} data-variant={variant}>
        <motion.span
          animate={{ x: position.x * 0.3, y: position.y * 0.3 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          // Above both pseudo-elements. The sheen passes under the label
          // rather than over it, so the text never dims mid-sweep.
          className="relative z-10 inline-flex items-center gap-2"
        >
          {children}
          {/* The arrow nudges on hover. Group-hover rather than a second
              motion value, so it costs nothing and cannot desync from the
              magnetic spring. */}
          {showArrow && (
            <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          )}
        </motion.span>
      </Tag>
    </motion.div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Cubic bezier from Tiger Abrodi — soft expand/collapse. */
const collapseEase = [0.25, 0.46, 0.45, 0.94] as const;

export type PresenceFlexCollapseProps = {
  show: boolean;
  /** Match parent `flex` + `gap-*` in px (e.g. Tailwind `gap-6` → 24). Cancels the “ghost gap” on exit. */
  parentGapPx: number;
  children: ReactNode;
  className?: string;
  /** Slight blur on enter/exit so height animation feels less harsh. */
  blur?: boolean;
};

export function PresenceFlexCollapse({
  show,
  parentGapPx,
  children,
  className,
  blur = false,
}: PresenceFlexCollapseProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return show ? <div className={className}>{children}</div> : null;
  }

  const marginTopClosed = -parentGapPx;
  const blurHidden = blur ? "blur(8px)" : undefined;
  const blurVisible = blur ? "blur(0px)" : undefined;

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          key="presence-flex-collapse"
          initial={{
            height: 0,
            opacity: 0,
            marginTop: marginTopClosed,
            ...(blur ? { filter: blurHidden } : {}),
          }}
          animate={{
            height: "auto",
            opacity: 1,
            marginTop: 0,
            ...(blur ? { filter: blurVisible } : {}),
          }}
          exit={{
            height: 0,
            opacity: 0,
            marginTop: marginTopClosed,
            ...(blur ? { filter: blurHidden } : {}),
          }}
          transition={{ duration: 0.3, ease: collapseEase }}
          style={{ overflow: "hidden" }}
          className={className}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

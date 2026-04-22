"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link, { type LinkProps } from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { springTransition } from "@/lib/motion-spring";

const MotionLink = motion(Link);

export type SpringPrimaryLinkProps = Omit<LinkProps, "className"> & {
  className?: string;
  children: ReactNode;
  /** Respect prefers-reduced-motion via parent; default true spring. */
  spring?: boolean;
};

export function SpringPrimaryLink({
  href,
  className,
  children,
  spring = true,
  ...linkProps
}: SpringPrimaryLinkProps) {
  const reduceMotion = useReducedMotion();
  const physics = spring && !reduceMotion;
  return (
    <MotionLink
      href={href}
      whileHover={physics ? { scale: 1.04 } : undefined}
      whileTap={physics ? { scale: 0.97 } : undefined}
      transition={physics ? springTransition : undefined}
      className={clsx(
        "landing-pill--motion transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-in-out",
        className,
      )}
      {...linkProps}
    >
      {children}
    </MotionLink>
  );
}

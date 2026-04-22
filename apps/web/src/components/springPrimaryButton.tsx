"use client";

import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { springTransition } from "@/lib/motion-spring";

export type SpringPrimaryButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> & {
  children: ReactNode;
  /** Set false for non-CTA controls. Default true. */
  spring?: boolean;
};

export function SpringPrimaryButton({
  children,
  className,
  disabled,
  spring = true,
  type = "button",
  ...props
}: SpringPrimaryButtonProps) {
  const reduceMotion = useReducedMotion();
  const physics = spring && !disabled && !reduceMotion;
  return (
    <motion.button
      type={type}
      whileHover={physics ? { scale: 1.04 } : undefined}
      whileTap={physics ? { scale: 0.97 } : undefined}
      transition={physics ? springTransition : undefined}
      className={clsx(
        "transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-in-out",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}

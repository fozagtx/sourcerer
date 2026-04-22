"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SpringPrimaryLink } from "@/components/springPrimaryLink";

const ease = [0.16, 1, 0.3, 1] as const;

const PEPE_ASSETS = [
  { src: "/landing/pepe-banner-wide.jpeg", alt: "Pepe banner — launch mood", w: 294, h: 171 },
  { src: "/landing/pepe-banner-alt.jpeg", alt: "Pepe banner — alternate scene", w: 300, h: 168 },
  { src: "/landing/pepe-square.jpeg", alt: "Pepe square crop", w: 237, h: 213 },
  { src: "/landing/pepe-sticker.png", alt: "Pepe sticker", w: 277, h: 182 },
] as const;

function fadeUp(delay: number, y = 20) {
  return {
    initial: { opacity: 0, y } as const,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.52, ease, delay },
  };
}

export function LandingHero() {
  const reduce = useReducedMotion();
  const off = reduce ? ({ initial: false as const } as const) : null;

  return (
    <section id="top" className="relative min-h-[88vh] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_20%,rgba(230,57,42,0.35),transparent_55%),linear-gradient(180deg,#12080c_0%,#1c1218_35%,#0d2a28_75%,#0a1f1e_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-scene-tealDeep/90"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex max-w-wrap flex-col items-center px-4 pb-24 pt-8 text-center sm:px-section-x sm:pt-12">
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:items-center md:justify-center md:gap-10 lg:gap-14">
          <motion.div
            className="order-1 flex min-w-0 flex-col items-center text-center md:items-start md:text-left"
            {...(off ?? fadeUp(0.02))}
          >
            <h1 className="landing-sticker max-w-[min(100%,32rem)] text-[clamp(3rem,11vw,6rem)] leading-none">
              sourcerer
            </h1>
            <p className="mt-5 max-w-lg font-mono text-sm font-medium uppercase tracking-[0.18em] text-[#ffb49a] drop-shadow-md sm:text-base">
              from idea to launched memecoin in seconds
            </p>
          </motion.div>
          <motion.figure
            className="relative order-2 w-[min(11rem,46vw)] shrink-0 rotate-2 overflow-hidden rounded-2xl border-[3px] border-[#2b1810] bg-black/25 shadow-[6px_8px_0_rgba(43,24,16,0.45)] md:w-[min(13.75rem,30vw)] md:-rotate-1"
            style={{ aspectRatio: "194 / 259" }}
            {...(off ?? {
              initial: { opacity: 0, y: 24, scale: 0.97 },
              animate: { opacity: 1, y: 0, scale: 1 },
              transition: { duration: 0.58, ease, delay: 0.1 },
            })}
          >
            <div className="relative h-full w-full">
              <Image
                src="/landing/pepe-sourcerer-hero.jpeg"
                alt="Sourcerer pepe mascot"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 46vw, 220px"
                priority
              />
              <div
                className="pointer-events-none absolute -bottom-1 -right-1 h-14 w-14 overflow-hidden rounded-full border-2 border-[#2b1810] bg-[#134d3f] shadow-[3px_3px_0_#2b1810] md:h-16 md:w-16"
                aria-hidden
              >
                <Image
                  src="/landing/pepe-sourcerer-icon.jpeg"
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </motion.figure>
        </div>

        <motion.p
          className="mx-auto mt-8 max-w-xl text-base font-normal lowercase leading-relaxed text-white drop-shadow-md sm:text-lg"
          {...(off ?? fadeUp(0.16))}
        >
          sourcerer is an ai-native launcher for memecoins on solana and bnb chain. sketch a concept, mint the vibe,
          trade the curve, and graduate into real liquidity without the usual launch theatre.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          {...(off ?? fadeUp(0.22))}
        >
          <SpringPrimaryLink href="/create" className="landing-pill gap-2 px-6 py-3 text-base">
            <Sparkles className="h-4 w-4" aria-hidden />
            launch with ai
          </SpringPrimaryLink>
          <Link href="/news" className="landing-pill landing-pill--ghost px-6 py-3 text-base">
            hot news plays
          </Link>
        </motion.div>

        <motion.div
          className="comic-panel mt-10 w-full max-w-3xl overflow-hidden !p-0"
          {...(off ?? fadeUp(0.28))}
        >
          <p className="border-b-[3px] border-[#2b1810] bg-black/30 px-4 py-2.5 text-center font-display text-sm lowercase tracking-wide text-[#ff3b2f] md:text-base">
            pepe-approved launch energy
          </p>
          <div className="grid grid-cols-2 gap-2 p-3 sm:gap-3 md:grid-cols-4">
            {PEPE_ASSETS.map((asset, i) => (
              <motion.figure
                key={asset.src}
                className="relative w-full overflow-hidden rounded-xl border-2 border-[#2b1810] bg-black/25 shadow-[3px_3px_0_rgba(0,0,0,0.35)]"
                style={{ aspectRatio: `${asset.w} / ${asset.h}` }}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-32px" }}
                transition={{ duration: 0.45, ease, delay: reduce ? 0 : 0.05 * i }}
              >
                <Image
                  src={asset.src}
                  alt={asset.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 45vw, 22vw"
                />
              </motion.figure>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="comic-panel mt-10 w-full max-w-md p-5 text-left"
          {...(off ?? fadeUp(0.34))}
        >
          <p className="font-display text-lg lowercase text-[#ff3b2f]">fees — lean</p>
          <p className="mt-2 text-sm lowercase leading-relaxed text-white/95">
            trading fees stay on-chain where they belong. we are not here to stack hidden taxes on your round trips.
            keep the curve clean, keep the community loud.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

import Link from "next/link";
import clsx from "clsx";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { TokenCard } from "@/components/tokenCard";
import { HotNewsRail } from "@/components/hotNewsRail";
import { ChainTabFilter } from "@/components/chainTabFilter";
import { LandingHero } from "@/components/landingHero";
import { LandingReveal, LandingRevealItem } from "@/components/landingReveal";
import { TrendingUp } from "lucide-react";

export const revalidate = 15;

async function getTokens() {
  if (!isDatabaseConfigured) return [];
  try {
    return await prisma.token.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch {
    return [];
  }
}

function PlanetBadge({ label = "orb" }: { label?: string }) {
  return (
    <div
      className="relative mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#2b1810] bg-gradient-to-br from-amber-400 via-orange-500 to-[#9e2f2a] shadow-md"
      aria-hidden
    >
      <span className="font-display text-[0.55rem] font-normal uppercase tracking-widest text-white drop-shadow-md">
        {label}
      </span>
    </div>
  );
}

export default async function Home() {
  const tokens = await getTokens();

  return (
    <div className="bleed-viewport -mt-6 text-white">
      <LandingHero />

      <section id="about" className="relative overflow-hidden py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_100%,rgba(0,0,0,0.35),transparent_50%),linear-gradient(180deg,#9e2f2a_0%,#c41e1e_45%,#9e2f2a_100%)] opacity-95"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden
        >
          <div className="absolute left-[8%] top-12 h-2 w-2 rounded-full bg-white" />
          <div className="absolute right-[15%] top-24 h-1.5 w-1.5 rounded-full bg-white" />
          <div className="absolute bottom-32 left-[20%] h-1 w-1 rounded-full bg-white" />
        </div>
        <div className="relative z-10 mx-auto max-w-wrap px-4 sm:px-section-x">
          <LandingReveal className="mb-12 text-center">
            <h2 className="landing-section-title inline-block text-3xl sm:text-4xl md:text-5xl">
              about sourcerer
            </h2>
          </LandingReveal>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            {[
              {
                title: "the beginning",
                body: "you bring the joke, the narrative, or the headline. we wire up wallets, metadata, and a bonding curve that behaves when the timeline shows up.",
              },
              {
                title: "curve discipline",
                body: "buy and sell on a transparent curve until the pool hits 85 native. then it graduates: raydium on solana, pancakeswap on bnb. lp gets the torch.",
              },
              {
                title: "two launchpads",
                body: "same product surface, two chains. flip solana or bnb in the header, deploy where your audience actually lives.",
              },
              {
                title: "ai co-pilot",
                body: "generate names, tickers, lore, and starter art in minutes. edit everything before you ship. speed without surrendering taste.",
              },
            ].map((card, i) => (
              <LandingRevealItem key={card.title} index={i}>
                <article
                  className={clsx(
                    "landing-arch-card relative flex flex-col gap-4 p-6 pb-8 text-left md:p-8",
                    i % 2 === 1 && "md:mt-10",
                  )}
                >
                  <h3 className="font-display text-lg lowercase text-[#ff3b2f]">
                    {card.title}
                  </h3>
                  <p className="text-sm lowercase leading-relaxed text-white/95">
                    {card.body}
                  </p>
                  <div className="mt-auto flex justify-end pt-4">
                    <PlanetBadge label="go" />
                  </div>
                </article>
              </LandingRevealItem>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-scene-tealDeep py-16">
        <LandingReveal className="mx-auto max-w-wrap px-4 sm:px-section-x">
          <HotNewsRail />
        </LandingReveal>
      </section>

      <section
        id="tokenomics"
        className="relative scroll-mt-28 overflow-hidden py-20"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(16,230,141,0.08),transparent_55%),linear-gradient(180deg,#070f14_0%,#0d1f2c_50%,#0a161c_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-scene-night/88 via-[#0d1f2c]/92 to-scene-night/95"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-wrap px-4 sm:px-section-x">
          <LandingReveal className="mb-10 text-center">
            <h2 className="landing-section-title inline-block text-3xl sm:text-4xl md:text-5xl">
              sourcerer tokenomics
            </h2>
          </LandingReveal>
          <LandingReveal className="mx-auto max-w-3xl text-center" delay={0.06}>
            <p className="text-lg lowercase text-white/85">bonding milestone</p>
            <p className="mt-2 font-mono text-4xl font-medium tracking-tight text-white sm:text-5xl">
              85 native
            </p>
            <p className="mt-2 text-caption lowercase text-white/55">
              solana: 85 sol · bnb chain: 85 bnb · then amm graduation
            </p>
          </LandingReveal>
          <LandingReveal className="mx-auto mt-12 max-w-xl" delay={0.1}>
            <div className="comic-panel p-6 text-left">
              <p className="font-display text-xl lowercase text-[#ff3b2f]">
                protocol tax · 0%
              </p>
              <p className="mt-3 text-sm lowercase leading-relaxed text-white/95">
                zero. zip. nada on our side for a made-up treasury line item.
                you still pay network gas and pool fees like a grown-up chain
                citizen. we keep the story straight so your holders can meme in
                peace.
              </p>
            </div>
          </LandingReveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-scene-rust py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.2)_100%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-wrap px-4 sm:px-section-x">
          <LandingReveal className="mb-4 space-y-1 text-center">
            <p className="font-mono text-caption font-medium uppercase tracking-wider text-[#ff3b2f]">
              live tape
            </p>
            <h2 className="flex items-center justify-center gap-2 font-display text-2xl lowercase tracking-tight text-white sm:text-3xl">
              <TrendingUp className="h-7 w-7 text-[#ff3b2f]" aria-hidden />
              fresh launches
            </h2>
          </LandingReveal>
          <LandingReveal delay={0.08}>
            {tokens.length === 0 ? (
              <div className="comic-panel !border-dashed !border-white/35 !bg-black/35 p-10 text-center">
                <p className="text-body-md lowercase text-white/85">
                  no tokens yet. be the first to{" "}
                  <Link
                    href="/create"
                    className="font-medium text-[#ff3b2f] underline decoration-white/35 underline-offset-4"
                  >
                    launch one
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ChainTabFilter
                chainOf={Object.fromEntries(
                  tokens.map((t) => [
                    t.mint,
                    (t.chain as "solana" | "bsc") ?? "solana",
                  ]),
                )}
              >
                {tokens.map((t) => (
                  <TokenCard key={t.mint} token={t} />
                ))}
              </ChainTabFilter>
            )}
          </LandingReveal>
        </div>
      </section>

      <section
        id="contact"
        className="relative scroll-mt-28 bg-scene-tealDeep py-20"
      >
        <div className="mx-auto max-w-wrap px-4 sm:px-section-x">
          <LandingReveal className="mx-auto max-w-2xl">
            <div className="landing-tilt-panel bg-gradient-to-b from-[#165a4a] to-[#0d3830] p-8 text-center">
              <p className="text-sm lowercase leading-relaxed text-white/95">
                sourcerer is experimental software. memecoins are volatile and
                can go to zero. nothing here is investment, legal, or tax
                advice. dyor, do not spend rent money, and assume every ticker
                is a joke until proven otherwise.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="landing-pill cursor-not-allowed opacity-80">
                  telegram (soon)
                </span>
                <span className="landing-pill cursor-not-allowed opacity-80">
                  twitter (soon)
                </span>
              </div>
            </div>
          </LandingReveal>
        </div>
      </section>

      <footer className="landing-footer-bar">
        <div className="mx-auto flex max-w-wrap flex-wrap items-center justify-between gap-3 px-4 py-4 text-caption lowercase text-white/70 sm:px-section-x">
          <nav className="flex flex-wrap gap-4">
            <Link href="/#top" className="hover:text-white">
              home
            </Link>
            <Link href="/#about" className="hover:text-white">
              about
            </Link>
            <Link href="/#tokenomics" className="hover:text-white">
              tokenomics
            </Link>
            <Link href="/#contact" className="hover:text-white">
              contact
            </Link>
            <Link href="/news" className="hover:text-white">
              news
            </Link>
          </nav>
          <Link href="/#top" className="landing-pill py-1.5 text-caption">
            back up
          </Link>
        </div>
      </footer>
    </div>
  );
}

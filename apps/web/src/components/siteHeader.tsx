"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChainSwitcher } from "@/components/chainSwitcher";
import { ConnectButton } from "@/components/connectButton";

function NavPill({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "landing-pill shrink-0 px-3 py-1.5 text-caption sm:px-4",
        active && "ring-2 ring-white/35 ring-offset-2 ring-offset-scene-tealDeep",
      )}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-scene-tealDeep/88 backdrop-blur-md transition-all duration-150 ease-in-out">
      <div className="mx-auto flex max-w-wrap flex-col gap-3 px-3 py-3 sm:px-section-x lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center justify-between gap-3 lg:shrink-0">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-base font-medium tracking-tight text-white sm:text-lg"
          >
            <span className="text-xl leading-none text-[#ff3b2f]" aria-hidden>
              ⚡
            </span>
            <span className="font-display lowercase tracking-tight">sourcerer</span>
          </Link>
          <div className="flex items-center gap-1.5 lg:hidden">
            <ChainSwitcher tone="scene" />
            <ConnectButton />
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-1.5 lg:flex-1 lg:justify-center">
          <NavPill href="/" active={pathname === "/"}>
            home
          </NavPill>
          <NavPill href="/#about">about</NavPill>
          <NavPill href="/#tokenomics">tokenomics</NavPill>
          <NavPill href="/#contact">contact</NavPill>
          <NavPill href="/news" active={pathname === "/news"}>
            news
          </NavPill>
          <NavPill href="/create" active={pathname === "/create"}>
            create
          </NavPill>
        </nav>

        <div className="hidden items-center justify-end gap-2 lg:flex lg:shrink-0">
          <ChainSwitcher tone="scene" />
          <Link href="/create" className="landing-pill py-2 text-caption">
            launch
          </Link>
          <div className="min-w-0 max-w-[160px] shrink truncate xl:max-w-none">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}

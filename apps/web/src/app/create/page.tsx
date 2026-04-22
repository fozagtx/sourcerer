import { CreateTokenForm } from "@/components/createTokenForm";

export const metadata = { title: "Launch bay — Sourcerer" };

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; symbol?: string; prompt?: string; newsId?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-content">
      <div className="mb-8 space-y-4">
        <p className="eyebrow">create</p>
        <h1 className="landing-section-title !inline-block text-3xl md:text-4xl">launch bay</h1>
        <div className="max-w-2xl space-y-3 text-body lowercase leading-relaxed text-white/80">
          <p>
            drop a keyword or paste a headline. sourcerer generates the full package — name, ticker, lore, logo, posters,
            pinned metadata. you edit whatever you want, then hit deploy.
          </p>
          <p className="text-white/65">
            no committee, no deck. your wallet signs; the token goes live. metadata, art, and the ai-heavy prep —
            handled in one flow.
          </p>
        </div>
      </div>
      <CreateTokenForm
        initial={{
          name: sp.name ?? "",
          symbol: sp.symbol ?? "",
          prompt: sp.prompt ?? "",
          newsId: sp.newsId,
        }}
      />
    </div>
  );
}

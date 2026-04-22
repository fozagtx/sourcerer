import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-content py-16 text-center">
      <div className="comic-panel comic-panel--dark mx-auto max-w-lg p-10">
        <p className="eyebrow mb-3">not found</p>
        <h1 className="font-display text-3xl lowercase text-white md:text-4xl">that page does not exist.</h1>
        <p className="mx-auto mt-3 max-w-md text-body lowercase text-white/65">
          bad url, wrong token id, or you hit a stale link. no fluff, just a dead end.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary px-6 py-3">
            home
          </Link>
          <Link href="/create" className="btn-secondary px-6 py-3">
            create
          </Link>
        </div>
      </div>
    </div>
  );
}

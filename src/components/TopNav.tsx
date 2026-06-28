// Markenname – hier umbenennen.
const BRAND = "LIEBE IM DRUCK";

export default function TopNav() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-md border border-ink/80">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#232323" strokeWidth="1.4">
            <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
            <path d="M9 4v14M15 6v14" />
          </svg>
        </span>
        <span className="font-serif text-xl tracking-[0.22em] text-ink whitespace-nowrap">{BRAND}</span>
      </div>

      <nav className="hidden items-center gap-7 text-[12px] tracking-[0.16em] text-ink/70 lg:flex">
        <a className="transition hover:text-ink" href="#">STERNENEDITOR</a>
        <a className="transition hover:text-ink" href="#">ALLE KUNSTWERKE</a>
        <span className="h-4 w-px bg-line" />
        <a className="transition hover:text-ink" href="#">HILFE</a>
        <a className="transition hover:text-ink" href="#">PRODUKTE &amp; LIEFERZEITEN</a>
      </nav>

      <button
        aria-label="Menü"
        className="grid h-10 w-12 place-items-center rounded-md border border-line transition hover:border-ink/30"
      >
        <svg width="20" height="14" viewBox="0 0 20 14" stroke="#232323" strokeWidth="1.5">
          <path d="M0 1h20M0 7h20M0 13h20" />
        </svg>
      </button>
    </header>
  );
}

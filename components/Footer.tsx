export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-night-950/80 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} riska.world · Cobertura descentralizada para humanos verificados.
        </p>
        <div className="flex gap-4">
          <a href="https://worldchain.world" target="_blank" rel="noreferrer" className="hover:text-white transition">
            World Chain
          </a>
          <a href="mailto:hey@riska.world" className="hover:text-white transition">
            hey@riska.world
          </a>
        </div>
      </div>
    </footer>
  );
}

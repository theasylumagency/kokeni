export default function Terminal({ dict }: { dict: any }) {
  return (
    <footer className="relative z-10 w-full flex flex-col bg-text-heavy text-background-light pt-20 px-10 lg:px-16 pb-10 overflow-hidden">
      {/* Faint Dark-Mode Grid Overlay for Footer */}
      <div className="absolute inset-0 pointer-events-none opacity-5" style={{
        backgroundImage: 'linear-gradient(to right, #86785aff 1px, transparent 1px), linear-gradient(to bottom, #86785aff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-16">

        {/* Massive Typographic CTA */}
        <div className="w-full flex flex-col gap-4">
          <h2 className="font-bold text-xl lg:text-xl xl:text-2xl uppercase tracking-tighter leading-none hover:text-primary transition-colors cursor-pointer w-fit">
            {dict.terminal.title}
          </h2>
          <p className="font-mono text-sm max-w-md text-muted">
            {dict.terminal.subtitle}
          </p>
        </div>

        {/* 3-Column Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-muted/30 font-mono text-sm">

          {/* Column 1: Seat of Operations */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase text-primary">{dict.terminal.col1_title}</h4>
            <div className="flex flex-col text-muted">
              {dict.terminal.col1_lines.map((line: string, i: number) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          </div>

          {/* Column 2: Direct Comms */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase text-primary">{dict.terminal.col2_title}</h4>
            <div className="flex flex-col text-muted">
              <a href="tel:+995322386589" className="hover:text-white transition-colors">{dict.terminal.col2_t}</a>
              <a href="tel:+995599510338" className="hover:text-white transition-colors">{dict.terminal.col2_m}</a>
              <a href="mailto:manufacturing@kokeni.ge" className="hover:text-white transition-colors mt-2">{dict.terminal.col2_e}</a>
            </div>
          </div>

          {/* Column 3: The Hallmark */}
          <div className="flex flex-col gap-4 items-start md:items-end md:text-right">
            <h4 className="font-bold uppercase text-primary">{dict.terminal.col3_title}</h4>
            <p className="text-muted max-w-[200px]">
              {dict.terminal.col3_desc}
            </p>
            {/* Micro-stamp geometry */}
            <div className="mt-4 opacity-50">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" />
                <circle cx="50" cy="50" r="10" />
              </svg>
            </div>
          </div>

        </div>

        {/* Legal / Copyright string */}
        <div className="w-full flex justify-between items-center text-xs font-mono text-muted/50 pt-8 border-t border-muted/10 mt-8">
          <span>{new Date().getFullYear()} © KOKENI.GE. ALL RIGHTS RESERVED.</span>
          <span>SYS.VER 1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

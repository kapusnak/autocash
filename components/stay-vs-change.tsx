export function StayVsChange() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Co se změní</p>
        <h3 className="font-display mt-2 text-xl font-bold text-foreground">Vlastník v technickém průkazu</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Vůz se dočasně přepíše na nás. Tím je dohoda zajištěná — nejde o to, že byste auto odevzdali do bazaru nebo
          přišli o klíče.
        </p>
        <TpSketch />
      </article>

      <article className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Co zůstane stejné</p>
        <h3 className="font-display mt-2 text-xl font-bold text-foreground">Jezdíte dál jako dřív</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Klíče máte u sebe, autem jezdíte podle potřeby a v technickém průkazu zůstáváte zapsaní jako provozovatel.
        </p>
        <StaySketch />
      </article>
    </div>
  )
}

function TpSketch() {
  return (
    <svg viewBox="0 0 220 96" className="mt-6 h-24 w-full text-primary" aria-hidden>
      <rect x="18" y="10" width="120" height="76" rx="8" fill="currentColor" opacity="0.08" />
      <rect x="18" y="10" width="120" height="76" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <text x="30" y="32" fontSize="9" fill="currentColor" opacity="0.55" fontFamily="system-ui">
        Technický průkaz
      </text>
      <text x="30" y="52" fontSize="11" fill="currentColor" fontFamily="system-ui" fontWeight="700">
        Vlastník
      </text>
      <text className="tp-owner" x="30" y="70" fontSize="11" fill="currentColor" fontFamily="system-ui">
        nový vlastník
      </text>
      <path d="M152 48h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M174 40l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <circle cx="198" cy="48" r="14" fill="currentColor" opacity="0.12" />
      <text x="198" y="52" textAnchor="middle" fontSize="11" fill="currentColor" fontFamily="system-ui">
        TP
      </text>
    </svg>
  )
}

function StaySketch() {
  return (
    <svg viewBox="0 0 220 96" className="mt-6 h-24 w-full text-primary" aria-hidden>
      <g className="stay-car">
        <path
          d="M36 58c2-12 10-20 28-20h44c12 0 18 6 22 14l10 6v12H36V58z"
          fill="currentColor"
          opacity="0.15"
        />
        <path
          d="M36 70h108M48 58h28l8-14h28l10 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
          opacity="0.55"
        />
        <circle cx="58" cy="72" r="8" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="122" cy="72" r="8" fill="none" stroke="currentColor" strokeWidth="2.2" />
      </g>
      <g transform="translate(168 28)">
        <g className="stay-coin">
          <circle cx="16" cy="16" r="16" fill="var(--gold)" />
          <text
            x="16"
            y="21"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="var(--gold-foreground)"
            fontFamily="system-ui"
          >
            Kč
          </text>
        </g>
      </g>
    </svg>
  )
}

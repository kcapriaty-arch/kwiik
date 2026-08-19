interface BienvenueProps {
  onSuivant: () => void;
}

export function Bienvenue({ onSuivant }: BienvenueProps) {
  return (
    <section className="flex flex-1 flex-col justify-between bg-kwiik px-6 pb-8 pt-16 text-white">
      <div>
        <p className="m-0 text-[11px] font-black uppercase tracking-[0.34em] text-white/65">KWIIK</p>
        <h1 className="m-0 mt-4 text-4xl font-black leading-[1.05]">Bienvenue sur KWIIK</h1>
        <p className="m-0 mt-4 max-w-[300px] text-sm font-medium leading-6 text-white/80">
          La marketplace qui connecte les clients camerounais aux meilleurs prestataires de services, pres de chez eux.
        </p>
      </div>

      <button
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-white px-4 text-sm font-black text-kwiik shadow-[0_12px_25px_rgba(0,0,0,0.18)] transition active:scale-[0.99]"
        onClick={onSuivant}
        type="button"
      >
        Suivant
      </button>
    </section>
  );
}

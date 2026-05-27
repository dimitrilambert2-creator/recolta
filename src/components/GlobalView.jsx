export default function GlobalView({ plants, saisons, C }) {
  const getSaison = p => p.dateAchat ? new Date(p.dateAchat).getFullYear() : (p.saison || 2026);

  const statsParSaison = saisons.map(s => {
    const ps = plants.filter(p => getSaison(p) === s);
    const investi = ps.reduce((acc, p) => acc + p.coutTotal, 0);
    const valeur = ps.reduce((acc, p) => acc + p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0), 0);
    const nbPlants = ps.length;
    const nbRecoltes = ps.reduce((acc, p) => acc + p.recoltes.length, 0);
    return { saison: s, investi, valeur, economie: valeur - investi, nbPlants, nbRecoltes };
  });

  const maxValeur = Math.max(...statsParSaison.map(s => Math.max(s.investi, s.valeur)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text, paddingBottom: 8, borderBottom: `2px solid ${C.borderDash}` }}>
        📊 Comparaison par saison
      </div>

      {statsParSaison.map(s => (
        <div key={s.saison} style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div className="lora" style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Saison {s.saison}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                {s.nbPlants} plant{s.nbPlants > 1 ? "s" : ""} · {s.nbRecoltes} récolte{s.nbRecoltes > 1 ? "s" : ""}
              </div>
            </div>
            <div style={{
              background: s.economie >= 0 ? C.greenBg : C.redBg,
              border: `1px solid ${s.economie >= 0 ? C.greenBorder : C.redBorder}`,
              borderRadius: 10, padding: "6px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: s.economie >= 0 ? C.green : C.red, textTransform: "uppercase", letterSpacing: 1 }}>Économie</div>
              <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: s.economie >= 0 ? C.green : C.red }}>
                {s.economie >= 0 ? "+" : ""}{s.economie.toFixed(2).replace(".", ",")}€
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Investi", val: s.investi, color: C.red },
              { label: "Récolté", val: s.valeur, color: C.green },
            ].map(b => (
              <div key={b.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{b.label}</span>
                  <span className="lora" style={{ fontSize: 12, color: b.color, fontWeight: 600 }}>{b.val.toFixed(2).replace(".", ",")}€</span>
                </div>
                <div style={{ background: "#ede8d8", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    width: Math.min(100, (b.val / maxValeur) * 100) + "%",
                    height: "100%", background: b.color, borderRadius: 4,
                    transition: "width 0.4s",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {s.investi > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>
              ROI : <span className="lora" style={{ color: C.amber, fontWeight: 600 }}>
                {Math.round((s.valeur / s.investi) * 100)}%
              </span>
            </div>
          )}
        </div>
      ))}

      {saisons.length < 2 && (
        <div style={{ textAlign: "center", padding: 20, color: C.textLight, fontSize: 12 }}>
          Ajoute des plants d&apos;une autre saison pour voir la comparaison ici.
        </div>
      )}
    </div>
  );
}

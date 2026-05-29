import { useState, useEffect } from "react";
import { CALENDRIER_DEFAULT, CALENDRIER_ENTRETIEN, MOIS, LEGENDE } from "../constants/calendrier";

export default function CalendrierView({ plants, C }) {
  const [tabCal, setTabCal] = useState("legumes");
  const [calendrier, setCalendrier] = useState(() => {
    try {
      const saved = localStorage.getItem("recolta_calendrier");
      return saved ? JSON.parse(saved) : CALENDRIER_DEFAULT;
    } catch { return CALENDRIER_DEFAULT; }
  });
  const [editRow, setEditRow] = useState(null);
  const [showAddEspece, setShowAddEspece] = useState(false);
  const [newEspece, setNewEspece] = useState({ espece: "", emoji: "🌱" });

  useEffect(() => {
    try { localStorage.setItem("recolta_calendrier", JSON.stringify(calendrier)); } catch {}
  }, [calendrier]);

  function updatePeriode(rowIdx, periodeIdx, field, val) {
    setCalendrier(prev => prev.map((row, ri) => ri !== rowIdx ? row : {
      ...row,
      periodes: row.periodes.map((p, pi) => pi !== periodeIdx ? p : { ...p, [field]: parseInt(val) || p[field] })
    }));
  }

  function deletePeriode(rowIdx, periodeIdx) {
    setCalendrier(prev => prev.map((row, ri) => ri !== rowIdx ? row : {
      ...row, periodes: row.periodes.filter((_, pi) => pi !== periodeIdx)
    }));
  }

  function addPeriode(rowIdx) {
    setCalendrier(prev => prev.map((row, ri) => ri !== rowIdx ? row : {
      ...row, periodes: [...row.periodes, { type: "recolte", label: "Nouvelle période", debut: 6, fin: 8, couleur: "#e05c3a" }]
    }));
  }

  function deleteEspece(rowIdx) {
    setCalendrier(prev => prev.filter((_, ri) => ri !== rowIdx));
    setEditRow(null);
  }

  function addEspece() {
    if (!newEspece.espece.trim()) return;
    setCalendrier(prev => [...prev, { espece: newEspece.espece.trim(), emoji: newEspece.emoji, periodes: [] }]);
    setNewEspece({ espece: "", emoji: "🌱" });
    setShowAddEspece(false);
  }

  function barStyle(debut, fin) {
    const d = debut - 1;
    const f = fin >= debut ? fin : fin + 12;
    const width = ((f - d) / 12) * 100;
    const left = (d / 12) * 100;
    return { left: left + "%", width: Math.min(width, 100 - left) + "%" };
  }

  const moisActuel = new Date().getMonth();

  const inputStyle = {
    fontSize: 11, background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 6, padding: "3px 4px", color: C.text,
  };

  const LEGENDE_ENTRETIEN = [
    { couleur: "#7b5e2a", label: "Compost / fumure" },
    { couleur: "#c8a020", label: "Paillage" },
    { couleur: "#e8884a", label: "Désherbage / binage" },
    { couleur: "#5890c0", label: "Taille & tutorage" },
    { couleur: "#a050a0", label: "Traitement préventif" },
    { couleur: "#4090c0", label: "Arrosage intensif" },
    { couleur: "#6b9c3a", label: "Engrais vert" },
    { couleur: "#b0b0b0", label: "Chaulage" },
  ];

  function MoisHeader() {
    return (
      <div style={{ display: "flex", marginBottom: 4, paddingLeft: 80 }}>
        {MOIS.map((m, i) => (
          <div key={m} style={{
            flex: 1, fontSize: 8, textAlign: "center",
            color: i === moisActuel ? C.green : C.textMuted,
            fontWeight: i === moisActuel ? 700 : 400,
          }}>{m}</div>
        ))}
      </div>
    );
  }

  function BarRow({ label, emoji, periodes }) {
    return (
      <div style={{
        display: "flex", alignItems: "center",
        borderTop: `1px dashed ${C.borderDash}`,
        padding: "6px 0",
      }}>
        <div style={{ width: 80, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 16 }}>{emoji}</span>
          <span style={{ fontSize: 10, color: C.text, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
        </div>
        <div style={{ flex: 1, position: "relative", height: 20 }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: C.borderDash }} />
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: (moisActuel / 12 * 100) + "%",
            width: 1, background: C.green, opacity: 0.4,
          }} />
          {periodes.map((p, pi) => {
            const bs = barStyle(p.debut, p.fin);
            return (
              <div key={pi} style={{
                position: "absolute", top: 3, height: 14,
                background: p.couleur, borderRadius: 3, opacity: 0.85,
                ...bs,
              }} title={`${p.label} : ${MOIS[p.debut-1]} → ${MOIS[p.fin-1]}`} />
            );
          })}
        </div>
      </div>
    );
  }

  const tabStyle = (active) => ({
    flex: 1, padding: "8px 0", fontSize: 13, fontWeight: active ? 700 : 500,
    background: active ? C.paper : "transparent",
    border: `1px solid ${active ? C.border : "transparent"}`,
    borderRadius: 10, cursor: "pointer",
    color: active ? C.text : C.textMuted,
    fontFamily: "'Nunito', sans-serif",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6, background: C.bg, borderRadius: 12, padding: 4, marginBottom: 14, border: `1px solid ${C.border}` }}>
        <button style={tabStyle(tabCal === "legumes")} onClick={() => { setTabCal("legumes"); setEditRow(null); }}>
          🥦 Légumes
        </button>
        <button style={tabStyle(tabCal === "entretien")} onClick={() => { setTabCal("entretien"); setEditRow(null); }}>
          🧴 Entretien
        </button>
      </div>

      {/* ── Tab Légumes ── */}
      {tabCal === "legumes" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>📅 Calendrier cultural</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Région Alsace</div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {LEGENDE.map(l => (
              <div key={l.type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 8, borderRadius: 2, background: l.couleur }} />
                <span style={{ fontSize: 10, color: C.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>

          <MoisHeader />

          {calendrier.map((row, rowIdx) => (
            <div key={rowIdx}>
              <div style={{
                display: "flex", alignItems: "center",
                borderTop: `1px dashed ${C.borderDash}`,
                padding: "6px 0",
                background: editRow === rowIdx ? "#fffdf0" : "transparent",
              }}>
                <div style={{ width: 80, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 16 }}>{row.emoji}</span>
                  <span style={{ fontSize: 10, color: C.text, fontWeight: 600, lineHeight: 1.2 }}>{row.espece}</span>
                </div>

                <div style={{ flex: 1, position: "relative", height: 20 }}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: C.borderDash }} />
                  <div style={{
                    position: "absolute", top: 0, bottom: 0,
                    left: (moisActuel / 12 * 100) + "%",
                    width: 1, background: C.green, opacity: 0.4,
                  }} />
                  {row.periodes.map((p, pi) => {
                    const bs = barStyle(p.debut, p.fin);
                    return (
                      <div key={pi} style={{
                        position: "absolute", top: 3, height: 14,
                        background: p.couleur, borderRadius: 3, opacity: 0.85,
                        cursor: editRow === rowIdx ? "pointer" : "default",
                        ...bs,
                      }} title={`${p.label} : ${MOIS[p.debut-1]} → ${MOIS[p.fin-1]}`} />
                    );
                  })}
                </div>

                <button onClick={() => setEditRow(editRow === rowIdx ? null : rowIdx)}
                  style={{
                    background: "none", border: "none",
                    color: editRow === rowIdx ? C.green : C.textLight,
                    fontSize: 13, cursor: "pointer", padding: "0 4px", flexShrink: 0,
                  }}>✎</button>
              </div>

              {editRow === rowIdx && (
                <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div className="lora" style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 10 }}>
                    Périodes pour {row.emoji} {row.espece}
                  </div>
                  {row.periodes.map((p, pi) => (
                    <div key={pi} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginBottom: 8, paddingBottom: 8, borderBottom: `1px dashed ${C.borderDash}`,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: p.couleur, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 11, color: C.text }}>{p.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <select value={p.debut} onChange={e => updatePeriode(rowIdx, pi, "debut", e.target.value)} style={inputStyle}>
                          {MOIS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <span style={{ fontSize: 10, color: C.textMuted }}>→</span>
                        <select value={p.fin} onChange={e => updatePeriode(rowIdx, pi, "fin", e.target.value)} style={inputStyle}>
                          {MOIS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                        <button onClick={() => deletePeriode(rowIdx, pi)}
                          style={{ background: "none", border: "none", color: C.red, fontSize: 14, cursor: "pointer", padding: 0 }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => addPeriode(rowIdx)} style={{
                      flex: 1, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                      color: C.green, borderRadius: 8, padding: "6px",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}>+ Ajouter une période</button>
                    <button onClick={() => deleteEspece(rowIdx)} style={{
                      background: C.redBg, border: `1px solid ${C.redBorder}`,
                      color: C.red, borderRadius: 8, padding: "6px 10px",
                      fontSize: 11, cursor: "pointer",
                    }}>🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {showAddEspece ? (
            <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 12 }}>
              <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Nouvelle espèce</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input type="text" value={newEspece.emoji} onChange={e => setNewEspece(n => ({ ...n, emoji: e.target.value }))}
                  style={{ width: 44, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px", fontSize: 18, textAlign: "center", color: C.text }} />
                <input autoFocus type="text" value={newEspece.espece} onChange={e => setNewEspece(n => ({ ...n, espece: e.target.value }))}
                  placeholder="Nom de l'espèce..." style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, color: C.text }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addEspece} style={{
                  flex: 1, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                  color: C.green, borderRadius: 8, padding: "8px",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>Ajouter</button>
                <button onClick={() => setShowAddEspece(false)} style={{
                  flex: 1, background: C.redBg, border: `1px solid ${C.redBorder}`,
                  color: C.red, borderRadius: 8, padding: "8px",
                  fontSize: 13, cursor: "pointer",
                }}>Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddEspece(true)} style={{
              width: "100%", background: "transparent",
              border: `1px dashed ${C.borderDash}`, borderRadius: 12,
              padding: "12px", cursor: "pointer",
              color: C.textMuted, fontSize: 13, marginTop: 12,
            }}>+ Ajouter une espèce</button>
          )}
        </>
      )}

      {/* ── Tab Entretien ── */}
      {tabCal === "entretien" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>🧴 Calendrier d'entretien</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>Région Alsace</div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {LEGENDE_ENTRETIEN.map(l => (
              <div key={l.couleur} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 8, borderRadius: 2, background: l.couleur }} />
                <span style={{ fontSize: 10, color: C.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>

          <MoisHeader />

          {CALENDRIER_ENTRETIEN.map((row, i) => (
            <BarRow key={i} label={row.activite} emoji={row.emoji} periodes={row.periodes} />
          ))}

          <div style={{
            marginTop: 14, background: C.paper, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.7 }}>
              <strong style={{ color: C.text }}>Conseils :</strong> Le compost s'applique idéalement en automne (oct–nov) pour qu'il se décompose pendant l'hiver. Le paillage protège le sol de la chaleur et limite l'arrosage en été. Le chaulage corrige un pH trop acide — vérifier avec un test de sol avant application.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

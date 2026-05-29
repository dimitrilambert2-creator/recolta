import { useState } from "react";

export const CATEGORIES_ACHATS = {
  plants:   { label: "Plants",                emoji: "🌱" },
  engrais:  { label: "Engrais / fumure",      emoji: "🌿" },
  terreau:  { label: "Terreau / amendements", emoji: "🪴" },
  materiel: { label: "Matériel",              emoji: "🔧" },
  autre:    { label: "Autre",                 emoji: "📝" },
};

export default function AchatsView({ achats, saisonActive, coutPlants, totalValeur, C, onAddAchat, onDeleteAchat }) {
  const today = new Date().toISOString().slice(0, 10);
  const [showForm, setShowForm] = useState(false);
  const [newAchat, setNewAchat] = useState({
    date: today, categorie: "engrais", description: "", montant: "",
  });

  const achatsSaison = achats.filter(a => new Date(a.date).getFullYear() === saisonActive);
  const totalAchats = achatsSaison.reduce((s, a) => s + a.montant, 0);
  const totalDepenses = coutPlants + totalAchats;
  const economie = totalValeur - totalDepenses;

  const parCategorie = Object.entries(CATEGORIES_ACHATS).map(([key, cat]) => ({
    key, ...cat,
    total: achatsSaison.filter(a => a.categorie === key).reduce((s, a) => s + a.montant, 0),
  }));

  const inputStyle = {
    width: "100%", background: "#fff9ee",
    border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "8px 10px",
    fontSize: 13, boxSizing: "border-box",
    fontFamily: "'Nunito', sans-serif", outline: "none",
  };
  const labelStyle = {
    fontSize: 10, color: C.textMuted, marginBottom: 4,
    textTransform: "uppercase", letterSpacing: 1.5,
  };

  function addAchat() {
    const montant = parseFloat(newAchat.montant);
    if (!newAchat.description.trim() || !montant || montant <= 0) return;
    onAddAchat({ id: Date.now(), date: newAchat.date, categorie: newAchat.categorie, description: newAchat.description.trim(), montant });
    setNewAchat({ date: today, categorie: "engrais", description: "", montant: "" });
    setShowForm(false);
  }

  const fmt = v => v.toFixed(2).replace(".", ",") + " €";

  return (
    <div>
      {/* ── Bilan économique ── */}
      <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
        <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>
          📊 Bilan saison {saisonActive}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Valeur récoltée</span>
            <span className="lora" style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>+{fmt(totalValeur)}</span>
          </div>

          <div style={{ borderTop: `1px dashed ${C.borderDash}`, marginTop: 2 }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>🌱 Plants achetés</span>
            <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>−{fmt(coutPlants)}</span>
          </div>

          {parCategorie.filter(c => c.key !== "plants" && c.total > 0).map(cat => (
            <div key={cat.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{cat.emoji} {cat.label}</span>
              <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>−{fmt(cat.total)}</span>
            </div>
          ))}

          {achatsSaison.filter(a => a.categorie === "plants").length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>🌱 Plants (onglet achats)</span>
              <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>−{fmt(achatsSaison.filter(a => a.categorie === "plants").reduce((s, a) => s + a.montant, 0))}</span>
            </div>
          )}

          <div style={{ borderTop: `2px solid ${C.border}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="lora" style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>Économie réelle</span>
            <span className="lora" style={{ fontSize: 16, color: economie >= 0 ? C.green : C.red, fontWeight: 700 }}>
              {economie >= 0 ? "+" : ""}{fmt(economie)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Achats ── */}
      <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            🛒 Achats — Saison {saisonActive}
          </div>
          <button onClick={() => setShowForm(f => !f)} style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`,
            color: C.green, borderRadius: 8, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>+ Ajouter</button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px", marginBottom: 14, border: `1px solid ${C.border}` }}>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Catégorie</div>
              <select value={newAchat.categorie}
                onChange={e => setNewAchat(n => ({ ...n, categorie: e.target.value }))} style={inputStyle}>
                {Object.entries(CATEGORIES_ACHATS).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Date</div>
              <input type="date" value={newAchat.date}
                onChange={e => setNewAchat(n => ({ ...n, date: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Montant (€) *</div>
              <input type="number" min="0" step="0.1" value={newAchat.montant}
                onChange={e => setNewAchat(n => ({ ...n, montant: e.target.value }))}
                placeholder="0,00" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Description *</div>
              <input autoFocus type="text" value={newAchat.description}
                onChange={e => setNewAchat(n => ({ ...n, description: e.target.value }))}
                placeholder="ex: Engrais bio 5kg..." style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addAchat} style={{
                flex: 2, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                color: C.green, borderRadius: 8, padding: "9px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>✓ Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, background: C.redBg, border: `1px solid ${C.redBorder}`,
                color: C.red, borderRadius: 8, padding: "9px",
                fontSize: 12, cursor: "pointer",
              }}>Annuler</button>
            </div>
          </div>
        )}

        {/* Résumé par catégorie */}
        {totalDepenses > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {parCategorie.filter(c => c.total > 0 || (c.key === "plants" && coutPlants > 0)).map(cat => {
              const total = cat.key === "plants" ? coutPlants + cat.total : cat.total;
              if (total === 0) return null;
              return (
                <div key={cat.key} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "6px 10px", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    {cat.emoji} {cat.label}
                  </div>
                  <div className="lora" style={{ fontSize: 13, color: C.red, fontWeight: 600, marginTop: 1 }}>
                    {fmt(total)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Liste chronologique */}
        {achatsSaison.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: C.textLight, fontSize: 13 }}>
            Aucun achat enregistré pour {saisonActive}
          </div>
        ) : (
          [...achatsSaison].sort((a, b) => b.date.localeCompare(a.date)).map((achat, idx, arr) => {
            const cat = CATEGORIES_ACHATS[achat.categorie] || CATEGORIES_ACHATS.autre;
            return (
              <div key={achat.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                borderBottom: idx < arr.length - 1 ? `1px dashed ${C.borderDash}` : "none",
              }}>
                <div style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>{cat.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{achat.description}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                    {cat.label} · {new Date(achat.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="lora" style={{ fontSize: 13, color: C.red, fontWeight: 600, flexShrink: 0 }}>
                  {fmt(achat.montant)}
                </div>
                <button onClick={() => onDeleteAchat(achat.id)}
                  style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
              </div>
            );
          })
        )}

        {achatsSaison.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>Total achats jardin</span>
            <span className="lora" style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>
              {fmt(totalAchats)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

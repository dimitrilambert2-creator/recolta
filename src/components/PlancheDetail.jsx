import { useState, useRef } from "react";
import EmojiPicker from "./EmojiPicker";

const COULEURS = ["#e05c3a","#c03020","#e07a2a","#c8a020","#7ecb50","#4a8c3a","#2d6040","#3a7840","#4a2060","#7c4d8a","#a02828","#3a6080"];
const ENTRETIEN_TYPES = ["Compost","Fumure","Paillage","Engrais vert","Désherbage","Binage","Arrosage","Traitement","Taille","Chaulage","Autre"];
const STATUTS = {
  active:      { label: "Active",          icon: "🟢" },
  repos:       { label: "En repos",        icon: "😴" },
  preparation: { label: "En préparation",  icon: "🌱" },
  hivernage:   { label: "Hivernage",       icon: "❄️" },
};

export default function PlancheDetail({ planche, saisonActive, C, onBack, onSelectPlant, onDeletePlant, onUpdatePlanche }) {
  const today = new Date().toISOString().slice(0, 10);

  const [showAddPlant, setShowAddPlant] = useState(false);
  const [newPlant, setNewPlant] = useState({
    nom: "", emoji: "🌱", quantite: "1", prixPot: "", prixMarche: "",
    unite: "kg", couleur: "#4a8c3a", dateAchat: today,
  });

  const [showEntretienForm, setShowEntretienForm] = useState(false);
  const [newEntretien, setNewEntretien] = useState({
    date: today, type: "Compost", quantite: "", unite: "L", note: "",
  });

  const [editingPlanche, setEditingPlanche] = useState(false);
  const [plancheEdit, setPlancheEdit] = useState({
    nom: planche.nom, surface: String(planche.surface || ""),
    statut: planche.statut, couleur: planche.couleur,
  });

  const [swipeId, setSwipeId] = useState(null);
  const swipeStartX = useRef(null);

  const getSaison = p => p.dateAchat ? new Date(p.dateAchat).getFullYear() : saisonActive;
  const plantsSaison = planche.plants.filter(p => getSaison(p) === saisonActive);
  const totalInvesti = plantsSaison.reduce((s, p) => s + p.coutTotal, 0);
  const totalValeur = plantsSaison.reduce((acc, p) =>
    acc + p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0), 0);

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

  const statut = STATUTS[planche.statut] || STATUTS.active;
  const derniereEntretien = planche.entretiens.length > 0
    ? [...planche.entretiens].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  function addPlant() {
    const qte = parseInt(newPlant.quantite) || 1;
    const prixPot = parseFloat(newPlant.prixPot) || 0;
    const prixMarche = parseFloat(newPlant.prixMarche) || 0;
    if (!newPlant.nom.trim()) return;
    onUpdatePlanche({
      ...planche,
      plants: [...planche.plants, {
        id: Date.now(),
        emoji: newPlant.emoji,
        nom: newPlant.nom.trim(),
        quantite: qte,
        prixPot,
        coutTotal: prixPot * qte,
        unite: newPlant.unite,
        prixMarche,
        couleur: newPlant.couleur,
        dateAchat: newPlant.dateAchat || today,
        recoltes: [],
        custom: true,
      }],
    });
    setNewPlant({ nom: "", emoji: "🌱", quantite: "1", prixPot: "", prixMarche: "", unite: "kg", couleur: "#4a8c3a", dateAchat: today });
    setShowAddPlant(false);
  }

  function addEntretien() {
    if (!newEntretien.type) return;
    onUpdatePlanche({
      ...planche,
      entretiens: [...planche.entretiens, {
        id: Date.now(),
        date: newEntretien.date,
        type: newEntretien.type,
        quantite: newEntretien.quantite,
        unite: newEntretien.unite,
        note: newEntretien.note,
      }],
    });
    setNewEntretien({ date: today, type: "Compost", quantite: "", unite: "L", note: "" });
    setShowEntretienForm(false);
  }

  function deleteEntretien(id) {
    onUpdatePlanche({ ...planche, entretiens: planche.entretiens.filter(e => e.id !== id) });
  }

  function savePlancheEdit() {
    onUpdatePlanche({
      ...planche,
      nom: plancheEdit.nom.trim() || planche.nom,
      surface: parseFloat(plancheEdit.surface) || 0,
      statut: plancheEdit.statut,
      couleur: plancheEdit.couleur,
    });
    setEditingPlanche(false);
  }

  function handleTouchStart(e) { swipeStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e, id) {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx < -60) setSwipeId(id);
    else if (dx > 20) setSwipeId(null);
    swipeStartX.current = null;
  }

  return (
    <div>
      <button onClick={onBack}
        style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, padding: "0 0 16px 0" }}>
        ← Retour
      </button>

      {/* ── En-tête planche ── */}
      <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
        {editingPlanche ? (
          <div>
            <div className="lora" style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>✎ Modifier la planche</div>
            <div style={{ marginBottom: 12 }}>
              <div style={labelStyle}>Nom</div>
              <input autoFocus type="text" value={plancheEdit.nom}
                onChange={e => setPlancheEdit(p => ({ ...p, nom: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Surface (m²)</div>
                <input type="number" min="0" step="0.5" value={plancheEdit.surface}
                  onChange={e => setPlancheEdit(p => ({ ...p, surface: e.target.value }))}
                  placeholder="ex: 4" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Statut</div>
                <select value={plancheEdit.statut}
                  onChange={e => setPlancheEdit(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>
                  <option value="active">🟢 Active</option>
                  <option value="repos">😴 En repos</option>
                  <option value="preparation">🌱 En préparation</option>
                  <option value="hivernage">❄️ Hivernage</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Couleur</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {COULEURS.map(c => (
                  <div key={c} onClick={() => setPlancheEdit(p => ({ ...p, couleur: c }))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer",
                      border: plancheEdit.couleur === c ? "2px solid #3a2e10" : "2px solid transparent" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={savePlancheEdit} style={{
                flex: 2, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                color: C.green, borderRadius: 10, padding: "10px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>✓ Enregistrer</button>
              <button onClick={() => setEditingPlanche(false)} style={{
                flex: 1, background: C.redBg, border: `1px solid ${C.redBorder}`,
                color: C.red, borderRadius: 10, padding: "10px",
                fontSize: 13, cursor: "pointer",
              }}>Annuler</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 5, height: 44, borderRadius: 3, background: planche.couleur, flexShrink: 0 }} />
                <div>
                  <div className="lora" style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{planche.nom}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                    {statut.icon} {statut.label}
                    {planche.surface > 0 && ` · ${planche.surface} m²`}
                    {derniereEntretien && ` · Entretien : ${new Date(derniereEntretien.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`}
                  </div>
                </div>
              </div>
              <button onClick={() => {
                setPlancheEdit({ nom: planche.nom, surface: String(planche.surface || ""), statut: planche.statut, couleur: planche.couleur });
                setEditingPlanche(true);
              }} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                ✎ Modifier
              </button>
            </div>

            {plantsSaison.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[
                  { l: "Plants", v: String(plantsSaison.length), c: C.text },
                  { l: "Investi", v: totalInvesti.toFixed(2).replace(".", ",") + " €", c: C.red },
                  { l: "Récolté", v: totalValeur.toFixed(2).replace(".", ",") + " €", c: C.green },
                ].map(s => (
                  <div key={s.l} style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "6px 8px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{s.l}</div>
                    <div className="lora" style={{ fontSize: 13, color: s.c, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Plants ── */}
      <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
        <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
          🌿 Plants — Saison {saisonActive}
        </div>

        {plantsSaison.length === 0 ? (
          <div style={{ textAlign: "center", padding: "12px 0", color: C.textLight, fontSize: 13 }}>
            Aucun plant pour cette saison
          </div>
        ) : (
          <div>
            {plantsSaison.map((p, idx) => {
              const valeur = p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0);
              const eco = valeur - p.coutTotal;
              const totalQ = p.recoltes.reduce((s, r) => s + r.quantite, 0);
              const swiped = swipeId === p.id;
              return (
                <div key={p.id} style={{ position: "relative", overflow: "hidden",
                  borderBottom: idx < plantsSaison.length - 1 ? `1px dashed ${C.borderDash}` : "none",
                }}>
                  <div style={{
                    position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
                    background: C.red, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <button onClick={() => { onDeletePlant(p.id); setSwipeId(null); }} style={{
                      background: "none", border: "none", color: "#fff",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}>
                      <span style={{ fontSize: 18 }}>🗑</span>Supprimer
                    </button>
                  </div>
                  <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={e => handleTouchEnd(e, p.id)}
                    onClick={() => { if (swiped) { setSwipeId(null); return; } onSelectPlant(p.id); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 0", cursor: "pointer",
                      transform: swiped ? "translateX(-80px)" : "translateX(0)",
                      transition: "transform 0.25s ease",
                      background: C.paper, position: "relative", zIndex: 1,
                    }}
                  >
                    <div style={{ fontSize: 26, width: 32, textAlign: "center", flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lora" style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                        {p.recoltes.length > 0
                          ? `${p.recoltes.length} récolte${p.recoltes.length > 1 ? "s" : ""} · ${totalQ.toFixed(p.unite === "kg" ? 1 : 0)} ${p.unite}`
                          : "Pas encore récolté"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        display: "inline-block",
                        background: eco > 0 ? C.greenBg : eco < -0.01 ? C.redBg : "transparent",
                        border: `1px solid ${eco > 0 ? C.greenBorder : eco < -0.01 ? C.redBorder : C.border}`,
                        borderRadius: 8, padding: "2px 8px",
                      }}>
                        <span className="lora" style={{ fontSize: 12, fontWeight: 600, color: eco > 0 ? C.green : eco < -0.01 ? C.red : C.textMuted }}>
                          {eco > 0 ? "+" : ""}{eco !== 0 ? eco.toFixed(2).replace(".", ",") + " €" : "—"}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: C.textLight, fontSize: 16, flexShrink: 0 }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => setShowAddPlant(true)} style={{
          width: "100%", background: "transparent",
          border: `1px dashed ${C.borderDash}`, borderRadius: 10,
          padding: "11px", cursor: "pointer", color: C.textMuted, fontSize: 13, marginTop: 10,
        }}>+ Ajouter un légume / fruit</button>
      </div>

      {/* ── Entretiens ── */}
      <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>🧴 Carnet d'entretien</div>
          <button onClick={() => setShowEntretienForm(f => !f)} style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`,
            color: C.green, borderRadius: 8, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>+ Ajouter</button>
        </div>

        {showEntretienForm && (
          <div style={{ background: C.bg, borderRadius: 10, padding: "12px", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Date</div>
                <input type="date" value={newEntretien.date}
                  onChange={e => setNewEntretien(n => ({ ...n, date: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Type</div>
                <select value={newEntretien.type}
                  onChange={e => setNewEntretien(n => ({ ...n, type: e.target.value }))} style={inputStyle}>
                  {ENTRETIEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Quantité</div>
                <input type="number" min="0" step="0.1" value={newEntretien.quantite}
                  onChange={e => setNewEntretien(n => ({ ...n, quantite: e.target.value }))}
                  placeholder="optionnel" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Unité</div>
                <select value={newEntretien.unite}
                  onChange={e => setNewEntretien(n => ({ ...n, unite: e.target.value }))} style={inputStyle}>
                  {["L","kg","g","m²","—"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Note</div>
              <input type="text" value={newEntretien.note}
                onChange={e => setNewEntretien(n => ({ ...n, note: e.target.value }))}
                placeholder="Produit utilisé, observations..." style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addEntretien} style={{
                flex: 2, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                color: C.green, borderRadius: 8, padding: "9px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>✓ Enregistrer</button>
              <button onClick={() => setShowEntretienForm(false)} style={{
                flex: 1, background: C.redBg, border: `1px solid ${C.redBorder}`,
                color: C.red, borderRadius: 8, padding: "9px",
                fontSize: 12, cursor: "pointer",
              }}>Annuler</button>
            </div>
          </div>
        )}

        {planche.entretiens.length === 0 ? (
          <div style={{ textAlign: "center", padding: "12px 0", color: C.textLight, fontSize: 13 }}>
            Aucun entretien enregistré
          </div>
        ) : (
          [...planche.entretiens].sort((a, b) => b.date.localeCompare(a.date)).map((e, idx, arr) => (
            <div key={e.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0",
              borderBottom: idx < arr.length - 1 ? `1px dashed ${C.borderDash}` : "none",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: C.bg, border: `1px solid ${C.border}`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 9, color: C.textMuted, lineHeight: 1.4, textAlign: "center",
              }}>
                {new Date(e.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                  {e.type}
                  {e.quantite && e.unite && e.unite !== "—" && (
                    <span style={{ fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>{e.quantite} {e.unite}</span>
                  )}
                </div>
                {e.note && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{e.note}</div>}
              </div>
              <button onClick={() => deleteEntretien(e.id)}
                style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
            </div>
          ))
        )}
      </div>

      {/* ── Modal ajout plant ── */}
      {showAddPlant && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
          <div style={{
            width: "100%", maxWidth: 640, margin: "0 auto",
            background: C.paper, borderRadius: "18px 18px 0 0",
            border: `1px solid ${C.border}`, padding: "20px 20px 36px",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nouveau plant</div>
              <button onClick={() => setShowAddPlant(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 60 }}>
                <div style={labelStyle}>Emoji</div>
                <EmojiPicker value={newPlant.emoji} onChange={e => setNewPlant(n => ({ ...n, emoji: e }))} C={C} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Nom *</div>
                <input autoFocus type="text" value={newPlant.nom}
                  onChange={e => setNewPlant(n => ({ ...n, nom: e.target.value }))}
                  placeholder="ex: Tomate, Basilic..." style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Date d'achat</div>
                <input type="date" value={newPlant.dateAchat}
                  onChange={e => setNewPlant(n => ({ ...n, dateAchat: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Nb de plants</div>
                <input type="number" min="1" step="1" value={newPlant.quantite}
                  onChange={e => setNewPlant(n => ({ ...n, quantite: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Coût (€)</div>
                <input type="number" min="0" step="0.1" value={newPlant.prixPot}
                  onChange={e => setNewPlant(n => ({ ...n, prixPot: e.target.value }))}
                  placeholder="0,00" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Unité</div>
                <select value={newPlant.unite}
                  onChange={e => setNewPlant(n => ({ ...n, unite: e.target.value }))} style={inputStyle}>
                  <option value="kg">kg</option>
                  <option value="unite">à l'unité</option>
                  <option value="botte">botte</option>
                  <option value="litre">litre</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Prix marché bio (€)</div>
                <input type="number" min="0" step="0.1" value={newPlant.prixMarche}
                  onChange={e => setNewPlant(n => ({ ...n, prixMarche: e.target.value }))}
                  placeholder="prix/unité" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={labelStyle}>Couleur</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {COULEURS.map(c => (
                  <div key={c} onClick={() => setNewPlant(n => ({ ...n, couleur: c }))}
                    style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer",
                      border: newPlant.couleur === c ? "2px solid #3a2e10" : "2px solid transparent" }} />
                ))}
              </div>
            </div>
            <button onClick={addPlant} style={{
              width: "100%", background: C.greenBg, border: `1px solid ${C.greenBorder}`,
              color: C.green, borderRadius: 10, padding: "12px",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>Ajouter à {planche.nom}</button>
          </div>
        </div>
      )}
    </div>
  );
}

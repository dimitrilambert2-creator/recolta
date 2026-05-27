import { useState, useEffect, useRef } from "react";
import { INITIAL_PLANTS, SAMPLE_PLANTS } from "../constants/plants";
import { formatEur, formatDate } from "../utils/format";
import CalendrierView from "./CalendrierView";
import GlobalView from "./GlobalView";
import ChartRecoltes from "./ChartRecoltes";

const COULEURS = ["#e05c3a","#c03020","#e07a2a","#c8a020","#7ecb50","#4a8c3a","#2d6040","#3a7840","#4a2060","#7c4d8a","#a02828","#3a6080"];

const C = {
  bg: "#fdf6e8",
  paper: "#fff9ee",
  border: "#e0d0a0",
  borderDash: "#d4c8a0",
  text: "#3a2e10",
  textMuted: "#a09060",
  textLight: "#c0b080",
  green: "#507030",
  greenBg: "#e8f0d0",
  greenBorder: "#b0d080",
  red: "#a04020",
  redBg: "#f8e8e0",
  redBorder: "#e0b0a0",
  amber: "#806020",
};

const CSV_MODELE = `date_achat;nom;emoji;quantite_plants;cout_pot;prix_marche;unite;recolte_date;recolte_quantite
2025-05-01;Tomate cerise;🍒;3;2.45;6.50;kg;2025-09-01;6.0
2025-05-01;Courgette;🥒;4;1.50;3.50;kg;;
2025-05-01;Haricot vert;🫘;1;0;9.00;kg;2025-08-01;11.154
2025-05-01;Fraise;🍓;1;0;15.00;kg;2025-07-01;0.708`;

export default function PotagerTracker() {
  const [plants, setPlants] = useState(() => {
    try {
      const saved = localStorage.getItem("potager_plants");
      if (saved) return JSON.parse(saved);
      localStorage.setItem("recolta_has_samples", "true");
      return SAMPLE_PLANTS;
    } catch { return INITIAL_PLANTS; }
  });

  const [hasSamples, setHasSamples] = useState(() => {
    try { return localStorage.getItem("recolta_has_samples") === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("potager_plants", JSON.stringify(plants)); }
    catch {}
  }, [plants]);

  useEffect(() => {
    try {
      if (hasSamples) localStorage.setItem("recolta_has_samples", "true");
      else localStorage.removeItem("recolta_has_samples");
    } catch {}
  }, [hasSamples]);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), quantite: "", note: "" });
  const [editPrix, setEditPrix] = useState(null);
  const [editRecolte, setEditRecolte] = useState(null);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [newPlant, setNewPlant] = useState({ nom: "", emoji: "🌱", quantite: "1", prixPot: "", prixMarche: "", unite: "kg", couleur: "#4a8c3a", dateAchat: new Date().toISOString().slice(0, 10) });
  const [editPlant, setEditPlant] = useState(null);
  const [view, setView] = useState("dashboard");
  const [saisonActive, setSaisonActive] = useState(new Date().getFullYear());
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);
  const [swipeId, setSwipeId] = useState(null);
  const [deleted, setDeleted] = useState(null);
  const swipeStartX = useRef(null);

  const getSaison = p => p.dateAchat ? new Date(p.dateAchat).getFullYear() : (p.saison || 2026);
  const saisons = [...new Set(plants.map(getSaison))].sort((a, b) => b - a);
  const plantsSaison = plants.filter(p => getSaison(p) === saisonActive);

  const totalInvesti = plantsSaison.reduce((s, p) => s + p.coutTotal, 0);
  const totalValeur = plantsSaison.reduce((acc, p) =>
    acc + p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0), 0);
  const economie = totalValeur - totalInvesti;

  const chartData = (() => {
    const allRecoltes = plantsSaison.flatMap(p =>
      p.recoltes.map(r => ({ date: r.date, valeur: r.quantite * p.prixMarche }))
    );
    if (allRecoltes.length === 0) return [];
    allRecoltes.sort((a, b) => a.date.localeCompare(b.date));
    const weeks = {};
    allRecoltes.forEach(r => {
      const d = new Date(r.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + r.valeur;
    });
    const sorted = Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
    let cumul = 0;
    return sorted.map(([date, val]) => {
      cumul += val;
      return { date, val: parseFloat(val.toFixed(2)), cumul: parseFloat(cumul.toFixed(2)) };
    });
  })();


  const plant = selected ? plants.find(p => p.id === selected) : null;
  const plantValeur = plant ? plant.recoltes.reduce((s, r) => s + r.quantite * plant.prixMarche, 0) : 0;
  const plantEco = plant ? plantValeur - plant.coutTotal : 0;

  const inputStyle = {
    width: "100%", background: "#fff9ee",
    border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "8px 10px",
    fontSize: 13, boxSizing: "border-box",
    fontFamily: "'Nunito', sans-serif",
    outline: "none",
  };
  const labelStyle = { fontSize: 10, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1.5 };

  // ── Actions ──────────────────────────────────────────────────────

  function addRecolte(plantId) {
    const q = parseFloat(form.quantite);
    if (!q || q <= 0) return;
    setPlants(prev => prev.map(p =>
      p.id === plantId
        ? { ...p, recoltes: [...p.recoltes, { id: Date.now(), date: form.date, quantite: q, note: form.note }] }
        : p
    ));
    setForm({ date: new Date().toISOString().slice(0, 10), quantite: "", note: "" });
  }

  function deleteRecolte(plantId, recolteId) {
    setPlants(prev => prev.map(p =>
      p.id === plantId ? { ...p, recoltes: p.recoltes.filter(r => r.id !== recolteId) } : p
    ));
  }

  function saveEditRecolte(plantId) {
    const q = parseFloat(editRecolte.quantite);
    if (!q || q <= 0) return;
    setPlants(prev => prev.map(p =>
      p.id === plantId
        ? { ...p, recoltes: p.recoltes.map(r => r.id === editRecolte.id ? { ...r, date: editRecolte.date, quantite: q, note: editRecolte.note } : r) }
        : p
    ));
    setEditRecolte(null);
  }

  function updatePrix(plantId, newPrix) {
    const val = parseFloat(newPrix);
    if (!val || val <= 0) return;
    setPlants(prev => prev.map(p => p.id === plantId ? { ...p, prixMarche: val } : p));
    setEditPrix(null);
  }

  function addPlant() {
    const qte = parseInt(newPlant.quantite) || 1;
    const prixPot = parseFloat(newPlant.prixPot) || 0;
    const prixMarche = parseFloat(newPlant.prixMarche);
    if (!newPlant.nom.trim() || !prixMarche) return;
    setPlants(prev => [...prev, {
      id: Date.now(),
      emoji: newPlant.emoji,
      nom: newPlant.nom.trim(),
      quantite: qte,
      prixPot,
      coutTotal: prixPot * qte,
      unite: newPlant.unite,
      prixMarche,
      couleur: newPlant.couleur,
      dateAchat: newPlant.dateAchat || new Date().toISOString().slice(0, 10),
      recoltes: [],
      custom: true,
    }]);
    setNewPlant({ nom: "", emoji: "🌱", quantite: "1", prixPot: "", prixMarche: "", unite: "kg", couleur: "#4a8c3a", dateAchat: new Date().toISOString().slice(0, 10) });
    setShowAddPlant(false);
  }

  function deletePlant(plantId) {
    const plant = plants.find(p => p.id === plantId);
    setPlants(prev => prev.filter(p => p.id !== plantId));
    setSelected(null);
    setSwipeId(null);
    if (deleted?.timeout) clearTimeout(deleted.timeout);
    const timeout = setTimeout(() => setDeleted(null), 5000);
    setDeleted({ plant, timeout });
  }

  function annulerSuppression() {
    if (!deleted) return;
    clearTimeout(deleted.timeout);
    setPlants(prev => [...prev, deleted.plant]);
    setDeleted(null);
  }

  function reconduirePlant(plant) {
    const anneeSuivante = getSaison(plant) + 1;
    const dejaExistant = plants.find(p => p.nom === plant.nom && getSaison(p) === anneeSuivante);
    if (dejaExistant) {
      alert(`Une version de "${plant.nom}" existe déjà pour ${anneeSuivante}.`);
      return;
    }
    const newId = Date.now();
    const dateAchat = `${anneeSuivante}-${(plant.dateAchat || "2026-05-01").slice(5)}`;
    setPlants(prev => [...prev, { ...plant, id: newId, dateAchat, recoltes: [], custom: true }]);
    setSaisonActive(anneeSuivante);
    setSelected(newId);
  }

  function saveEditPlant(plantId) {
    const qte = parseInt(editPlant.quantite) || 1;
    const prixPot = parseFloat(editPlant.prixPot) || 0;
    const prixMarche = parseFloat(editPlant.prixMarche);
    if (!editPlant.nom.trim() || !prixMarche) return;
    setPlants(prev => prev.map(p => p.id === plantId ? {
      ...p,
      nom: editPlant.nom.trim(),
      emoji: editPlant.emoji,
      quantite: qte,
      prixPot,
      coutTotal: prixPot * qte,
      prixMarche,
      unite: editPlant.unite,
      couleur: editPlant.couleur,
      dateAchat: editPlant.dateAchat || p.dateAchat,
    } : p));
    setEditPlant(null);
  }

  function effacerExemples() {
    setPlants([]);
    setHasSamples(false);
    setSelected(null);
    setSaisonActive(new Date().getFullYear());
  }

  function telechargerModele() {
    const blob = new Blob([CSV_MODELE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recolta_modele.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text) {
    const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return { error: "Le fichier est vide ou ne contient qu'une entête.", plants: [] };
    const header = lines[0].split(";").map(h => h.trim().toLowerCase());
    const required = ["date_achat","nom","prix_marche","unite"];
    const missing = required.filter(r => !header.includes(r));
    if (missing.length > 0) return { error: `Colonnes manquantes : ${missing.join(", ")}`, plants: [] };

    const get = (row, key) => {
      const idx = header.indexOf(key);
      return idx >= 0 ? (row[idx] || "").trim() : "";
    };

    const plantsMap = {};
    const errors = [];

    lines.slice(1).forEach((line, li) => {
      const row = line.split(";");
      const nom = get(row, "nom");
      const dateAchat = get(row, "date_achat");
      const emoji = get(row, "emoji") || "🌱";
      const quantite = parseInt(get(row, "quantite_plants")) || 1;
      const coutPot = parseFloat(get(row, "cout_pot")) || 0;
      const prixMarche = parseFloat(get(row, "prix_marche").replace(",", "."));
      const unite = get(row, "unite") || "kg";
      const recolteDate = get(row, "recolte_date");
      const recolteQte = parseFloat(get(row, "recolte_quantite").replace(",", "."));

      if (!nom) { errors.push(`Ligne ${li + 2} : nom manquant`); return; }
      if (!prixMarche) { errors.push(`Ligne ${li + 2} : prix_marche manquant`); return; }

      const key = `${nom}__${dateAchat}`;
      if (!plantsMap[key]) {
        plantsMap[key] = {
          id: Date.now() + Math.random(),
          nom, emoji, dateAchat, quantite,
          prixPot: coutPot, coutTotal: coutPot * quantite,
          prixMarche, unite, couleur: "#4a8c3a",
          recoltes: [], custom: true,
        };
      }
      if (recolteDate && !isNaN(recolteQte) && recolteQte > 0) {
        plantsMap[key].recoltes.push({
          id: Date.now() + Math.random(),
          date: recolteDate, quantite: recolteQte, note: "Import CSV",
        });
      }
    });

    return { error: errors.length > 0 ? errors.join("\n") : "", plants: Object.values(plantsMap) };
  }

  function handleCsvFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const { error, plants } = parseCsv(ev.target.result);
      if (error) { setCsvError(error); setCsvPreview([]); }
      else { setCsvError(""); setCsvPreview(plants); }
    };
    reader.readAsText(file, "utf-8");
  }

  function confirmerImportCsv() {
    const idsExistants = new Set(plants.map(p => p.nom + "__" + p.dateAchat));
    const aAjouter = csvPreview.filter(p => !idsExistants.has(p.nom + "__" + p.dateAchat));
    setPlants(prev => [...prev, ...aAjouter]);
    if (aAjouter.length > 0) setSaisonActive(new Date(aAjouter[0].dateAchat).getFullYear());
    setShowCsvImport(false);
    setCsvPreview([]);
    setCsvError("");
  }

  function handleTouchStart(e, id) {
    swipeStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e, id) {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx < -60) setSwipeId(id);
    else if (dx > 20) setSwipeId(null);
    swipeStartX.current = null;
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, #e8dfc818 28px)",
      fontFamily: "'Nunito', sans-serif",
      color: C.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap');
        .lora { font-family: 'Lora', serif; }
        input, select, button { font-family: 'Nunito', sans-serif; }
        input:focus, select:focus { border-color: ${C.green} !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: C.paper, borderBottom: `2px solid ${C.borderDash}`,
        padding: "18px 20px 14px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 3, textTransform: "uppercase" }}>
                Journal · Saison {saisonActive}
              </div>
              <div className="lora" style={{ fontSize: 24, color: C.text, fontWeight: 700, marginTop: 2 }}>
                🌿 Mon Potager
              </div>
            </div>
          </div>

          {/* Sélecteur de saison */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
            {saisons.map(s => (
              <button key={s} onClick={() => { setSaisonActive(s); setSelected(null); }}
                style={{
                  padding: "5px 14px", borderRadius: 20,
                  background: saisonActive === s && view === "dashboard" ? C.text : C.bg,
                  border: `1px solid ${C.border}`,
                  color: saisonActive === s && view === "dashboard" ? "#fff9ee" : C.textMuted,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                {s}
              </button>
            ))}
            <button
              onClick={() => { setView(view === "global" ? "dashboard" : "global"); setSelected(null); }}
              style={{
                marginLeft: "auto", padding: "5px 14px", borderRadius: 20,
                background: view === "global" ? C.text : C.bg,
                border: `1px solid ${C.border}`,
                color: view === "global" ? "#fff9ee" : C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
              📊 Global
            </button>
            <button
              onClick={() => { setView(view === "calendrier" ? "dashboard" : "calendrier"); setSelected(null); }}
              style={{
                padding: "5px 14px", borderRadius: 20,
                background: view === "calendrier" ? C.text : C.bg,
                border: `1px solid ${C.border}`,
                color: view === "calendrier" ? "#fff9ee" : C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
              📅 Calendrier
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[
              { l: "Investi", v: formatEur(totalInvesti), c: C.red },
              { l: "Récolté", v: formatEur(totalValeur), c: C.green },
              { l: "Économie", v: (economie >= 0 ? "+" : "") + formatEur(economie), c: economie >= 0 ? C.green : C.red },
            ].map(s => (
              <div key={s.l} style={{
                flex: 1, background: "#fff9ee", borderRadius: 10,
                padding: "8px 8px", border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{s.l}</div>
                <div className="lora" style={{ fontSize: 14, color: s.c, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px" }}>

        {view === "global" ? (
          <GlobalView plants={plants} saisons={saisons} C={C} />

        ) : view === "calendrier" ? (
          <CalendrierView plants={plants} C={C} />

        ) : !selected ? (
          /* ── VUE LISTE ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Bannière de bienvenue */}
            {hasSamples && (
              <div style={{
                background: "linear-gradient(135deg, #f4f9e8 0%, #e8f0d0 100%)",
                border: `1px solid ${C.greenBorder}`,
                borderRadius: 14, padding: "18px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌱</div>
                <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  Bienvenue dans Récolta !
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7, marginBottom: 14 }}>
                  Ces plants sont des <strong style={{ color: C.text }}>exemples</strong> pour te montrer comment fonctionne l&apos;app — récoltes, calcul d&apos;économies, graphique cumulatif.
                  Quand tu es prêt·e, efface-les et saisis tes propres plants.
                </div>
                <button onClick={effacerExemples} style={{
                  width: "100%", background: C.redBg,
                  border: `1px solid ${C.redBorder}`,
                  color: C.red, borderRadius: 10, padding: "10px",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                  🗑 Effacer les exemples et partir de zéro
                </button>
              </div>
            )}

            {chartData.length > 0 && (
              <div style={{
                background: C.paper, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "16px", marginBottom: 14,
              }}>
                <div className="lora" style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 12 }}>
                  📈 Récoltes cumulées {saisonActive}
                </div>
                <ChartRecoltes data={chartData} totalInvesti={totalInvesti} />
              </div>
            )}

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
                    position: "absolute", right: 0, top: 0, bottom: 0,
                    width: 80, background: C.red,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "0 8px 8px 0",
                  }}>
                    <button onClick={() => { deletePlant(p.id); setSwipeId(null); }} style={{
                      background: "none", border: "none", color: "#fff",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}>
                      <span style={{ fontSize: 18 }}>🗑</span>
                      Supprimer
                    </button>
                  </div>

                  <div
                    onTouchStart={e => handleTouchStart(e, p.id)}
                    onTouchEnd={e => handleTouchEnd(e, p.id)}
                    onClick={() => { if (swiped) { setSwipeId(null); return; } setSelected(p.id); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 0", cursor: "pointer",
                      transform: swiped ? "translateX(-80px)" : "translateX(0)",
                      transition: "transform 0.25s ease",
                      background: C.bg, position: "relative", zIndex: 1,
                    }}
                  >
                    <div style={{ fontSize: 28, width: 36, textAlign: "center", flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lora" style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                        {p.recoltes.length > 0
                          ? `${p.recoltes.length} récolte${p.recoltes.length > 1 ? "s" : ""} · ${totalQ.toFixed(p.unite === "kg" ? 1 : 0)}${p.unite === "kg" ? " kg" : p.unite === "botte" ? " botte(s)" : " unité(s)"}`
                          : "Pas encore récolté"}
                      </div>
                      {valeur > 0 && (
                        <div style={{ marginTop: 5, background: "#ede8d8", borderRadius: 3, height: 3, overflow: "hidden" }}>
                          <div style={{
                            width: Math.min(100, (valeur / (p.coutTotal || 1)) * 100) + "%",
                            height: "100%", background: eco >= 0 ? "#70a840" : p.couleur,
                            borderRadius: 3, transition: "width 0.3s",
                          }} />
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        display: "inline-block",
                        background: eco >= 0 ? C.greenBg : eco < -0.01 ? C.redBg : "transparent",
                        border: `1px solid ${eco >= 0 ? C.greenBorder : eco < -0.01 ? C.redBorder : C.border}`,
                        borderRadius: 8, padding: "2px 8px",
                      }}>
                        <span className="lora" style={{ fontSize: 13, fontWeight: 600, color: eco >= 0 ? C.green : eco < -0.01 ? C.red : C.textMuted }}>
                          {eco > 0 ? "+" : ""}{eco !== 0 ? formatEur(eco) : "—"}
                        </span>
                      </div>
                      {totalQ > 0 && (
                        <div style={{ fontSize: 11, color: C.amber, marginTop: 3, fontWeight: 600 }}>
                          {totalQ.toFixed(p.unite === "kg" ? 1 : 0)}{p.unite === "kg" ? " kg" : p.unite === "botte" ? " botte(s)" : p.unite === "litre" ? " L" : " u."}
                        </div>
                      )}
                    </div>
                    <div style={{ color: C.textLight, fontSize: 16, flexShrink: 0 }}>›</div>
                  </div>
                </div>
              );
            })}

            <button onClick={() => setShowAddPlant(true)} style={{
              width: "100%", background: "transparent",
              border: `1px dashed ${C.borderDash}`, borderRadius: 12,
              padding: "13px", cursor: "pointer",
              color: C.textMuted, fontSize: 13, marginTop: 14,
            }}>
              + Ajouter un légume / fruit
            </button>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={telechargerModele} style={{
                flex: 1, background: "transparent",
                border: `1px dashed ${C.borderDash}`, borderRadius: 10,
                padding: "10px", cursor: "pointer", color: C.textMuted, fontSize: 12,
              }}>📄 Modèle CSV</button>
              <button onClick={() => setShowCsvImport(true)} style={{
                flex: 1, background: "transparent",
                border: `1px dashed ${C.borderDash}`, borderRadius: 10,
                padding: "10px", cursor: "pointer", color: C.textMuted, fontSize: 12,
              }}>📥 Importer CSV</button>
            </div>

            {/* Modal import CSV */}
            {showCsvImport && (
              <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", maxWidth: 640, margin: "0 auto",
                  background: C.paper, borderRadius: "18px 18px 0 0",
                  border: `1px solid ${C.border}`, padding: "20px 20px 36px",
                  maxHeight: "80vh", overflowY: "auto",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Importer un CSV</div>
                    <button onClick={() => { setShowCsvImport(false); setCsvPreview([]); setCsvError(""); }}
                      style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
                  </div>

                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Format des colonnes (séparateur ;)</div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8, fontFamily: "monospace" }}>
                      date_achat · nom · emoji · quantite_plants<br/>
                      cout_pot · prix_marche · unite<br/>
                      recolte_date · recolte_quantite
                    </div>
                    <button onClick={telechargerModele} style={{
                      marginTop: 10, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                      color: C.green, borderRadius: 8, padding: "6px 12px",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>📄 Télécharger le modèle</button>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={labelStyle}>Sélectionner le fichier CSV</div>
                    <input type="file" accept=".csv,.txt" onChange={handleCsvFile}
                      style={{ fontSize: 13, color: C.text, marginTop: 4 }} />
                  </div>

                  {csvError && (
                    <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: 10, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: C.red, whiteSpace: "pre-line" }}>{csvError}</div>
                    </div>
                  )}

                  {csvPreview.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginBottom: 8 }}>
                        ✓ {csvPreview.length} plant{csvPreview.length > 1 ? "s" : ""} détecté{csvPreview.length > 1 ? "s" : ""}
                      </div>
                      {csvPreview.map((p, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 0", borderBottom: `1px dashed ${C.borderDash}`,
                        }}>
                          <span style={{ fontSize: 20 }}>{p.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div className="lora" style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{p.nom}</div>
                            <div style={{ fontSize: 10, color: C.textMuted }}>
                              {new Date(p.dateAchat).getFullYear()} · {p.recoltes.length} récolte{p.recoltes.length > 1 ? "s" : ""}
                              {p.coutTotal > 0 ? ` · ${formatEur(p.coutTotal)} investi` : ""}
                              {" · "}{formatEur(p.prixMarche)}/{p.unite === "kg" ? "kg" : "unité"}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
                            {formatEur(p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0))}
                          </div>
                        </div>
                      ))}
                      <button onClick={confirmerImportCsv} style={{
                        width: "100%", marginTop: 14,
                        background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                        color: C.green, borderRadius: 10, padding: "12px",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                      }}>
                        Importer {csvPreview.length} plant{csvPreview.length > 1 ? "s" : ""}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal ajout plant */}
            {showAddPlant && (
              <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", maxWidth: 640, margin: "0 auto",
                  background: C.paper, borderRadius: "18px 18px 0 0",
                  border: `1px solid ${C.border}`, padding: "20px 20px 36px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nouveau plant</div>
                    <button onClick={() => setShowAddPlant(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 60 }}>
                      <div style={labelStyle}>Emoji</div>
                      <input type="text" value={newPlant.emoji} onChange={e => setNewPlant(n => ({ ...n, emoji: e.target.value }))}
                        style={{ ...inputStyle, fontSize: 20, textAlign: "center", padding: "6px" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Nom *</div>
                      <input autoFocus type="text" value={newPlant.nom} onChange={e => setNewPlant(n => ({ ...n, nom: e.target.value }))}
                        placeholder="ex: Framboisier, Basilic..." style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Date d&apos;achat</div>
                      <input type="date" value={newPlant.dateAchat}
                        onChange={e => setNewPlant(n => ({ ...n, dateAchat: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Nb de plants</div>
                      <input type="number" min="1" step="1" value={newPlant.quantite}
                        onChange={e => setNewPlant(n => ({ ...n, quantite: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Coût d&apos;achat (€)</div>
                      <input type="number" min="0" step="0.1" value={newPlant.prixPot}
                        onChange={e => setNewPlant(n => ({ ...n, prixPot: e.target.value }))} placeholder="0,00" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Unité</div>
                      <select value={newPlant.unite} onChange={e => setNewPlant(n => ({ ...n, unite: e.target.value }))} style={inputStyle}>
                        <option value="kg">kg</option>
                        <option value="unite">à l&apos;unité</option>
                        <option value="botte">botte</option>
                        <option value="litre">litre</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Prix marché bio (€) *</div>
                      <input type="number" min="0" step="0.1" value={newPlant.prixMarche}
                        onChange={e => setNewPlant(n => ({ ...n, prixMarche: e.target.value }))} placeholder="prix/unité" style={inputStyle} />
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
                  }}>Ajouter au potager</button>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── VUE DETAIL ── */
          <div>
            <button onClick={() => { setSelected(null); setEditPlant(null); }}
              style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, padding: "0 0 16px 0" }}>
              ← Retour
            </button>

            {plant && (
              <>
                <div style={{
                  background: C.paper, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: "18px", marginBottom: 14,
                }}>
                  {editPlant ? (
                    <div>
                      <div className="lora" style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>✎ Modifier le plant</div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 60 }}>
                          <div style={labelStyle}>Emoji</div>
                          <input type="text" value={editPlant.emoji} onChange={e => setEditPlant(ep => ({ ...ep, emoji: e.target.value }))}
                            style={{ ...inputStyle, fontSize: 20, textAlign: "center", padding: "6px" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={labelStyle}>Nom</div>
                          <input autoFocus type="text" value={editPlant.nom} onChange={e => setEditPlant(ep => ({ ...ep, nom: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={labelStyle}>Date d&apos;achat</div>
                          <input type="date" value={editPlant.dateAchat}
                            onChange={e => setEditPlant(ep => ({ ...ep, dateAchat: e.target.value }))} style={inputStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={labelStyle}>Nb de plants</div>
                          <input type="number" min="1" value={editPlant.quantite} onChange={e => setEditPlant(ep => ({ ...ep, quantite: e.target.value }))} style={inputStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={labelStyle}>Coût d&apos;achat (€)</div>
                          <input type="number" min="0" step="0.1" value={editPlant.prixPot} onChange={e => setEditPlant(ep => ({ ...ep, prixPot: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={labelStyle}>Unité</div>
                          <select value={editPlant.unite} onChange={e => setEditPlant(ep => ({ ...ep, unite: e.target.value }))} style={inputStyle}>
                            <option value="kg">kg</option>
                            <option value="unite">à l&apos;unité</option>
                            <option value="botte">botte</option>
                            <option value="litre">litre</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={labelStyle}>Prix marché bio (€)</div>
                          <input type="number" min="0" step="0.1" value={editPlant.prixMarche} onChange={e => setEditPlant(ep => ({ ...ep, prixMarche: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div style={labelStyle}>Couleur</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                          {COULEURS.map(c => (
                            <div key={c} onClick={() => setEditPlant(ep => ({ ...ep, couleur: c }))}
                              style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer",
                                border: editPlant.couleur === c ? "2px solid #3a2e10" : "2px solid transparent" }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => saveEditPlant(plant.id)} style={{
                          flex: 2, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                          color: C.green, borderRadius: 10, padding: "10px",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}>✓ Enregistrer</button>
                        <button onClick={() => setEditPlant(null)} style={{
                          flex: 1, background: C.redBg, border: `1px solid ${C.redBorder}`,
                          color: C.red, borderRadius: 10, padding: "10px",
                          fontSize: 13, cursor: "pointer",
                        }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 38, lineHeight: 1 }}>{plant.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div className="lora" style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{plant.nom}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                            {plant.quantite} plant{plant.quantite > 1 ? "s" : ""}
                            {plant.dateAchat ? ` · Acheté le ${new Date(plant.dateAchat).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                            {plant.prixPot > 0 ? ` · ${formatEur(plant.prixPot)}/pot` : ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <button onClick={() => setEditPlant({ nom: plant.nom, emoji: plant.emoji, quantite: String(plant.quantite), prixPot: String(plant.prixPot), prixMarche: String(plant.prixMarche), unite: plant.unite, couleur: plant.couleur, dateAchat: plant.dateAchat || new Date().toISOString().slice(0, 10) })}
                            style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", padding: 0 }}>
                            ✎ Modifier
                          </button>
                          <div>
                            <button onClick={() => reconduirePlant(plant)}
                              style={{ background: "none", border: "none", color: C.green, fontSize: 12, cursor: "pointer", padding: 0, marginTop: 4 }}>
                              🌱 Reconduire {getSaison(plant) + 1}
                            </button>
                          </div>
                          {plant.custom && (
                            <div>
                              <button onClick={() => deletePlant(plant.id)}
                                style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", padding: 0, marginTop: 4 }}>
                                🗑 Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                        {[
                          { l: "Investi", v: formatEur(plant.coutTotal), c: C.red },
                          { l: "Valeur récoltée", v: formatEur(plantValeur), c: C.green },
                          { l: "Économie", v: (plantEco >= 0 ? "+" : "") + formatEur(plantEco), c: plantEco >= 0 ? C.green : C.red },
                          {
                            l: plant.unite === "kg" ? "Kg récoltés" : plant.unite === "botte" ? "Bottes" : plant.unite === "litre" ? "Litres" : "Unités",
                            v: plant.recoltes.reduce((s, r) => s + r.quantite, 0).toFixed(plant.unite === "kg" ? 1 : 0) + (plant.unite === "kg" ? " kg" : plant.unite === "botte" ? " bot." : plant.unite === "litre" ? " L" : " u."),
                            c: C.amber,
                          },
                        ].map(s => (
                          <div key={s.l} style={{ flex: 1, background: C.bg, borderRadius: 8, padding: "8px", border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>{s.l}</div>
                            <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.v}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: C.textMuted }}>Prix marché bio :</span>
                        {editPrix === plant.id ? (
                          <input autoFocus type="number" step="0.1" defaultValue={plant.prixMarche}
                            onBlur={e => updatePrix(plant.id, e.target.value)}
                            onKeyDown={e => e.key === "Enter" && updatePrix(plant.id, e.target.value)}
                            style={{ ...inputStyle, width: 80 }} />
                        ) : (
                          <button onClick={() => setEditPrix(plant.id)} style={{
                            background: C.bg, border: `1px solid ${C.border}`,
                            color: C.amber, borderRadius: 6, padding: "3px 10px",
                            fontSize: 12, cursor: "pointer",
                          }}>
                            {formatEur(plant.prixMarche)}/{plant.unite === "kg" ? "kg" : plant.unite === "botte" ? "botte" : plant.unite === "litre" ? "litre" : "unité"} ✎
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Ajouter récolte */}
                <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
                  <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>+ Ajouter une récolte</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Date</div>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Quantité ({plant.unite === "kg" ? "kg" : plant.unite === "botte" ? "bottes" : "unités"})</div>
                      <input type="number" step={plant.unite === "kg" ? "0.1" : "1"} min="0" value={form.quantite}
                        onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
                        placeholder={plant.unite === "kg" ? "0.0" : "0"} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={labelStyle}>Note (optionnel)</div>
                    <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="ex: belle récolte, 1ère tomate..." style={inputStyle} />
                  </div>
                  <button onClick={() => addRecolte(plant.id)} style={{
                    width: "100%", background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                    color: C.green, borderRadius: 8, padding: "10px",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>Enregistrer la récolte</button>
                </div>

                {/* Historique */}
                {plant.recoltes.length > 0 ? (
                  <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
                    <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Historique</div>
                    {[...plant.recoltes].reverse().map(r => (
                      <div key={r.id} style={{ borderBottom: `1px dashed ${C.borderDash}`, paddingBottom: 10, marginBottom: 10 }}>
                        {editRecolte && editRecolte.id === r.id ? (
                          <div>
                            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={labelStyle}>Date</div>
                                <input type="date" value={editRecolte.date} onChange={e => setEditRecolte(er => ({ ...er, date: e.target.value }))} style={inputStyle} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={labelStyle}>Quantité</div>
                                <input autoFocus type="number" step={plant.unite === "kg" ? "0.1" : "1"} min="0"
                                  value={editRecolte.quantite} onChange={e => setEditRecolte(er => ({ ...er, quantite: e.target.value }))} style={inputStyle} />
                              </div>
                            </div>
                            <input type="text" value={editRecolte.note} onChange={e => setEditRecolte(er => ({ ...er, note: e.target.value }))}
                              placeholder="Note..." style={{ ...inputStyle, marginBottom: 8 }} />
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => saveEditRecolte(plant.id)} style={{
                                flex: 1, background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                                color: C.green, borderRadius: 8, padding: "7px",
                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                              }}>✓ Enregistrer</button>
                              <button onClick={() => setEditRecolte(null)} style={{
                                flex: 1, background: C.redBg, border: `1px solid ${C.redBorder}`,
                                color: C.red, borderRadius: 8, padding: "7px",
                                fontSize: 12, cursor: "pointer",
                              }}>Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 8,
                              background: C.bg, border: `1px solid ${C.border}`,
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1 }}>{formatDate(r.date).split(" ")[0]}</div>
                              <div style={{ fontSize: 9, color: C.textLight, lineHeight: 1 }}>{formatDate(r.date).split(" ")[1]}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="lora" style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                                {r.quantite}{plant.unite === "kg" ? " kg" : plant.unite === "botte" ? " botte(s)" : " unité(s)"}
                                <span style={{ color: C.green, marginLeft: 8, fontSize: 12, fontWeight: 400 }}>
                                  = {formatEur(r.quantite * plant.prixMarche)}
                                </span>
                              </div>
                              {r.note && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{r.note}</div>}
                            </div>
                            <button onClick={() => setEditRecolte({ id: r.id, date: r.date, quantite: String(r.quantite), note: r.note || "" })}
                              style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: 4 }}>✎</button>
                            <button onClick={() => deleteRecolte(plant.id, r.id)}
                              style={{ background: "none", border: "none", color: C.textLight, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 11, color: C.textMuted }}>Total récolté</span>
                      <span className="lora" style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
                        {plant.recoltes.reduce((s, r) => s + r.quantite, 0).toFixed(plant.unite === "kg" ? 1 : 0)}
                        {plant.unite === "kg" ? " kg" : plant.unite === "botte" ? " botte(s)" : " unité(s)"}
                        {" · "}{formatEur(plantValeur)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "24px", color: C.textLight, fontSize: 13 }}>
                    Aucune récolte enregistrée encore.<br />
                    <span style={{ fontSize: 24 }}>🌱</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast annulation suppression */}
      {deleted && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.text, borderRadius: 14, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 4px 20px #00000030", zIndex: 200,
          maxWidth: 340, width: "90%",
        }}>
          <span style={{ fontSize: 18 }}>{deleted.plant.emoji}</span>
          <div style={{ flex: 1 }}>
            <div className="lora" style={{ fontSize: 13, color: "#fff9ee", fontWeight: 600 }}>
              {deleted.plant.nom} supprimé
            </div>
            <div style={{ fontSize: 10, color: "#c0b080", marginTop: 1 }}>Disparaît dans 5 secondes</div>
          </div>
          <button onClick={annulerSuppression} style={{
            background: C.greenBg, border: `1px solid ${C.greenBorder}`,
            color: C.green, borderRadius: 8, padding: "6px 12px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>Oops !</button>
        </div>
      )}
    </div>
  );
}

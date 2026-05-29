import { useState, useEffect, useRef } from "react";
import { INITIAL_PLANCHES, SAMPLE_PLANCHES, INITIAL_ACHATS, SAMPLE_ACHATS, INITIAL_CARNET, SAMPLE_CARNET } from "../constants/plants";
import { formatEur, formatDate } from "../utils/format";
import { CALENDRIER_DEFAULT } from "../constants/calendrier";
import { getFamille } from "../constants/families";
import CalendrierView from "./CalendrierView";
import EmojiPicker from "./EmojiPicker";
import GlobalView from "./GlobalView";
import ChartRecoltes from "./ChartRecoltes";
import PlancheDetail from "./PlancheDetail";
import AchatsView from "./AchatsView";
import CarnetView from "./CarnetView";

const COULEURS = ["#e05c3a","#c03020","#e07a2a","#c8a020","#7ecb50","#4a8c3a","#2d6040","#3a7840","#4a2060","#7c4d8a","#a02828","#3a6080"];

const enPeriodeMois = (m, debut, fin) => debut <= fin ? (m >= debut && m <= fin) : (m >= debut || m <= fin);

const REGLES_ALERTE = [
  { type: "Compost",      emoji: "♻️", label: "Compost",             mode: "saison",    cible: 1,             debut: 10, fin: 3  },
  { type: "Fumure",       emoji: "🌿", label: "Fumure organique",     mode: "periode",   periodes: [{debut:3,fin:4},{debut:10,fin:11}] },
  { type: "Paillage",     emoji: "🌾", label: "Paillage",             mode: "saison",    cible: 1,             debut: 5,  fin: 9  },
  { type: "Engrais vert", emoji: "🫘", label: "Engrais vert",         mode: "saison",    cible: 1,             debut: 8,  fin: 10 },
  { type: "Chaulage",     emoji: "🪨", label: "Chaulage",             mode: "saison",    cible: 1,             debut: 10, fin: 11 },
  { type: "Désherbage",   emoji: "🌱", label: "Désherbage",           mode: "intervalle",intervalJours: 7,     debut: 5,  fin: 9  },
  { type: "Binage",       emoji: "⛏️", label: "Binage",               mode: "saison",    cible: 1,             debut: 4,  fin: 8  },
  { type: "Taille",       emoji: "✂️", label: "Taille",               mode: "saison",    cible: 1,             debut: 6,  fin: 9  },
  { type: "Traitement",   emoji: "🧪", label: "Traitement préventif", mode: "intervalle",intervalJours: 60,    debut: 5,  fin: 10 },
  { type: "Arrosage",     emoji: "💧", label: "Arrosage",             mode: "intervalle",intervalJours: 2,     debut: 6,  fin: 8  },
];

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

const STATUTS = {
  active:      { label: "Active",         icon: "🟢" },
  repos:       { label: "En repos",       icon: "😴" },
  preparation: { label: "En préparation", icon: "🌱" },
  hivernage:   { label: "Hivernage",      icon: "❄️" },
};

const CSV_MODELE = `date_achat;nom;emoji;quantite_plants;cout_pot;prix_marche;unite;planche;recolte_date;recolte_quantite
2026-05-01;Tomate cerise;🍒;3;2.45;6.50;kg;Carré potager;2026-09-01;6.0
2026-05-01;Courgette;🥒;4;1.50;3.50;kg;Carré potager;;
2026-05-01;Haricot vert;🫘;1;0;9.00;kg;Planche nord;2026-08-01;1.2`;

export default function PotagerTracker() {
  const [planches, setPlanches] = useState(() => {
    try {
      const savedPlanches = localStorage.getItem("potager_planches");
      if (savedPlanches) return JSON.parse(savedPlanches);

      // Migration depuis l'ancien format à plat
      const savedPlants = localStorage.getItem("potager_plants");
      if (savedPlants) {
        const oldPlants = JSON.parse(savedPlants);
        if (oldPlants.length > 0) {
          return [{
            id: Date.now(),
            nom: "Mon potager",
            surface: 0,
            statut: "active",
            couleur: "#4a8c3a",
            plants: oldPlants,
            entretiens: [],
          }];
        }
      }

      localStorage.setItem("recolta_has_samples", "true");
      return SAMPLE_PLANCHES;
    } catch { return INITIAL_PLANCHES; }
  });

  const [hasSamples, setHasSamples] = useState(() => {
    try { return localStorage.getItem("recolta_has_samples") === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("potager_planches", JSON.stringify(planches)); }
    catch {}
  }, [planches]);

  useEffect(() => {
    try {
      if (hasSamples) localStorage.setItem("recolta_has_samples", "true");
      else localStorage.removeItem("recolta_has_samples");
    } catch {}
  }, [hasSamples]);

  const [achats, setAchats] = useState(() => {
    try {
      const saved = localStorage.getItem("potager_achats");
      if (saved) return JSON.parse(saved);
      return localStorage.getItem("recolta_has_samples") === "true" ? SAMPLE_ACHATS : INITIAL_ACHATS;
    } catch { return INITIAL_ACHATS; }
  });

  useEffect(() => {
    try { localStorage.setItem("potager_achats", JSON.stringify(achats)); }
    catch {}
  }, [achats]);

  const [carnet, setCarnet] = useState(() => {
    try {
      const saved = localStorage.getItem("potager_carnet");
      if (saved) return JSON.parse(saved);
      return localStorage.getItem("recolta_has_samples") === "true" ? SAMPLE_CARNET : INITIAL_CARNET;
    } catch { return INITIAL_CARNET; }
  });

  useEffect(() => {
    try { localStorage.setItem("potager_carnet", JSON.stringify(carnet)); }
    catch {}
  }, [carnet]);

  const [selected, setSelected] = useState(null);
  const [selectedPlancheId, setSelectedPlancheId] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), quantite: "", note: "" });
  const [editPrix, setEditPrix] = useState(null);
  const [editRecolte, setEditRecolte] = useState(null);
  const [editPlant, setEditPlant] = useState(null);
  const [view, setView] = useState("dashboard");
  const [saisonActive, setSaisonActive] = useState(new Date().getFullYear());
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvPreview, setCsvPreview] = useState([]);
  const [deleted, setDeleted] = useState(null);
  const [rappelsDone, setRappelsDone] = useState(() => {
    try {
      const saved = localStorage.getItem("potager_rappels_done");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    try { localStorage.setItem("potager_rappels_done", JSON.stringify([...rappelsDone])); }
    catch {}
  }, [rappelsDone]);

  const [rotationsDismissed, setRotationsDismissed] = useState(() => {
    try {
      const saved = localStorage.getItem("potager_rotations_dismissed");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    try { localStorage.setItem("potager_rotations_dismissed", JSON.stringify([...rotationsDismissed])); }
    catch {}
  }, [rotationsDismissed]);

  // Planche add/edit
  const [showAddPlanche, setShowAddPlanche] = useState(false);
  const [newPlanche, setNewPlanche] = useState({ nom: "", surface: "", statut: "active", couleur: "#4a8c3a" });

  // ── Données dérivées ─────────────────────────────────────────────
  const allPlants = planches.flatMap(pl => pl.plants);
  const getSaison = p => p.dateAchat ? new Date(p.dateAchat).getFullYear() : (p.saison || new Date().getFullYear());
  const saisons = [...new Set(allPlants.map(getSaison))].sort((a, b) => b - a);
  const allPlantsSaison = allPlants.filter(p => getSaison(p) === saisonActive);

  const coutPlantsSaison = allPlantsSaison.reduce((s, p) => s + p.coutTotal, 0);
  const totalAchatsSaison = achats
    .filter(a => new Date(a.date).getFullYear() === saisonActive)
    .reduce((s, a) => s + a.montant, 0);
  const totalInvesti = coutPlantsSaison + totalAchatsSaison;
  const totalValeur = allPlantsSaison.reduce((acc, p) =>
    acc + p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0), 0);
  const economie = totalValeur - totalInvesti;

  const selectedPlanche = selectedPlancheId ? planches.find(pl => pl.id === selectedPlancheId) : null;
  const plantPlanche = selected ? planches.find(pl => pl.plants.some(p => p.id === selected)) : null;
  const plant = plantPlanche?.plants.find(p => p.id === selected) ?? null;
  const plantValeur = plant ? plant.recoltes.reduce((s, r) => s + r.quantite * plant.prixMarche, 0) : 0;
  const plantEco = plant ? plantValeur - plant.coutTotal : 0;

  const chartData = (() => {
    const allRecoltes = allPlantsSaison.flatMap(p =>
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

  // ── Alertes dashboard ────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);

  const alertesRotation = (() => {
    const alerts = [];
    planches.forEach(planche => {
      const actuels  = planche.plants.filter(p => getSaison(p) === saisonActive);
      const precedents = planche.plants.filter(p => getSaison(p) === saisonActive - 1);
      actuels.forEach(plant => {
        const famille = getFamille(plant.nom);
        if (!famille) return;
        const conflit = precedents.find(p => getFamille(p.nom) === famille);
        if (!conflit) return;
        const key = `${saisonActive}__${planche.id}__${plant.nom}`;
        if (rotationsDismissed.has(key)) return;
        alerts.push({ plancheNom: planche.nom, plancheId: planche.id, plant: plant.nom, famille, plantPrecedent: conflit.nom, key });
      });
    });
    return alerts;
  })();

  const alertesEntretienDetaille = (() => {
    if (saisonActive !== new Date().getFullYear()) return [];
    const mois = new Date().getMonth() + 1;
    const now = new Date();
    const result = [];

    planches
      .filter(pl => pl.statut === "active" || pl.statut === "preparation")
      .forEach(planche => {
        const items = [];
        REGLES_ALERTE.forEach(regle => {
          const actif = regle.periodes
            ? regle.periodes.some(p => enPeriodeMois(mois, p.debut, p.fin))
            : enPeriodeMois(mois, regle.debut, regle.fin);
          if (!actif) return;

          const entretiensType = planche.entretiens
            .filter(e => e.type === regle.type && new Date(e.date).getFullYear() === saisonActive && e.date <= today)
            .sort((a, b) => b.date.localeCompare(a.date));

          if (regle.mode === "saison") {
            if (entretiensType.length < regle.cible) {
              items.push({ ...regle, joursDepuis: null, fait: entretiensType.length });
            }
          } else if (regle.mode === "periode") {
            const periodeCourante = regle.periodes.find(p => enPeriodeMois(mois, p.debut, p.fin));
            if (!periodeCourante) return;
            const faitDansPeriode = entretiensType.some(e => {
              const me = new Date(e.date).getMonth() + 1;
              return enPeriodeMois(me, periodeCourante.debut, periodeCourante.fin);
            });
            if (!faitDansPeriode) {
              items.push({ ...regle, joursDepuis: null, fait: 0 });
            }
          } else if (regle.mode === "intervalle") {
            const dernierDate = entretiensType.length > 0 ? new Date(entretiensType[0].date + "T12:00:00") : null;
            const joursDepuis = dernierDate ? Math.floor((now - dernierDate) / 86400000) : null;
            if (joursDepuis === null || joursDepuis >= regle.intervalJours) {
              items.push({ ...regle, joursDepuis, fait: entretiensType.length });
            }
          }
        });

        if (items.length > 0) {
          result.push({ plancheNom: planche.nom, plancheId: planche.id, items });
        }
      });

    return result;
  })();

  const moisActuel = new Date().getMonth() + 1;
  const rappelsCalendrier = (() => {
    const parAction = { "À semer (intérieur)": [], "À repiquer": [], "À planter": [] };
    const actionMap = { semis_int: "À semer (intérieur)", repiquage: "À repiquer", pleine_terre: "À planter" };
    CALENDRIER_DEFAULT.forEach(esp => {
      esp.periodes.forEach(p => {
        if (p.type === "recolte") return;
        const actionLabel = actionMap[p.type];
        if (!actionLabel) return;
        const actif = p.debut <= p.fin
          ? moisActuel >= p.debut && moisActuel <= p.fin
          : moisActuel >= p.debut || moisActuel <= p.fin;
        if (!actif) return;
        if (rappelsDone.has(`${saisonActive}__${actionLabel}__${esp.espece}`)) return;
        if (!parAction[actionLabel].includes(esp.espece))
          parAction[actionLabel].push(esp.espece);
      });
    });
    return Object.entries(parAction).filter(([, v]) => v.length > 0);
  })();

  const hasAlertes = alertesRotation.length > 0 || alertesEntretienDetaille.length > 0 || rappelsCalendrier.length > 0;

  const inputStyle = {
    width: "100%", background: "#fff9ee",
    border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "8px 10px",
    fontSize: 13, boxSizing: "border-box",
    fontFamily: "'Nunito', sans-serif", outline: "none",
  };
  const labelStyle = { fontSize: 10, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1.5 };

  // ── Helpers planche ──────────────────────────────────────────────

  function updatePlantInPlanche(plancheId, plantId, updater) {
    setPlanches(prev => prev.map(pl =>
      pl.id === plancheId
        ? { ...pl, plants: pl.plants.map(p => p.id === plantId ? updater(p) : p) }
        : pl
    ));
  }

  // ── Actions récoltes ─────────────────────────────────────────────

  function addRecolte(plantId) {
    const q = parseFloat(form.quantite);
    if (!q || q <= 0 || !plantPlanche) return;
    updatePlantInPlanche(plantPlanche.id, plantId, p => ({
      ...p, recoltes: [...p.recoltes, { id: Date.now(), date: form.date, quantite: q, note: form.note }],
    }));
    setForm({ date: new Date().toISOString().slice(0, 10), quantite: "", note: "" });
  }

  function deleteRecolte(plantId, recolteId) {
    if (!plantPlanche) return;
    updatePlantInPlanche(plantPlanche.id, plantId, p => ({
      ...p, recoltes: p.recoltes.filter(r => r.id !== recolteId),
    }));
  }

  function saveEditRecolte(plantId) {
    const q = parseFloat(editRecolte.quantite);
    if (!q || q <= 0 || !plantPlanche) return;
    updatePlantInPlanche(plantPlanche.id, plantId, p => ({
      ...p, recoltes: p.recoltes.map(r =>
        r.id === editRecolte.id ? { ...r, date: editRecolte.date, quantite: q, note: editRecolte.note } : r
      ),
    }));
    setEditRecolte(null);
  }

  function updatePrix(plantId, newPrix) {
    const val = parseFloat(newPrix);
    if (!val || val <= 0 || !plantPlanche) return;
    updatePlantInPlanche(plantPlanche.id, plantId, p => ({ ...p, prixMarche: val }));
    setEditPrix(null);
  }

  function saveEditPlant(plantId) {
    const qte = parseInt(editPlant.quantite) || 1;
    const prixPot = parseFloat(editPlant.prixPot) || 0;
    const prixMarche = parseFloat(editPlant.prixMarche);
    if (!editPlant.nom.trim() || !prixMarche || !plantPlanche) return;
    updatePlantInPlanche(plantPlanche.id, plantId, p => ({
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
    }));
    setEditPlant(null);
  }

  function deletePlant(plantId, plancheId) {
    const pl = planches.find(p => p.id === plancheId);
    const p = pl?.plants.find(p => p.id === plantId);
    if (!p) return;
    setPlanches(prev => prev.map(pl =>
      pl.id === plancheId ? { ...pl, plants: pl.plants.filter(p => p.id !== plantId) } : pl
    ));
    setSelected(null);
    if (deleted?.timeout) clearTimeout(deleted.timeout);
    const timeout = setTimeout(() => setDeleted(null), 5000);
    setDeleted({ plant: p, plancheId, timeout });
  }

  function annulerSuppression() {
    if (!deleted) return;
    clearTimeout(deleted.timeout);
    setPlanches(prev => prev.map(pl =>
      pl.id === deleted.plancheId ? { ...pl, plants: [...pl.plants, deleted.plant] } : pl
    ));
    setDeleted(null);
  }

  function reconduirePlant(p) {
    if (!plantPlanche) return;
    const anneeSuivante = getSaison(p) + 1;
    const dejaExistant = allPlants.find(ap => ap.nom === p.nom && getSaison(ap) === anneeSuivante);
    if (dejaExistant) {
      alert(`"${p.nom}" existe déjà pour ${anneeSuivante}.`);
      return;
    }
    const newId = Date.now();
    const dateAchat = `${anneeSuivante}-${(p.dateAchat || "2026-05-01").slice(5)}`;
    const newP = { ...p, id: newId, dateAchat, recoltes: [], custom: true };
    setPlanches(prev => prev.map(pl =>
      pl.id === plantPlanche.id ? { ...pl, plants: [...pl.plants, newP] } : pl
    ));
    setSaisonActive(anneeSuivante);
    setSelected(newId);
  }

  // ── Actions planches ─────────────────────────────────────────────

  function addPlanche() {
    if (!newPlanche.nom.trim()) return;
    setPlanches(prev => [...prev, {
      id: Date.now(),
      nom: newPlanche.nom.trim(),
      surface: parseFloat(newPlanche.surface) || 0,
      statut: newPlanche.statut,
      couleur: newPlanche.couleur,
      plants: [],
      entretiens: [],
    }]);
    setNewPlanche({ nom: "", surface: "", statut: "active", couleur: "#4a8c3a" });
    setShowAddPlanche(false);
  }

  function handleUpdatePlanche(updatedPlanche) {
    setPlanches(prev => prev.map(pl => pl.id === updatedPlanche.id ? updatedPlanche : pl));
  }

  function effacerExemples() {
    setPlanches([]);
    setAchats([]);
    setCarnet([]);
    setHasSamples(false);
    setSelected(null);
    setSelectedPlancheId(null);
    setSaisonActive(new Date().getFullYear());
  }

  function addAchat(achat) { setAchats(prev => [...prev, achat]); }
  function deleteAchat(id) { setAchats(prev => prev.filter(a => a.id !== id)); }

  function dismissRappel(action, espece) {
    setRappelsDone(prev => new Set([...prev, `${saisonActive}__${action}__${espece}`]));
  }

  function dismissRotation(key) {
    setRotationsDismissed(prev => new Set([...prev, key]));
  }

  function marquerEntretienFait(plancheId, type) {
    setPlanches(prev => prev.map(pl => {
      if (pl.id !== plancheId) return pl;
      return {
        ...pl,
        entretiens: [...pl.entretiens, {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          type,
          quantite: "",
          unite: "",
          note: "",
        }],
      };
    }));
  }

  // ── CSV ──────────────────────────────────────────────────────────

  function telechargerModele() {
    const blob = new Blob([CSV_MODELE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "recolta_modele.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text) {
    const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return { error: "Fichier vide.", plants: [] };
    const header = lines[0].split(";").map(h => h.trim().toLowerCase());
    const required = ["date_achat","nom","prix_marche","unite"];
    const missing = required.filter(r => !header.includes(r));
    if (missing.length > 0) return { error: `Colonnes manquantes : ${missing.join(", ")}`, plants: [] };

    const get = (row, key) => { const idx = header.indexOf(key); return idx >= 0 ? (row[idx] || "").trim() : ""; };
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
      const planche = get(row, "planche");
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
          _planche: planche,
        };
      }
      if (recolteDate && !isNaN(recolteQte) && recolteQte > 0) {
        plantsMap[key].recoltes.push({ id: Date.now() + Math.random(), date: recolteDate, quantite: recolteQte, note: "Import CSV" });
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
    const existants = new Set(allPlants.map(p => p.nom + "__" + p.dateAchat));
    const aAjouter = csvPreview.filter(p => !existants.has(p.nom + "__" + p.dateAchat));
    if (aAjouter.length > 0) {
      setPlanches(prev => {
        const result = [...prev];
        const byPlanche = {};
        aAjouter.forEach(p => {
          const key = (p._planche || "").trim();
          if (!byPlanche[key]) byPlanche[key] = [];
          byPlanche[key].push(p);
        });

        Object.entries(byPlanche).forEach(([plancheName, plants]) => {
          const cleanPlants = plants.map(({ _planche: _, ...rest }) => rest);
          if (!plancheName) {
            if (result.length === 0) {
              result.push({ id: Date.now(), nom: "Mon potager", surface: 0, statut: "active", couleur: "#4a8c3a", plants: cleanPlants, entretiens: [] });
            } else {
              const idx = 0;
              result[idx] = { ...result[idx], plants: [...result[idx].plants, ...cleanPlants] };
            }
          } else {
            const idx = result.findIndex(pl => pl.nom.toLowerCase() === plancheName.toLowerCase());
            if (idx >= 0) {
              result[idx] = { ...result[idx], plants: [...result[idx].plants, ...cleanPlants] };
            } else {
              result.push({ id: Date.now() + Math.random(), nom: plancheName, surface: 0, statut: "active", couleur: "#4a8c3a", plants: cleanPlants, entretiens: [] });
            }
          }
        });

        return result;
      });
      setSaisonActive(new Date(aAjouter[0].dateAchat).getFullYear());
    }
    setShowCsvImport(false);
    setCsvPreview([]);
    setCsvError("");
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
          <div>
            <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: 3, textTransform: "uppercase" }}>
              Journal · Saison {saisonActive}
            </div>
            <div className="lora" style={{ fontSize: 24, color: C.text, fontWeight: 700, marginTop: 2 }}>
              🌿 Mon Potager
            </div>
          </div>

          {/* Sélecteur de saison */}
          <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
            {saisons.map(s => (
              <button key={s} onClick={() => { setSaisonActive(s); setSelected(null); setSelectedPlancheId(null); setView("dashboard"); }}
                style={{
                  padding: "4px 14px", borderRadius: 20,
                  background: saisonActive === s && view === "dashboard" ? C.text : C.bg,
                  border: `1px solid ${C.border}`,
                  color: saisonActive === s && view === "dashboard" ? "#fff9ee" : C.textMuted,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* Stats globales */}
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

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>

        {view === "global" ? (
          <GlobalView plants={allPlants} saisons={saisons} C={C} />

        ) : view === "calendrier" ? (
          <CalendrierView plants={allPlants} C={C} />

        ) : view === "carnet" ? (
          <CarnetView
            carnet={carnet}
            saisonActive={saisonActive}
            C={C}
            onUpdateCarnet={setCarnet}
          />

        ) : view === "achats" ? (
          <AchatsView
            achats={achats}
            saisonActive={saisonActive}
            coutPlants={coutPlantsSaison}
            totalValeur={totalValeur}
            C={C}
            onAddAchat={addAchat}
            onDeleteAchat={deleteAchat}
          />

        ) : selected && plant ? (
          /* ── VUE DÉTAIL PLANT ── */
          <div>
            <button onClick={() => { setSelected(null); setEditPlant(null); }}
              style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, padding: "0 0 16px 0" }}>
              ← Retour
            </button>

            <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px", marginBottom: 14 }}>
              {editPlant ? (
                <div>
                  <div className="lora" style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>✎ Modifier le plant</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 60 }}>
                      <div style={labelStyle}>Emoji</div>
                      <EmojiPicker value={editPlant.emoji} onChange={e => setEditPlant(ep => ({ ...ep, emoji: e }))} C={C} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Nom</div>
                      <input autoFocus type="text" value={editPlant.nom}
                        onChange={e => setEditPlant(ep => ({ ...ep, nom: e.target.value }))} style={inputStyle} />
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
                      <input type="number" min="1" value={editPlant.quantite}
                        onChange={e => setEditPlant(ep => ({ ...ep, quantite: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Coût (€)</div>
                      <input type="number" min="0" step="0.1" value={editPlant.prixPot}
                        onChange={e => setEditPlant(ep => ({ ...ep, prixPot: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Unité</div>
                      <select value={editPlant.unite}
                        onChange={e => setEditPlant(ep => ({ ...ep, unite: e.target.value }))} style={inputStyle}>
                        <option value="kg">kg</option>
                        <option value="unite">à l&apos;unité</option>
                        <option value="botte">botte</option>
                        <option value="litre">litre</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Prix marché bio (€)</div>
                      <input type="number" min="0" step="0.1" value={editPlant.prixMarche}
                        onChange={e => setEditPlant(ep => ({ ...ep, prixMarche: e.target.value }))} style={inputStyle} />
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
                        {plantPlanche && <span style={{ color: C.green }}> · {plantPlanche.nom}</span>}
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
                      <div>
                        <button onClick={() => deletePlant(plant.id, plantPlanche?.id)}
                          style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", padding: 0, marginTop: 4 }}>
                          🗑 Supprimer
                        </button>
                      </div>
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
                            <input type="date" value={editRecolte.date}
                              onChange={e => setEditRecolte(er => ({ ...er, date: e.target.value }))} style={inputStyle} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={labelStyle}>Quantité</div>
                            <input autoFocus type="number" step={plant.unite === "kg" ? "0.1" : "1"} min="0"
                              value={editRecolte.quantite}
                              onChange={e => setEditRecolte(er => ({ ...er, quantite: e.target.value }))} style={inputStyle} />
                          </div>
                        </div>
                        <input type="text" value={editRecolte.note}
                          onChange={e => setEditRecolte(er => ({ ...er, note: e.target.value }))}
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
          </div>

        ) : selectedPlanche ? (
          /* ── VUE DÉTAIL PLANCHE ── */
          <PlancheDetail
            planche={selectedPlanche}
            saisonActive={saisonActive}
            C={C}
            onBack={() => setSelectedPlancheId(null)}
            onSelectPlant={plantId => setSelected(plantId)}
            onDeletePlant={plantId => deletePlant(plantId, selectedPlancheId)}
            onUpdatePlanche={handleUpdatePlanche}
          />

        ) : (
          /* ── VUE LISTE PLANCHES ── */
          <div>
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
                  Ces planches et plants sont des <strong style={{ color: C.text }}>exemples</strong> pour découvrir l&apos;app.
                  Quand tu es prêt·e, efface-les et crée tes propres planches.
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

            {/* Graphique cumulatif */}
            {chartData.length > 0 && (
              <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
                <div className="lora" style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 12 }}>
                  📈 Récoltes cumulées {saisonActive}
                </div>
                <ChartRecoltes data={chartData} totalInvesti={totalInvesti} />
              </div>
            )}

            {/* Alertes & rappels */}
            {hasAlertes && (
              <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
                <div className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
                  🔔 Alertes &amp; rappels
                </div>

                {/* Calendrier */}
                {rappelsCalendrier.length > 0 && (
                  <div style={{ marginBottom: alertesRotation.length > 0 || alertesEntretienDetaille.length > 0 ? 12 : 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🌱</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 4 }}>
                          En ce moment dans le jardin
                        </div>
                        {rappelsCalendrier.map(([action, especes]) => (
                          <div key={action} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4 }}>{action}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {especes.map(espece => (
                                <div key={espece} style={{
                                  display: "flex", alignItems: "center", gap: 3,
                                  background: C.bg, border: `1px solid ${C.border}`,
                                  borderRadius: 6, padding: "2px 4px 2px 8px",
                                  fontSize: 11, color: C.textMuted,
                                }}>
                                  <span>{espece}</span>
                                  <button onClick={() => dismissRappel(action, espece)} style={{
                                    background: "none", border: "none", color: C.green,
                                    cursor: "pointer", fontSize: 13, padding: "0 2px",
                                    lineHeight: 1, fontWeight: 700,
                                  }} title="Marquer comme fait">✓</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rotation */}
                {alertesRotation.length > 0 && (
                  <div style={{ marginBottom: alertesEntretienDetaille.length > 0 ? 12 : 0 }}>
                    {rappelsCalendrier.length > 0 && <div style={{ borderTop: `1px dashed ${C.borderDash}`, margin: "10px 0" }} />}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 4 }}>
                          Rotation à surveiller
                        </div>
                        {alertesRotation.map((a, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 600, color: C.text, cursor: "pointer", textDecoration: "underline dotted" }}
                                onClick={() => setSelectedPlancheId(a.plancheId)}>
                                {a.plancheNom}
                              </span>
                              {" — "}{a.plant} ({a.famille}) · même famille que {a.plantPrecedent} l&apos;an dernier
                            </div>
                            <button onClick={() => dismissRotation(a.key)} style={{
                              background: "none", border: "none", color: C.textLight,
                              cursor: "pointer", fontSize: 14, padding: "0 2px",
                              lineHeight: 1, flexShrink: 0,
                            }} title="Masquer cette alerte">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Entretien */}
                {alertesEntretienDetaille.length > 0 && (
                  <div>
                    {(rappelsCalendrier.length > 0 || alertesRotation.length > 0) && <div style={{ borderTop: `1px dashed ${C.borderDash}`, margin: "10px 0" }} />}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🧴</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>
                          Entretien recommandé
                        </div>
                        {alertesEntretienDetaille.map((plancheAlerte, pi) => (
                          <div key={plancheAlerte.plancheId} style={{ marginBottom: pi < alertesEntretienDetaille.length - 1 ? 10 : 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 5 }}>
                              <span style={{ cursor: "pointer", textDecoration: "underline dotted" }}
                                onClick={() => setSelectedPlancheId(plancheAlerte.plancheId)}>
                                {plancheAlerte.plancheNom}
                              </span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {plancheAlerte.items.map(item => {
                                const msgIntervalle = item.joursDepuis === null
                                  ? "jamais fait"
                                  : `il y a ${item.joursDepuis}j · /${item.intervalJours}j`;
                                const msgSaison = item.mode === "periode" ? "pas fait cette période" : "pas fait cette saison";
                                const msg = item.mode === "intervalle" ? msgIntervalle : msgSaison;
                                const urgent = item.mode === "intervalle" && item.joursDepuis !== null && item.joursDepuis > item.intervalJours * 2;
                                return (
                                  <div key={item.type} style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    background: urgent ? C.redBg : C.bg,
                                    border: `1px solid ${urgent ? C.redBorder : C.border}`,
                                    borderRadius: 6, padding: "3px 4px 3px 7px",
                                    fontSize: 11,
                                  }}>
                                    <span style={{ fontSize: 13 }}>{item.emoji}</span>
                                    <div style={{ lineHeight: 1.3 }}>
                                      <div style={{ fontWeight: 600, color: urgent ? C.red : C.text, fontSize: 10 }}>{item.label}</div>
                                      <div style={{ color: C.textMuted, fontSize: 9 }}>{msg}</div>
                                    </div>
                                    <button onClick={() => marquerEntretienFait(plancheAlerte.plancheId, item.type)} style={{
                                      background: "none", border: "none", color: C.green,
                                      cursor: "pointer", fontSize: 14, padding: "0 2px",
                                      lineHeight: 1, fontWeight: 700, marginLeft: 2,
                                    }} title="Marquer comme fait">✓</button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Liste des planches */}
            {planches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: C.textLight }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🪴</div>
                <div className="lora" style={{ fontSize: 15, color: C.textMuted, marginBottom: 6 }}>Aucune planche</div>
                <div style={{ fontSize: 12 }}>Crée ta première planche de culture</div>
              </div>
            ) : (
              planches.map(planche => {
                const plantsSaison = planche.plants.filter(p => getSaison(p) === saisonActive);
                const investi = plantsSaison.reduce((s, p) => s + p.coutTotal, 0);
                const valeur = plantsSaison.reduce((acc, p) => acc + p.recoltes.reduce((s, r) => s + r.quantite * p.prixMarche, 0), 0);
                const eco = valeur - investi;
                const dernier = planche.entretiens.length > 0
                  ? [...planche.entretiens].sort((a, b) => b.date.localeCompare(a.date))[0]
                  : null;
                const statut = STATUTS[planche.statut] || STATUTS.active;

                return (
                  <div key={planche.id}
                    onClick={() => setSelectedPlancheId(planche.id)}
                    style={{
                      background: C.paper, border: `1px solid ${C.border}`,
                      borderLeft: `4px solid ${planche.couleur}`,
                      borderRadius: 12, padding: "14px 16px", marginBottom: 10,
                      cursor: "pointer",
                    }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{planche.nom}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                          {statut.icon} {statut.label}
                          {planche.surface > 0 && ` · ${planche.surface} m²`}
                          {` · ${plantsSaison.length} plant${plantsSaison.length !== 1 ? "s" : ""}`}
                          {dernier && ` · 🧴 ${new Date(dernier.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {(valeur > 0 || investi > 0) && (
                          <div style={{
                            background: eco >= 0 ? C.greenBg : C.redBg,
                            border: `1px solid ${eco >= 0 ? C.greenBorder : C.redBorder}`,
                            borderRadius: 8, padding: "3px 10px",
                          }}>
                            <span className="lora" style={{ fontSize: 13, fontWeight: 600, color: eco >= 0 ? C.green : C.red }}>
                              {eco > 0 ? "+" : ""}{formatEur(eco)}
                            </span>
                          </div>
                        )}
                        <span style={{ color: C.textLight, fontSize: 16 }}>›</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <button onClick={() => setShowAddPlanche(true)} style={{
              width: "100%", background: "transparent",
              border: `1px dashed ${C.borderDash}`, borderRadius: 12,
              padding: "13px", cursor: "pointer",
              color: C.textMuted, fontSize: 13, marginTop: 4,
            }}>
              + Ajouter une planche
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

            {/* Modal ajout planche */}
            {showAddPlanche && (
              <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%", maxWidth: 640, margin: "0 auto",
                  background: C.paper, borderRadius: "18px 18px 0 0",
                  border: `1px solid ${C.border}`, padding: "20px 20px 36px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div className="lora" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nouvelle planche</div>
                    <button onClick={() => setShowAddPlanche(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={labelStyle}>Nom *</div>
                    <input autoFocus type="text" value={newPlanche.nom}
                      onChange={e => setNewPlanche(n => ({ ...n, nom: e.target.value }))}
                      placeholder="ex: Carré potager, Serre..." style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Surface (m²)</div>
                      <input type="number" min="0" step="0.5" value={newPlanche.surface}
                        onChange={e => setNewPlanche(n => ({ ...n, surface: e.target.value }))}
                        placeholder="ex: 4" style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={labelStyle}>Statut</div>
                      <select value={newPlanche.statut}
                        onChange={e => setNewPlanche(n => ({ ...n, statut: e.target.value }))} style={inputStyle}>
                        <option value="active">🟢 Active</option>
                        <option value="repos">😴 En repos</option>
                        <option value="preparation">🌱 En préparation</option>
                        <option value="hivernage">❄️ Hivernage</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={labelStyle}>Couleur</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      {COULEURS.map(c => (
                        <div key={c} onClick={() => setNewPlanche(n => ({ ...n, couleur: c }))}
                          style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer",
                            border: newPlanche.couleur === c ? "2px solid #3a2e10" : "2px solid transparent" }} />
                      ))}
                    </div>
                  </div>
                  <button onClick={addPlanche} style={{
                    width: "100%", background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                    color: C.green, borderRadius: 10, padding: "12px",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}>Créer la planche</button>
                </div>
              </div>
            )}

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
                    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Format (séparateur ;)</div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8, fontFamily: "monospace" }}>
                      date_achat · nom · emoji · quantite_plants<br/>
                      cout_pot · prix_marche · unite · <strong>planche</strong><br/>
                      recolte_date · recolte_quantite
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>
                      La colonne <strong>planche</strong> est optionnelle. Si renseignée, les plants sont acheminés vers la planche correspondante (créée si nécessaire).
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
                              {p._planche ? <span style={{ color: C.green }}> · {p._planche}</span> : ""}
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
          </div>
        )}
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: C.paper, borderTop: `1px solid ${C.border}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -2px 12px #0000000d",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex" }}>
          {[
            { key: "potager",    emoji: "🌿", label: "Potager" },
            { key: "global",     emoji: "📊", label: "Global" },
            { key: "calendrier", emoji: "📅", label: "Calendrier" },
            { key: "achats",     emoji: "🛒", label: "Achats" },
            { key: "carnet",     emoji: "📓", label: "Carnet" },
          ].map(({ key, emoji, label }) => {
            const activeTab = ["global", "calendrier", "achats", "carnet"].includes(view) ? view : "potager";
            const isActive = activeTab === key;
            return (
              <button key={key}
                onClick={() => {
                  if (key === "potager") { setView("dashboard"); setSelected(null); setSelectedPlancheId(null); }
                  else { setView(key); setSelected(null); setSelectedPlancheId(null); }
                }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 2, padding: "8px 0",
                  background: "none", border: "none", cursor: "pointer",
                  color: isActive ? C.green : C.textLight,
                }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, letterSpacing: 0.5 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast annulation suppression */}
      {deleted && (
        <div style={{
          position: "fixed", bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 12px)", left: "50%", transform: "translateX(-50%)",
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

const CHAMPS = [
  { key: "meteo",          emoji: "☀️", label: "Météo générale de la saison",    placeholder: "Printemps précoce, été chaud et sec, canicule mi-août…" },
  { key: "eau",            emoji: "💧", label: "Consommation en eau (estimation)", placeholder: "~200L sur la saison, arrosage tous les 2 jours en été…" },
  { key: "achatsNotables", emoji: "🛒", label: "Achats notables",                 placeholder: "Serre tunnel, tuyaux goutte-à-goutte, nouveau composteur…" },
  { key: "notes",          emoji: "📝", label: "Notes libres",                    placeholder: "Observations, idées pour la prochaine saison…" },
];

export default function CarnetView({ carnet, saisonActive, C, onUpdateCarnet }) {
  const entree = carnet.find(e => e.saison === saisonActive) || {
    saison: saisonActive, meteo: "", eau: "", achatsNotables: "", notes: "",
  };

  function handleChange(key, value) {
    const updated = carnet.some(e => e.saison === saisonActive)
      ? carnet.map(e => e.saison === saisonActive ? { ...e, [key]: value } : e)
      : [...carnet, { ...entree, [key]: value }];
    onUpdateCarnet(updated);
  }

  const textareaStyle = {
    width: "100%", background: "#fff9ee",
    border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 8, padding: "10px 12px",
    fontSize: 13, boxSizing: "border-box",
    fontFamily: "'Nunito', sans-serif", outline: "none",
    lineHeight: 1.7, resize: "vertical", minHeight: 72,
  };

  return (
    <div>
      {/* En-tête journal */}
      <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 30 }}>📓</div>
          <div>
            <div className="lora" style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
              Carnet de saison {saisonActive}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
              Tes observations et notes personnelles · sauvegarde automatique
            </div>
          </div>
        </div>
      </div>

      {/* Champs du journal */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {CHAMPS.map(champ => (
          <div key={champ.key} style={{
            background: C.paper, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{champ.emoji}</span>
              <span className="lora" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{champ.label}</span>
            </div>
            <textarea
              value={entree[champ.key] || ""}
              onChange={e => handleChange(champ.key, e.target.value)}
              placeholder={champ.placeholder}
              rows={3}
              style={textareaStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

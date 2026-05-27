import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  {
    label: "Légumes-fruits",
    emojis: ["🍅","🍒","🫀","🍆","🫑","🌶️","🥒","🎃","🌽"],
  },
  {
    label: "Racines & bulbes",
    emojis: ["🥕","🥔","🍠","🧅","🧄","🫚"],
  },
  {
    label: "Feuilles & tiges",
    emojis: ["🥬","🥦","🥗","🌿","🍃","🌱","🌾"],
  },
  {
    label: "Légumineuses",
    emojis: ["🫛","🫘","🥜"],
  },
  {
    label: "Fruits rouges & baies",
    emojis: ["🍓","🫐","🍇","🍒","🍑"],
  },
  {
    label: "Fruits à pépins",
    emojis: ["🍎","🍏","🍐","🥭","🍈","🍉"],
  },
  {
    label: "Fruits à noyau",
    emojis: ["🍑","🍒","🫒","🥑"],
  },
  {
    label: "Agrumes",
    emojis: ["🍊","🍋","🍋‍🟩","🍌","🍍","🥥"],
  },
  {
    label: "Autres",
    emojis: ["🌰","🍄","🫙","🌻","🪴","🌺"],
  },
];

export default function EmojiPicker({ value, onChange, C }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Choisir un emoji"
        style={{
          width: "100%", fontSize: 22, textAlign: "center",
          background: C.bg, border: `1px solid ${open ? C.green : C.border}`,
          borderRadius: 8, padding: "6px", cursor: "pointer", lineHeight: 1.3,
          outline: "none",
        }}
      >
        {value}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
          background: C.paper, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 10px",
          boxShadow: "0 8px 24px #00000018",
          width: 240, maxHeight: 320, overflowY: "auto",
        }}>
          {CATEGORIES.map(cat => (
            <div key={cat.label} style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 9, color: C.textMuted,
                textTransform: "uppercase", letterSpacing: 1.5,
                marginBottom: 5,
              }}>
                {cat.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {cat.emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onChange(e); setOpen(false); }}
                    style={{
                      fontSize: 20, lineHeight: 1,
                      background: value === e ? C.greenBg : "transparent",
                      border: `1px solid ${value === e ? C.greenBorder : "transparent"}`,
                      borderRadius: 6, padding: "4px 5px", cursor: "pointer",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

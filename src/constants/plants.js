export const INITIAL_PLANTS = [];

export const SAMPLE_PLANTS = [
  {
    id: 901, dateAchat: "2026-05-03", emoji: "🍅", nom: "Tomate cerise (exemple)",
    quantite: 3, prixPot: 2.45, coutTotal: 7.35, unite: "kg", prixMarche: 7.00,
    couleur: "#c03020",
    recoltes: [
      { id: 90101, date: "2026-07-12", quantite: 0.6, note: "Premières tomates ! 🎉" },
      { id: 90102, date: "2026-07-26", quantite: 1.4, note: "Belle récolte" },
      { id: 90103, date: "2026-08-10", quantite: 2.1, note: "" },
    ],
  },
  {
    id: 902, dateAchat: "2026-05-03", emoji: "🥒", nom: "Courgette (exemple)",
    quantite: 2, prixPot: 1.50, coutTotal: 3.00, unite: "kg", prixMarche: 3.50,
    couleur: "#4a8c3a",
    recoltes: [
      { id: 90201, date: "2026-07-05", quantite: 1.8, note: "" },
      { id: 90202, date: "2026-07-20", quantite: 3.2, note: "Très productif !" },
    ],
  },
  {
    id: 903, dateAchat: "2026-05-10", emoji: "🫘", nom: "Haricot vert (exemple)",
    quantite: 1, prixPot: 0, coutTotal: 0, unite: "kg", prixMarche: 9.00,
    couleur: "#5a7830",
    recoltes: [
      { id: 90301, date: "2026-08-01", quantite: 1.2, note: "" },
    ],
  },
  {
    id: 904, dateAchat: "2026-05-15", emoji: "🌿", nom: "Basilic (exemple)",
    quantite: 2, prixPot: 2.00, coutTotal: 4.00, unite: "botte", prixMarche: 2.00,
    couleur: "#3a7020",
    recoltes: [],
  },
];

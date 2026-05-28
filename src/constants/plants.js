export const INITIAL_PLANCHES = [];
export const INITIAL_ACHATS = [];

export const SAMPLE_ACHATS = [
  { id: 10001, date: "2026-04-28", categorie: "terreau",  description: "Terreau plantation 50L (exemple)", montant: 8.90 },
  { id: 10002, date: "2026-05-01", categorie: "engrais",  description: "Engrais organique potager (exemple)", montant: 12.50 },
  { id: 10003, date: "2026-05-10", categorie: "materiel", description: "Paillage fibres de coco (exemple)", montant: 6.90 },
];

export const SAMPLE_PLANCHES = [
  {
    id: 801,
    nom: "Carré potager",
    surface: 4,
    statut: "active",
    couleur: "#4a8c3a",
    plants: [
      {
        id: 901, dateAchat: "2026-05-03", emoji: "🍅", nom: "Tomate cerise (exemple)",
        quantite: 3, prixPot: 2.45, coutTotal: 7.35, unite: "kg", prixMarche: 7.00,
        couleur: "#c03020", custom: true,
        recoltes: [
          { id: 90101, date: "2026-07-12", quantite: 0.6, note: "Premières tomates ! 🎉" },
          { id: 90102, date: "2026-07-26", quantite: 1.4, note: "Belle récolte" },
          { id: 90103, date: "2026-08-10", quantite: 2.1, note: "" },
        ],
      },
      {
        id: 902, dateAchat: "2026-05-03", emoji: "🥒", nom: "Courgette (exemple)",
        quantite: 2, prixPot: 1.50, coutTotal: 3.00, unite: "kg", prixMarche: 3.50,
        couleur: "#4a8c3a", custom: true,
        recoltes: [
          { id: 90201, date: "2026-07-05", quantite: 1.8, note: "" },
          { id: 90202, date: "2026-07-20", quantite: 3.2, note: "Très productif !" },
        ],
      },
      {
        id: 903, dateAchat: "2026-05-10", emoji: "🫘", nom: "Haricot vert (exemple)",
        quantite: 1, prixPot: 0, coutTotal: 0, unite: "kg", prixMarche: 9.00,
        couleur: "#5a7830", custom: true,
        recoltes: [{ id: 90301, date: "2026-08-01", quantite: 1.2, note: "" }],
      },
    ],
    entretiens: [
      { id: 8001, date: "2026-05-01", type: "Compost", quantite: "10", unite: "L", note: "Avant plantation" },
      { id: 8002, date: "2026-06-15", type: "Paillage", quantite: "", unite: "", note: "Paille de blé" },
    ],
  },
  {
    id: 802,
    nom: "Planche nord",
    surface: 2,
    statut: "repos",
    couleur: "#806020",
    plants: [],
    entretiens: [
      { id: 8101, date: "2026-04-10", type: "Chaulage", quantite: "1", unite: "kg", note: "Chaux horticole, pH trop acide" },
    ],
  },
];

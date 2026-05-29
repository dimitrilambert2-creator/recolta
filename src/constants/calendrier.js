export const CALENDRIER_DEFAULT = [
  { espece: "Tomate", emoji: "🍅", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 2, fin: 3, couleur: "#c8a020" },
    { type: "repiquage", label: "Repiquage", debut: 5, fin: 5, couleur: "#7c4d8a" },
    { type: "recolte", label: "Récolte", debut: 7, fin: 10, couleur: "#e05c3a" },
  ]},
  { espece: "Courgette", emoji: "🥒", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 4, fin: 4, couleur: "#c8a020" },
    { type: "pleine_terre", label: "Plantation", debut: 5, fin: 6, couleur: "#4a8c3a" },
    { type: "recolte", label: "Récolte", debut: 6, fin: 9, couleur: "#e05c3a" },
  ]},
  { espece: "Concombre", emoji: "🥒", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 4, fin: 4, couleur: "#c8a020" },
    { type: "pleine_terre", label: "Plantation", debut: 5, fin: 6, couleur: "#4a8c3a" },
    { type: "recolte", label: "Récolte", debut: 7, fin: 9, couleur: "#e05c3a" },
  ]},
  { espece: "Poivron", emoji: "🫑", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 2, fin: 3, couleur: "#c8a020" },
    { type: "repiquage", label: "Repiquage", debut: 5, fin: 5, couleur: "#7c4d8a" },
    { type: "recolte", label: "Récolte", debut: 8, fin: 10, couleur: "#e05c3a" },
  ]},
  { espece: "Aubergine", emoji: "🍆", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 2, fin: 3, couleur: "#c8a020" },
    { type: "repiquage", label: "Repiquage", debut: 5, fin: 5, couleur: "#7c4d8a" },
    { type: "recolte", label: "Récolte", debut: 8, fin: 10, couleur: "#e05c3a" },
  ]},
  { espece: "Courge", emoji: "🎃", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 4, fin: 4, couleur: "#c8a020" },
    { type: "pleine_terre", label: "Plantation", debut: 5, fin: 6, couleur: "#4a8c3a" },
    { type: "recolte", label: "Récolte", debut: 9, fin: 11, couleur: "#e05c3a" },
  ]},
  { espece: "Poireau", emoji: "🥬", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 2, fin: 3, couleur: "#c8a020" },
    { type: "pleine_terre", label: "Plantation", debut: 6, fin: 7, couleur: "#4a8c3a" },
    { type: "recolte", label: "Récolte", debut: 10, fin: 2, couleur: "#e05c3a" },
  ]},
  { espece: "Pomme de terre", emoji: "🥔", periodes: [
    { type: "pleine_terre", label: "Plantation", debut: 3, fin: 4, couleur: "#4a8c3a" },
    { type: "recolte", label: "Récolte", debut: 7, fin: 9, couleur: "#e05c3a" },
  ]},
  { espece: "Persil", emoji: "🌿", periodes: [
    { type: "semis_int", label: "Semis intérieur", debut: 3, fin: 4, couleur: "#c8a020" },
    { type: "pleine_terre", label: "Semis pleine terre", debut: 4, fin: 6, couleur: "#4a8c3a" },
    { type: "recolte", label: "Récolte", debut: 5, fin: 10, couleur: "#e05c3a" },
  ]},
];

export const MOIS = ["Jan","Fév","Mar","Avr","Mai","Jui","Jul","Aoû","Sep","Oct","Nov","Déc"];

export const LEGENDE = [
  { type: "semis_int", label: "Semis intérieur", couleur: "#c8a020" },
  { type: "repiquage", label: "Repiquage", couleur: "#7c4d8a" },
  { type: "pleine_terre", label: "Plantation / semis pleine terre", couleur: "#4a8c3a" },
  { type: "recolte", label: "Récolte", couleur: "#e05c3a" },
];

export const CALENDRIER_ENTRETIEN = [
  { activite: "Compost", emoji: "♻️", periodes: [
    { label: "Épandage", debut: 10, fin: 12, couleur: "#7b5e2a" },
    { label: "Épandage", debut: 1, fin: 3, couleur: "#7b5e2a" },
  ]},
  { activite: "Fumure organique", emoji: "🌿", periodes: [
    { label: "Apport automne", debut: 10, fin: 11, couleur: "#a06040" },
    { label: "Apport printemps", debut: 3, fin: 4, couleur: "#a06040" },
  ]},
  { activite: "Paillage", emoji: "🌾", periodes: [
    { label: "Paillage", debut: 5, fin: 9, couleur: "#c8a020" },
  ]},
  { activite: "Engrais vert", emoji: "🫘", periodes: [
    { label: "Semis", debut: 8, fin: 10, couleur: "#6b9c3a" },
  ]},
  { activite: "Chaulage", emoji: "🪨", periodes: [
    { label: "Épandage chaux", debut: 10, fin: 11, couleur: "#b0b0b0" },
  ]},
  { activite: "Désherbage", emoji: "🌱", periodes: [
    { label: "Désherbage", debut: 4, fin: 9, couleur: "#e8884a" },
  ]},
  { activite: "Binage", emoji: "⛏️", periodes: [
    { label: "Binage sol", debut: 4, fin: 8, couleur: "#c87820" },
  ]},
  { activite: "Taille & tutorage", emoji: "✂️", periodes: [
    { label: "Taille", debut: 6, fin: 9, couleur: "#5890c0" },
  ]},
  { activite: "Traitement préventif", emoji: "🧪", periodes: [
    { label: "Préventif", debut: 5, fin: 10, couleur: "#a050a0" },
  ]},
  { activite: "Arrosage intensif", emoji: "💧", periodes: [
    { label: "Irrigation", debut: 6, fin: 8, couleur: "#4090c0" },
  ]},
];

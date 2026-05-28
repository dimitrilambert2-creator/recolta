const FAMILLES = {
  "Solanacées":    ["tomate", "poivron", "piment", "aubergine", "pomme de terre"],
  "Cucurbitacées": ["courgette", "concombre", "courge", "butternut", "melon", "potiron", "potimarron"],
  "Légumineuses":  ["haricot", "pois", "fève", "soja"],
  "Alliacées":     ["poireau", "oignon", "ail", "échalote", "ciboulette"],
  "Apiacées":      ["carotte", "persil", "céleri", "panais", "cerfeuil"],
  "Astéracées":    ["laitue", "salade", "chicorée", "artichaut"],
  "Chénopodiacées":["betterave", "épinard", "bette"],
  "Brassicacées":  ["chou", "navet", "radis", "roquette", "brocoli"],
};

export function getFamille(nomPlant) {
  const nom = nomPlant.toLowerCase();
  for (const [famille, mots] of Object.entries(FAMILLES)) {
    if (mots.some(m => nom.includes(m))) return famille;
  }
  return null;
}

export { FAMILLES };

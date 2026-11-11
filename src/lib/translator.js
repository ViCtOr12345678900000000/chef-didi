export const TRANSLATIONS_MAP = {
  "yam": { nigeria: "Yam", abroad: "Yam (African store) / Sweet Potato" },
  "ugu": { nigeria: "Ugu (Fluted Pumpkin)", abroad: "Spinach + Kale mix" },
  "uziza": { nigeria: "Uziza", abroad: "Black Pepper + Basil" },
  "ata rodo": { nigeria: "Ata Rodo (Scotch Bonnet)", abroad: "Habanero" },
  "scotch bonnet": { nigeria: "Scotch Bonnet", abroad: "Habanero" },
  "stockfish": { nigeria: "Stockfish", abroad: "Dried Cod / Smoked Fish" },
  "egusi": { nigeria: "Egusi", abroad: "Ground Pumpkin Seeds" },
  "ewedu": { nigeria: "Ewedu", abroad: "Jute Leaves / Okra" },
  "garri": { nigeria: "Garri", abroad: "Cassava Flour" },
  "crayfish": { nigeria: "Crayfish", abroad: "Dried Shrimp" },
  "palm oil": { nigeria: "Palm Oil", abroad: "Palm Oil (African store) / Veg Oil + Paprika" },
  "maggi": { nigeria: "Maggi", abroad: "Maggi / Knorr Cube" },
};

export function getDiasporaSwap(ingredient, location) {
  if (location !== "abroad") return null;
  const lower = String(ingredient || "").toLowerCase();
  const key = Object.keys(TRANSLATIONS_MAP).find(k => lower.includes(k));
  if (!key) return null;
  return TRANSLATIONS_MAP[key].abroad;
}

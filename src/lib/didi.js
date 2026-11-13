export const THEMES = {
  purple: { name: "Royal Violet", page: "from-[#1A1A2E] via-[#2E1A5E] to-[#4A2C8A]", btn: "from-[#2E1A5E] to-[#6D4AC8]", accent: "text-[#4A2C8A]", soft: "bg-[#FAF7FF] text-[#4A3B8C] border-[#EDE8FF]", softBg: "bg-[#FAF7FF]", softBorder: "border-[#EDE8FF]", softText: "text-[#4A3B8C]", focus: "focus:border-[#7B61FF]", hover: "hover:bg-[#2E1A5E]", shadow: "shadow-[0_8px_30px_rgba(46,26,94,0.12)]" },
  gold: { name: "Champagne Gold", page: "from-[#1A1A2E] via-[#2B2110] to-[#4A3A12]", btn: "from-[#8A6D1B] to-[#C9A86A]", accent: "text-[#8A6D1B]", soft: "bg-[#FFFBF0] text-[#6B5310] border-[#F0E2A8]", softBg: "bg-[#FFFBF0]", softBorder: "border-[#F0E2A8]", softText: "text-[#6B5310]", focus: "focus:border-[#C9A86A]", hover: "hover:bg-[#8A6D1B]", shadow: "shadow-[0_8px_30px_rgba(138,109,27,0.12)]" },
  emerald: { name: "Emerald Noir", page: "from-[#06281F] via-[#0B3D2E] to-[#0E4D3A]", btn: "from-[#0B3D2E] to-[#1A7A52]", accent: "text-[#0B3D2E]", soft: "bg-[#F2FAF5] text-[#0B3D2E] border-[#D6EBDD]", softBg: "bg-[#F2FAF5]", softBorder: "border-[#D6EBDD]", softText: "text-[#0B3D2E]", focus: "focus:border-[#1A7A52]", hover: "hover:bg-[#0B3D2E]", shadow: "shadow-[0_8px_30px_rgba(11,61,46,0.12)]" },
  sapphire: { name: "Sapphire", page: "from-[#0A1A3A] via-[#122E6B] to-[#1E3E8A]", btn: "from-[#122E6B] to-[#2A5BD7]", accent: "text-[#122E6B]", soft: "bg-[#F2F6FF] text-[#122E6B] border-[#D6E2FF]", softBg: "bg-[#F2F6FF]", softBorder: "border-[#D6E2FF]", softText: "text-[#122E6B]", focus: "focus:border-[#2A5BD7]", hover: "hover:bg-[#122E6B]", shadow: "shadow-[0_8px_30px_rgba(18,46,107,0.12)]" },
  bordeaux: { name: "Bordeaux", page: "from-[#1E0810] via-[#3A0F1E] to-[#5A1A2E]", btn: "from-[#5A1A2E] to-[#8A2F47]", accent: "text-[#5A1A2E]", soft: "bg-[#FFF5F6] text-[#5A1A2E] border-[#F3D0D6]", softBg: "bg-[#FFF5F6]", softBorder: "border-[#F3D0D6]", softText: "text-[#5A1A2E]", focus: "focus:border-[#8A2F47]", hover: "hover:bg-[#5A1A2E]", shadow: "shadow-[0_8px_30px_rgba(90,26,46,0.12)]" },
  obsidian: { name: "Obsidian", page: "from-[#0A0A0F] via-[#1A1A2E] to-[#2E2E3A]", btn: "from-[#1A1A2E] to-[#3A3A4A]", accent: "text-[#1A1A2E]", soft: "bg-[#FAFAFA] text-[#1A1A2E] border-[#E8E8EC]", softBg: "bg-[#FAFAFA]", softBorder: "border-[#E8E8EC]", softText: "text-[#1A1A2E]", focus: "focus:border-[#3A3A4A]", hover: "hover:bg-[#1A1A2E]", shadow: "shadow-[0_8px_30px_rgba(0,0,0,0.10)]" },
};

export const GOALS = {
  normal: { id: "normal", label: "Normal", desc: "Balanced meals", calories: 2000, emoji: "🍲" },
  weightloss: { id: "weightloss", label: "Weight Loss", desc: "Lighter, more veg, grilled", calories: 1500, emoji: "⬇" },
  weightgain: { id: "weightgain", label: "Weight Gain", desc: "Richer, more food, healthy fats", calories: 2800, emoji: "⬆" },
  fit: { id: "fit", label: "Fit", desc: "High protein, toning", calories: 2400, emoji: "🏋️" },
};

export const CUISINES = {
  auto: { id: "auto", label: "Auto-Detect", desc: "Didi detects the dish from ingredients", emoji: "✨" },
  nigerian: { id: "nigerian", label: "Nigerian", desc: "Jollof, Egusi, Ofada, etc.", emoji: "🇳🇬" },
  italian: { id: "italian", label: "Italian", desc: "Pasta, Alfredo, Pizza", emoji: "🇮🇹" },
  continental: { id: "continental", label: "Continental", desc: "Grilled, Salads, Breakfast", emoji: "🍽️" },
  asian: { id: "asian", label: "Asian", desc: "Stir-fry, Fried Rice, Noodles", emoji: "🍜" },
  mexican: { id: "mexican", label: "Mexican", desc: "Tacos, Burritos, Quesadilla", emoji: "🌮" },
};

export const LOCATIONS = {
  nigeria: { id: "nigeria", label: "In Nigeria", desc: "Local market ingredients", emoji: "🇳🇬" },
  abroad: { id: "abroad", label: "Abroad / Diaspora", desc: "With easy swaps + where to buy", emoji: "✈️" },
};

export function caloriesFor(goal, sittings, customCalories) {
  const total = customCalories && customCalories > 0 ? customCalories : (GOALS[goal]?.calories || 2000);
  return { total, perSitting: Math.round(total / (sittings || 3)), isCustom: !!(customCalories && customCalories > 0) };
}

export const TRANSLATIONS = {
  en: { kitchen1: "What's in your kitchen?", kitchen2: "Didi will cook it.", cuisine: "Cuisine Style?", location: "Where are you cooking?", title: "What do you", subtitle: "want to cook?", add: "Add Ingredients", yours: "Your Ingredients", how: "How do you want to eat?", find: "Find Meal", howWorks: "How it works", tip: "Tip", popular: "Popular combos", welcome: "Welcome", login: "Login", logout: "Logout" },
  yo: { kitchen1: "Kini o wa ni idana re?", kitchen2: "Didi yoo se e.", cuisine: "Iru Ounje?", location: "Nibo ni o n se?", title: "Kini o fe", subtitle: "se?", add: "Fi Eroja Kun", yours: "Eroja Re", how: "Bawo ni o fe je?", find: "Wa Ounje", howWorks: "Bawo ni o n sise", tip: "Imoran", popular: "Awon to gbajumo", welcome: "Kaabo", login: "Wole", logout: "Jade" },
  ig: { kitchen1: "Kedu ihe di na kichin gi?", kitchen2: "Didi ga-esi ya.", cuisine: "Ụdị Nri?", location: "Ebee ka ị na-esi?", title: "Kedu ihe i", subtitle: "choro isi?", add: "Tinye Ihe", yours: "Ihe Gi", how: "Kedu ka ichoro iri?", find: "Chota Nri", howWorks: "Otu o si aru oru", tip: "Ndumodu", popular: "Ndi a ma ama", welcome: "Nnoo", login: "Banye", logout: "Puọ" },
  ha: { kitchen1: "Me ke cikin kitchen dinka?", kitchen2: "Didi zai dafa shi.", cuisine: "Irin Abinci?", location: "Ina kake dafawa?", title: "Me kake", subtitle: "so ka dafa?", add: "Saka Sinadaran", yours: "Sinadaran Naka", how: "Yaya kake so ka ci?", find: "Nemo Abinci", howWorks: "Yaya yake aiki", tip: "Shawara", popular: "Mafi shahara", welcome: "Barka da zuwa", login: "Shiga", logout: "Fita" },
  pcm: { kitchen1: "Wetin dey your kitchen?", kitchen2: "Didi go cook am.", cuisine: "Which Kain Food?", location: "Where You Dey Cook?", title: "Wetin you", subtitle: "wan cook?", add: "Add Ingredients", yours: "Your Ingredients", how: "How you wan chop?", find: "Find Meal", howWorks: "How e dey work", tip: "Tip", popular: "Popular combos", welcome: "Welcome", login: "Login", logout: "Logout" },
  fr: { kitchen1: "Qu'y a-t-il dans ta cuisine ?", kitchen2: "Didi va le cuisiner.", cuisine: "Style de cuisine ?", location: "Où cuisines-tu ?", title: "Que veux-tu", subtitle: "cuisiner?", add: "Ajouter Ingrédients", yours: "Vos Ingrédients", how: "Comment veux-tu manger?", find: "Trouver Repas", howWorks: "Comment ça marche", tip: "Astuce", popular: "Populaires", welcome: "Bienvenue", login: "Connexion", logout: "Déconnexion" },
  es: { kitchen1: "¿Qué hay en tu cocina?", kitchen2: "Didi lo cocinará.", cuisine: "¿Estilo de cocina?", location: "¿Dónde cocinas?", title: "¿Qué quieres", subtitle: "cocinar?", add: "Añadir Ingredientes", yours: "Tus Ingredientes", how: "¿Cómo quieres comer?", find: "Buscar Comida", howWorks: "Cómo funciona", tip: "Consejo", popular: "Populares", welcome: "Bienvenido", login: "Iniciar", logout: "Salir" },
  pt: { kitchen1: "O que tem na sua cozinha?", kitchen2: "Didi vai cozinhar.", cuisine: "Estilo de cozinha?", location: "Onde você está cozinhando?", title: "O que você", subtitle: "quer cozinhar?", add: "Adicionar Ingredientes", yours: "Seus Ingredientes", how: "Como quer comer?", find: "Buscar Refeição", howWorks: "Como funciona", tip: "Dica", popular: "Populares", welcome: "Bem-vindo", login: "Entrar", logout: "Sair" },
  de: { kitchen1: "Was ist in deiner Küche?", kitchen2: "Didi wird es kochen.", cuisine: "Küchenstil?", location: "Wo kochst du?", title: "Was willst du", subtitle: "kochen?", add: "Zutaten Hinzufügen", yours: "Deine Zutaten", how: "Wie willst du essen?", find: "Mahlzeit Finden", howWorks: "Wie es funktioniert", tip: "Tipp", popular: "Beliebt", welcome: "Willkommen", login: "Anmelden", logout: "Abmelden" },
  ar: { kitchen1: "ماذا يوجد في مطبخك؟", kitchen2: "ديدي سوف تطبخه.", cuisine: "نوع المطبخ؟", location: "أين تطبخ؟", title: "ماذا تريد", subtitle: "أن تطبخ؟", add: "أضف المكونات", yours: "مكوناتك", how: "كيف تريد أن تأكل؟", find: "ابحث عن وجبة", howWorks: "كيف يعمل", tip: "نصيحة", popular: "شائع", welcome: "أهلاً", login: "دخول", logout: "خروج" },
  sw: { kitchen1: "Nini kiko jikoni kwako?", kitchen2: "Didi atapika.", cuisine: "Mtindo wa Chakula?", location: "Unapika wapi?", title: "Unataka", subtitle: "kupika nini?", add: "Ongeza Viungo", yours: "Viungo Vyako", how: "Unataka kula vipi?", find: "Tafuta Chakula", howWorks: "Inavyofanya kazi", tip: "Kidokezo", popular: "Maarufu", welcome: "Karibu", login: "Ingia", logout: "Toka" },
  zu: { kitchen1: "Yini esekhishini lakho?", kitchen2: "UDidi uzoyipheka.", cuisine: "Isitayela Sokudla?", location: "Uphekaphi?", title: "Ufuna", subtitle: "ukupheka ini?", add: "Engeza Izithako", yours: "Izithako Zakho", how: "Ufuna ukudla kanjani?", find: "Thola Ukudla", howWorks: "Kusebenza kanjani", tip: "Ithiphu", popular: "Okudumile", welcome: "Siyakwamukela", login: "Ngena", logout: "Phuma" },
  am: { kitchen1: " በኩሽናህ ውስጥ ምን አለ?", kitchen2: "ዲዲ ታበስላለች.", cuisine: "የምግብ አይነት?", location: "የት ነው የምታበስለው?", title: "ምን ማብሰል", subtitle: "ትፈልጋለህ?", add: "ንጥረ ነገሮችን ጨምር", yours: "ንጥረ ነገሮችህ", how: "እንዴት መብላት ትፈልጋለህ?", find: "ምግብ ፈልግ", howWorks: "እንዴት ይሰራል", tip: "ምክር", popular: "ታዋቂ", welcome: "እንኳን ደህና መጣህ", login: "ግባ", logout: "ውጣ" },
  hi: { kitchen1: "तुम्हारे किचन में क्या है?", kitchen2: "डिडी इसे पकाएगी.", cuisine: "कौन सा खाना?", location: "तुम कहाँ पका रहे हो?", title: "आप क्या", subtitle: "पकाना चाहते हैं?", add: "सामग्री जोड़ें", yours: "आपकी सामग्री", how: "आप कैसे खाना चाहते हैं?", find: "भोजन खोजें", howWorks: "यह कैसे काम करता है", tip: "टिप", popular: "लोकप्रिय", welcome: "नमस्ते", login: "लॉगिन", logout: "लॉगआउट" },
  zh: { kitchen1: "你的厨房里有什么？", kitchen2: "Didi 会做出来.", cuisine: "菜系?", location: "你在哪里做饭?", title: "你想", subtitle: "做什么菜?", add: "添加食材", yours: "你的食材", how: "你想怎么吃?", find: "找菜", howWorks: "怎么用", tip: "小贴士", popular: "热门", welcome: "欢迎", login: "登录", logout: "退出" },
  ja: { kitchen1: "キッチンに何がある？", kitchen2: "Didi が作ってくれる.", cuisine: "料理のスタイル?", location: "どこで料理する?", title: "何を", subtitle: "作りたい?", add: "材料を追加", yours: "あなたの材料", how: "どう食べたい?", find: "料理を探す", howWorks: "使い方", tip: "ヒント", popular: "人気", welcome: "ようこそ", login: "ログイン", logout: "ログアウト" },
};

export function t(lang, key) { return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key; }
export function getSession() { try { return JSON.parse(localStorage.getItem("didi_session") || "null"); } catch { return null; } }
export function getPrefs(email) { try { return JSON.parse(localStorage.getItem(`didi_prefs_${email}`) || "{}"); } catch { return {}; } }
export function savePrefs(email, prefs) { const old = getPrefs(email); localStorage.setItem(`didi_prefs_${email}`, JSON.stringify({ ...old, ...prefs })); }
export function logoutUser() { localStorage.removeItem("didi_session"); }
function getUsers() { try { return JSON.parse(localStorage.getItem("didi_users") || "[]"); } catch { return []; } }
function saveUsers(users) { localStorage.setItem("didi_users", JSON.stringify(users)); }
export function registerUser(name, email, password) {
  const users = getUsers(); const cleanEmail = email.trim().toLowerCase();
  if (users.find(u => u.email === cleanEmail)) throw new Error("This email is already registered. Please login instead.");
  const newUser = { name: name.trim(), email: cleanEmail, password }; users.push(newUser); saveUsers(users);
  const session = { name: newUser.name, email: newUser.email }; localStorage.setItem("didi_session", JSON.stringify(session)); return session;
}
export function loginUser(email, password) {
  const users = getUsers(); const cleanEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email === cleanEmail);
  if (!found) throw new Error("No account with this email. Please register first.");
  if (found.password !== password) throw new Error("Wrong password. Try again.");
  const session = { name: found.name, email: found.email }; localStorage.setItem("didi_session", JSON.stringify(session)); return session;
}
function userKey(user, base) { const email = typeof user === "string" ? user : user?.email; return email ? `didi_${base}_${email}` : `didi_${base}_guest`; }
function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
export function getFavourites(user) { return readJSON(userKey(user, "fav"), []); }
export function toggleFavourite(user, recipe) {
  const list = getFavourites(user); const exists = list.find(r => r.title === recipe.title);
  const next = exists ? list.filter(r => r.title !== recipe.title) : [{ ...recipe, savedAt: Date.now() }, ...list].slice(0, 50);
  writeJSON(userKey(user, "fav"), next); window.dispatchEvent(new Event("didi-fav-updated")); return !exists;
}
export function isFavourite(user, title) { return getFavourites(user).some(r => r.title === title); }
export function getHistory(user) { return readJSON(userKey(user, "history"), []); }
export function addHistory(user, recipe) {
  if (!recipe?.title) return; const list = getHistory(user).filter(r => r.title !== recipe.title);
  writeJSON(userKey(user, "history"), [{ ...recipe, viewedAt: Date.now() }, ...list].slice(0, 20));
  window.dispatchEvent(new Event("didi-history-updated"));
}
export function getShopping(user) { return readJSON(userKey(user, "shopping"), []); }
export function addToShopping(user, items) {
  const list = getShopping(user); const next = [...list];
  (items || []).forEach(name => { if (!next.find(i => i.name.toLowerCase() === String(name).toLowerCase())) next.push({ id: Date.now() + Math.random(), name, done: false }); });
  writeJSON(userKey(user, "shopping"), next); window.dispatchEvent(new Event("didi-shopping-updated")); return next;
}
export function toggleShopping(user, id) {
  const next = getShopping(user).map(i => i.id === id ? { ...i, done: !i.done } : i);
  writeJSON(userKey(user, "shopping"), next); window.dispatchEvent(new Event("didi-shopping-updated")); return next;
}
export function clearShopping(user, onlyDone = false) {
  const next = onlyDone ? getShopping(user).filter(i => !i.done) : [];
  writeJSON(userKey(user, "shopping"), next); window.dispatchEvent(new Event("didi-shopping-updated")); return next;
}
export function getPantry(user) { return readJSON(userKey(user, "pantry"), ["Oil", "Salt", "Onion", "Maggi"]); }
export function savePantry(user, list) { writeJSON(userKey(user, "pantry"), list); window.dispatchEvent(new Event("didi-pantry-updated")); }
export function dateStr(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
export function getStreak(user) {
  let streak = 0; const email = typeof user === "string" ? user : user?.email;
  for (let i = 0; i < 30; i++) {
    const day = dateStr(-i); const oldKey = email ? `didi_kcal_${email}_${day}` : `didi_kcal_guest_${day}`;
    const items = readJSON(oldKey, []);
    if (items?.length) streak++; else if (i > 0) break;
  } return streak;
}
export function getWeeklyKcal(user) {
  const email = typeof user === "string" ? user : user?.email;
  return Array.from({ length: 7 }, (_, i) => {
    const day = dateStr(-6 + i); const oldKey = email ? `didi_kcal_${email}_${day}` : `didi_kcal_guest_${day}`;
    const items = readJSON(oldKey, []);
    return { day: new Date(day).toLocaleDateString("en", { weekday: "short" }), date: day, total: items.reduce((s, x) => s + (x.totalKcal || 0), 0), count: items.length };
  });
}
export function getWater(user, date = dateStr(0)) { return readJSON(userKey(user, `water_${date}`), 0); }
export function setWater(user, n, date = dateStr(0)) { writeJSON(userKey(user, `water_${date}`), n); }
export function getWeights(user) { return readJSON(userKey(user, "weights"), []); }
export function addWeight(user, kg) {
  const list = [{ date: dateStr(0), kg: parseFloat(kg), at: Date.now() }, ...getWeights(user)].slice(0, 100);
  writeJSON(userKey(user, "weights"), list); return list;
}
export const SWAPS = {
  "Parmesan": ["Cheddar", "Pecorino", "Grated Mozzarella"],
  "Heavy Cream": ["Milk + 1 tbsp Butter", "Coconut Milk", "Evaporated Milk"],
  "Fettuccine": ["Spaghetti", "Penne", "Rice"],
  "Palm Oil": ["Vegetable Oil + Paprika", "Groundnut Oil"],
  "Ugu": ["Baby Spinach", "Kale"], "Crayfish": ["Dried Shrimp", "Fish Powder"],
  "Scotch Bonnet": ["Habanero", "Chilli"], "Yam": ["Potato", "Sweet Potato"], "Butter": ["Margarine", "Vegetable Oil"],
};
export function getSwaps(ing) {
  const key = Object.keys(SWAPS).find(k => String(ing).toLowerCase().includes(k.toLowerCase()));
  return key ? SWAPS[key] : ["Onion", "Garlic", "Any similar ingredient"];
}

// ---------- MARKET PRICES ----------
// Upstash is source of truth. These local helpers are kept ONLY so old imports don't crash.
// CostEstimator.jsx NO LONGER calls getMarketPrices() / saveMarketPrice() - it fetches /api/community directly.
export const DEFAULT_MARKET_PRICES = {
  "rice": 2500, "chicken": 4500, "tomato": 1200, "pepper": 800,
  "onion": 900, "yam": 3000, "beans": 1800, "plantain": 1500,
  "eggs": 200, "beef": 5000, "oil": 3500, "garri": 1500,
  "egusi": 2200, "crayfish": 1800, "palm oil": 2800, "maggi": 500,
  "stockfish": 4000, "ugu": 800, "potato": 1200, "butter": 2500,
  "fettuccine": 3500, "heavy cream": 4000, "parmesan": 6000,
  "cheese": 4500, "pasta": 2500, "salt": 500, "garlic": 1000,
};

export function getMarketPrices() {
  try {
    const saved = JSON.parse(localStorage.getItem("didi_market_prices") || "{}");
    return { ...DEFAULT_MARKET_PRICES, ...saved };
  } catch { return DEFAULT_MARKET_PRICES; }
}

export function saveMarketPrice(key, price) {
  // DEPRECATED: kept for backwards compat, CostEstimator now POSTs to /api/community (Upstash)
  const current = getMarketPrices();
  const next = { ...current, [String(key).toLowerCase()]: parseInt(price) };
  localStorage.setItem("didi_market_prices", JSON.stringify(next));
  window.dispatchEvent(new Event("didi-market-updated"));
  return next;
}

export function marketLocationFor(location) {
  return location === "abroad" ? "abroad" : "lagos";
}

// ---------- QUESTS - Zero Waste Hero REMOVED ----------
export const QUESTS = [
  { id: "jollof-week", title: "Jollof Week 🔥", desc: "Cook Jollof 2x this week with what you have", reward: "Jollof Master Badge", total: 2, match: (title) => String(title).toLowerCase().includes("jollof") },
  // DELETED: { id: "zero-waste-3", title: "Zero Waste Hero ♻️", ... } - removed per request
  { id: "no-spend-sunday", title: "No-Spend Sunday", desc: "Cook a full meal with ONLY pantry items", reward: "Pantry Pro Badge", total: 1, match: () => true },
  { id: "soup-sunday", title: "Soup Sunday 🍲", desc: "Cook any soup / stew this Sunday", reward: "Soup Star Badge", total: 1, match: (title) => /soup|stew|egusi|ogbono|pepper soup|ewedu|okro/i.test(String(title)) },
];

// Helper: filter out Zero Waste even if it was saved before deletion
const isZeroWaste = (id) => id === "zero-waste-3" || id === "zero_waste" || id === "zero_waste_hero" || String(id).toLowerCase().includes("zero");

export function getQuests(user) {
  try {
    const email = typeof user === "string" ? user : user?.email;
    const key = email ? `didi_quests_${email}` : `didi_quests_guest`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    return list.filter(q => !isZeroWaste(q.id));
  } catch { return []; }
}

export function joinQuest(user, questId) {
  // Block Zero Waste from being joined again
  if (isZeroWaste(questId)) return getQuests(user);
  const email = typeof user === "string" ? user : user?.email;
  const key = email ? `didi_quests_${email}` : `didi_quests_guest`;
  const list = getQuests(user);
  if (list.find(q => q.id === questId)) return list;
  const quest = QUESTS.find(q => q.id === questId);
  if (!quest) return list;
  const next = [...list, { id: questId, progress: 0, total: quest.total, completed: false, joinedAt: Date.now() }];
  localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new Event("didi-quests-updated"));
  return next;
}

export function progressQuests(user, recipeTitle) {
  const list = getQuests(user).filter(q => !isZeroWaste(q.id));
  if (!list.length) return { list, newlyCompleted: [] };
  const email = typeof user === "string" ? user : user?.email;
  const key = email ? `didi_quests_${email}` : `didi_quests_guest`;
  const newlyCompleted = [];
  const next = list.map(q => {
    if (q.completed) return q;
    const quest = QUESTS.find(x => x.id === q.id);
    if (!quest) return q;
    if (!quest.match(recipeTitle)) return q;
    const progress = q.progress + 1;
    const completed = progress >= q.total;
    if (completed) newlyCompleted.push(q.id);
    return { ...q, progress, completed, completedAt: completed ? Date.now() : q.completedAt };
  });
  if (newlyCompleted.length) {
    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("didi-quests-updated"));
  }
  return { list: next, newlyCompleted };
}

// ---------- UPSTASH HELPERS - Quests & Market Prices go here, NOT localStorage ----------
// Use these from Quests.jsx / CostEstimator.jsx:
export async function fetchMyQuestsFromUpstash(email) {
  if (!email) return [];
  try {
    const r = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
    const j = await r.json();
    const cloud = j?.data?.quests || j?.quests || [];
    return cloud.filter(q => !isZeroWaste(q.id));
  } catch { return []; }
}
export async function joinQuestOnUpstash({ email, questId, location }) {
  return fetch("/api/community?type=quests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", questId, location: location === "abroad" ? "abroad" : "lagos", email: email || "guest" }),
  });
}
export async function reportMarketPriceToUpstash({ item, price, location, email }) {
  return fetch("/api/community?type=market-prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location: location === "abroad" ? "abroad" : "lagos", item, price, email: email || "guest" }),
  });
}
// ---------- REVIEWS - Upstash via /api/reviews ----------
export async function saveReview({ name, email, rating, comment }) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: email || "guest", rating, comment }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Failed to send review");
  return j.review;
}

export async function getReviews() {
  try {
    const res = await fetch("/api/reviews");
    const j = await res.json();
    return j.reviews || [];
  } catch { return []; }
}

export async function deleteReview(id) {
  const res = await fetch("/api/reviews", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Failed to delete");
  return true;
}

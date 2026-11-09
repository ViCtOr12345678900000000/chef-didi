export const THEMES = {
  // Royal Violet — your main brand, deep not neon
  purple: {
    name: "Royal Violet",
    page: "from-[#2E1A5E] via-[#4A2C8A] to-[#6D4AC8]",
    btn: "from-[#4A2C8A] to-[#7B61FF]",
  },
  // Champagne Gold — luxury, not yellow
  gold: {
    name: "Champagne Gold",
    page: "from-[#1A1A2E] via-[#2B2110] to-[#5C4A1E]",
    btn: "from-[#B8963E] to-[#E5C76B]",
  },
  // Emerald Noir — deep green + black
  emerald: {
    name: "Emerald Noir",
    page: "from-[#06281F] via-[#0B3D2E] to-[#146B4D]",
    btn: "from-[#0B3D2E] to-[#1DB954]",
  },
  // Sapphire — deep blue, premium
  sapphire: {
    name: "Sapphire",
    page: "from-[#0A1A3A] via-[#122E6B] to-[#2A5BD7]",
    btn: "from-[#122E6B] to-[#3D7BFF]",
  },
  // Bordeaux — wine / luxury red, NOT pink
  bordeaux: {
    name: "Bordeaux",
    page: "from-[#2A0A14] via-[#4A1224] to-[#7A1F3A]",
    btn: "from-[#5A1A2E] to-[#9B2C4A]",
  },
  // Obsidian — black + silver, most premium
  obsidian: {
    name: "Obsidian",
    page: "from-[#0A0A0F] via-[#1A1A2E] to-[#2E2E3A]",
    btn: "from-[#1A1A2E] to-[#4A4A5A]",
  },
};

export const GOALS = {
  normal: { id: "normal", label: "Normal", desc: "Balanced Nigerian meals", calories: 2000, emoji: "🍲" },
  weightloss: { id: "weightloss", label: "Weight Loss", desc: "Lighter, more veg, grilled", calories: 1500, emoji: "⬇" },
  weightgain: { id: "weightgain", label: "Weight Gain", desc: "Richer, more food, healthy fats", calories: 2800, emoji: "⬆" },
  fit: { id: "fit", label: "Fit", desc: "High protein, toning", calories: 2400, emoji: "🏋️" },
};

export function caloriesFor(goal, sittings, customCalories) {
  const total = customCalories && customCalories > 0 ? customCalories : (GOALS[goal]?.calories || 2000);
  return {
    total,
    perSitting: Math.round(total / (sittings || 3)),
    isCustom: !!(customCalories && customCalories > 0),
  };
}

export const TRANSLATIONS = {
  en: { title: "What do you", subtitle: "want to cook?", add: "Add Ingredients", yours: "Your Ingredients", how: "How do you want to eat?", find: "Find Meal", howWorks: "How it works", tip: "Tip", popular: "Popular combos", welcome: "Welcome", login: "Login", logout: "Logout" },
  yo: { title: "Kini o fe", subtitle: "se?", add: "Fi Eroja Kun", yours: "Eroja Re", how: "Bawo ni o fe je?", find: "Wa Ounje", howWorks: "Bawo ni o n sise", tip: "Imoran", popular: "Awon to gbajumo", welcome: "Kaabo", login: "Wole", logout: "Jade" },
  ig: { title: "Kedu ihe i", subtitle: "choro isi?", add: "Tinye Ihe", yours: "Ihe Gi", how: "Kedu ka ichoro iri?", find: "Chota Nri", howWorks: "Otu o si aru oru", tip: "Ndumodu", popular: "Ndi a ma ama", welcome: "Nnoo", login: "Banye", logout: "Puọ" },
  ha: { title: "Me kake", subtitle: "so ka dafa?", add: "Saka Sinadaran", yours: "Sinadaran Naka", how: "Yaya kake so ka ci?", find: "Nemo Abinci", howWorks: "Yaya yake aiki", tip: "Shawara", popular: "Mafi shahara", welcome: "Barka da zuwa", login: "Shiga", logout: "Fita" },
  pcm: { title: "Wetin you", subtitle: "wan cook?", add: "Add Ingredients", yours: "Your Ingredients", how: "How you wan chop?", find: "Find Meal", howWorks: "How e dey work", tip: "Tip", popular: "Popular combos", welcome: "Welcome", login: "Login", logout: "Logout" },
  fr: { title: "Que veux-tu", subtitle: "cuisiner?", add: "Ajouter Ingrédients", yours: "Vos Ingrédients", how: "Comment veux-tu manger?", find: "Trouver Repas", howWorks: "Comment ça marche", tip: "Astuce", popular: "Populaires", welcome: "Bienvenue", login: "Connexion", logout: "Déconnexion" },
  es: { title: "¿Qué quieres", subtitle: "cocinar?", add: "Añadir Ingredientes", yours: "Tus Ingredientes", how: "¿Cómo quieres comer?", find: "Buscar Comida", howWorks: "Cómo funciona", tip: "Consejo", popular: "Populares", welcome: "Bienvenido", login: "Iniciar", logout: "Salir" },
  pt: { title: "O que você", subtitle: "quer cozinhar?", add: "Adicionar Ingredientes", yours: "Seus Ingredientes", how: "Como quer comer?", find: "Buscar Refeição", howWorks: "Como funciona", tip: "Dica", popular: "Populares", welcome: "Bem-vindo", login: "Entrar", logout: "Sair" },
  de: { title: "Was willst du", subtitle: "kochen?", add: "Zutaten Hinzufügen", yours: "Deine Zutaten", how: "Wie willst du essen?", find: "Mahlzeit Finden", howWorks: "Wie es funktioniert", tip: "Tipp", popular: "Beliebt", welcome: "Willkommen", login: "Anmelden", logout: "Abmelden" },
  ar: { title: "ماذا تريد", subtitle: "أن تطبخ؟", add: "أضف المكونات", yours: "مكوناتك", how: "كيف تريد أن تأكل؟", find: "ابحث عن وجبة", howWorks: "كيف يعمل", tip: "نصيحة", popular: "شائع", welcome: "أهلاً", login: "دخول", logout: "خروج" },
  sw: { title: "Unataka", subtitle: "kupika nini?", add: "Ongeza Viungo", yours: "Viungo Vyako", how: "Unataka kula vipi?", find: "Tafuta Chakula", howWorks: "Inavyofanya kazi", tip: "Kidokezo", popular: "Maarufu", welcome: "Karibu", login: "Ingia", logout: "Toka" },
  zu: { title: "Ufuna", subtitle: "ukupheka ini?", add: "Engeza Izithako", yours: "Izithako Zakho", how: "Ufuna ukudla kanjani?", find: "Thola Ukudla", howWorks: "Kusebenza kanjani", tip: "Ithiphu", popular: "Okudumile", welcome: "Siyakwamukela", login: "Ngena", logout: "Phuma" },
  am: { title: "ምን ማብሰል", subtitle: "ትፈልጋለህ?", add: "ንጥረ ነገሮችን ጨምር", yours: "ንጥረ ነገሮችህ", how: "እንዴት መብላት ትፈልጋለህ?", find: "ምግብ ፈልግ", howWorks: "እንዴት ይሰራል", tip: "ምክር", popular: "ታዋቂ", welcome: "እንኳን ደህና መጣህ", login: "ግባ", logout: "ውጣ" },
  hi: { title: "आप क्या", subtitle: "पकाना चाहते हैं?", add: "सामग्री जोड़ें", yours: "आपकी सामग्री", how: "आप कैसे खाना चाहते हैं?", find: "भोजन खोजें", howWorks: "यह कैसे काम करता है", tip: "टिप", popular: "लोकप्रिय", welcome: "नमस्ते", login: "लॉगिन", logout: "लॉगआउट" },
  zh: { title: "你想", subtitle: "做什么菜?", add: "添加食材", yours: "你的食材", how: "你想怎么吃?", find: "找菜", howWorks: "怎么用", tip: "小贴士", popular: "热门", welcome: "欢迎", login: "登录", logout: "退出" },
  ja: { title: "何を", subtitle: "作りたい?", add: "材料を追加", yours: "あなたの材料", how: "どう食べたい?", find: "料理を探す", howWorks: "使い方", tip: "ヒント", popular: "人気", welcome: "ようこそ", login: "ログイン", logout: "ログアウト" },
};

export function t(lang, key) {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem("didi_session") || "null"); } catch { return null; }
}
export function getPrefs(email) {
  try { return JSON.parse(localStorage.getItem(`didi_prefs_${email}`) || "{}"); } catch { return {}; }
}
export function savePrefs(email, prefs) {
  const old = getPrefs(email);
  localStorage.setItem(`didi_prefs_${email}`, JSON.stringify({ ...old, ...prefs }));
}
export function logoutUser() {
  localStorage.removeItem("didi_session");
}
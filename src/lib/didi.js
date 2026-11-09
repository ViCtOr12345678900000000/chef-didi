export const THEMES = {
  purple: { id:'purple', name:'Purple', page:'from-[#5A3EC8] via-[#7B61FF] to-[#C9B8FF]', btn:'from-[#5A3EC8] via-[#7B61FF] to-[#9B8CFF]', accent:'#7B61FF', soft:'#F5F0FF' },
  blue: { id:'blue', name:'Blue', page:'from-[#1E40AF] via-[#3A86FF] to-[#A8D8FF]', btn:'from-[#1E40AF] via-[#3A86FF] to-[#60A5FA]', accent:'#3A86FF', soft:'#EFF6FF' },
  green: { id:'green', name:'Green', page:'from-[#065F46] via-[#059669] to-[#A7F3D0]', btn:'from-[#065F46] via-[#059669] to-[#34D399]', accent:'#059669', soft:'#ECFDF5' },
  orange: { id:'orange', name:'Orange', page:'from-[#9A3412] via-[#F97316] to-[#FDBA74]', btn:'from-[#9A3412] via-[#F97316] to-[#FB923C]', accent:'#F97316', soft:'#FFF7ED' },
  pink: { id:'pink', name:'Pink', page:'from-[#9D174D] via-[#EC4899] to-[#FBCFE8]', btn:'from-[#9D174D] via-[#EC4899] to-[#F472B6]', accent:'#EC4899', soft:'#FDF2F8' },
  dark: { id:'dark', name:'Midnight', page:'from-[#0F172A] via-[#1E293B] to-[#475569]', btn:'from-[#0F172A] via-[#334155] to-[#64748B]', accent:'#334155', soft:'#F8FAFC' },
};
export const GOALS = {
  normal: { id:'normal', label:'Normal', emoji:'🍲', desc:'Normal oil • Normal portion', calories:2000 },
  weightloss: { id:'weightloss', label:'Weight Loss', emoji:'⬇', desc:'Less oil • Grilled/boiled • Small portion', calories:1500 },
  weightgain: { id:'weightgain', label:'Weight Gain', emoji:'⬆', desc:'More protein + carbs • Bigger portion', calories:2800 },
  fit: { id:'fit', label:'Fit / Muscle', emoji:'🏋️', desc:'High protein • Low sugar • Clean carbs', calories:2400 },
};
export const LANGUAGES = [
  { id:'en', label:'English' }, { id:'yo', label:'Yorùbá' }, { id:'ha', label:'Hausa' }, { id:'ig', label:'Igbo' }, { id:'pcm', label:'Pidgin' },
  { id:'fr', label:'Français' }, { id:'es', label:'Español' }, { id:'pt', label:'Português' }, { id:'de', label:'Deutsch' }, { id:'it', label:'Italiano' },
  { id:'ar', label:'العربية' }, { id:'zh', label:'中文' }, { id:'hi', label:'हिन्दी' }, { id:'sw', label:'Kiswahili' }, { id:'tr', label:'Türkçe' }, { id:'ru', label:'Русский' },
];
export const T = {
  en: { title:"What’s in your kitchen?", subtitle:"Didi will cook it.", add:"Add Ingredients", yours:"Your Ingredients", response:"Didi's Response", find:"Find Meal", how:"How do you want Didi to cook?", sittings:"Number of sittings", perSitting:"per sitting", goal:"Goal", login:"Login", logout:"Logout", welcome:"Welcome", tip:"Tip", popular:"Popular Right Now", howWorks:"How Didi Works" },
  yo: { title:"Kí ni ó wà nínú ìdáná rẹ?", subtitle:"Didi yóò sè é.", add:"Fi Eroja Kun", yours:"Eroja Rẹ", response:"Idahun Didi", find:"Wa Ounjẹ", how:"Báwo ni o fẹ́ kí Didi sè é?", sittings:"Iye ìjókòó", perSitting:"fún ìjókòó kan", goal:"Ète", login:"Wọlé", logout:"Jáde", welcome:"Ẹ n lẹ", tip:"Imọran", popular:"Tó gbajúmọ̀ Nísinsìnyí", howWorks:"Báwo ni Didi Ṣe Nṣiṣẹ́" },
  ha: { title:"Me ke cikin kicin ɗin ka?", subtitle:"Didi za ta dafa shi.", add:"Ƙara Sinadaran", yours:"Sinadaran Ka", response:"Amsar Didi", find:"Nemo Abinci", how:"Yaya kake son Didi ta dafa?", sittings:"Yawan zama", perSitting:"kowanne zama", goal:"Manufa", login:"Shiga", logout:"Fita", welcome:"Barka da zuwa", tip:"Shawara", popular:"Shahararru Yanzu", howWorks:"Yadda Didi Ke Aiki" },
  ig: { title:"Gịnị dị na kichin gị?", subtitle:"Didi ga-esi ya.", add:"Tinye Ngwa", yours:"Ngwa Gị", response:"Azịza Didi", find:"Chọta Nri", how:"Kedu ka ị chọrọ ka Didi sie ya?", sittings:"Ọnụọgụgụ oche", perSitting:"kwa oche", goal:"Ebumnuche", login:"Banye", logout:"Pụọ", welcome:"Nnọọ", tip:"Ndụmọdụ", popular:"Ndị A Ma Ama Ugbu a", howWorks:"Otu Didi Si Arụ Ọrụ" },
  pcm: { title:"Wetin dey for your kitchen?", subtitle:"Didi go cook am.", add:"Add Ingredients", yours:"Your Ingredients", response:"Didi Answer", find:"Find Food", how:"How you wan make Didi cook am?", sittings:"How many sittings", perSitting:"per sitting", goal:"Goal", login:"Login", logout:"Logout", welcome:"Welcome", tip:"Tip", popular:"Popular Now", howWorks:"How Didi Dey Work" },
  fr: { title:"Qu’y a-t-il dans ta cuisine ?", subtitle:"Didi va le cuisiner.", add:"Ajouter Ingrédients", yours:"Tes Ingrédients", response:"Réponse de Didi", find:"Trouver Repas", how:"Comment veux-tu que Didi cuisine ?", sittings:"Nombre de prises", perSitting:"par prise", goal:"Objectif", login:"Connexion", logout:"Déconnexion", welcome:"Bienvenue", tip:"Astuce", popular:"Populaire Maintenant", howWorks:"Comment Didi Fonctionne" },
  es: { title:"¿Qué hay en tu cocina?", subtitle:"Didi lo cocinará.", add:"Añadir Ingredientes", yours:"Tus Ingredientes", response:"Respuesta de Didi", find:"Buscar Comida", how:"¿Cómo quieres que Didi cocine?", sittings:"Número de comidas", perSitting:"por comida", goal:"Objetivo", login:"Iniciar sesión", logout:"Cerrar sesión", welcome:"Bienvenido", tip:"Consejo", popular:"Popular Ahora", howWorks:"Cómo Funciona Didi" },
  pt: { title:"O que há na sua cozinha?", subtitle:"Didi vai cozinhar.", add:"Adicionar Ingredientes", yours:"Seus Ingredientes", response:"Resposta da Didi", find:"Encontrar Refeição", how:"Como você quer que a Didi cozinhe?", sittings:"Número de refeições", perSitting:"por refeição", goal:"Objetivo", login:"Entrar", logout:"Sair", welcome:"Bem-vindo", tip:"Dica", popular:"Popular Agora", howWorks:"Como a Didi Funciona" },
  de: { title:"Was ist in deiner Küche?", subtitle:"Didi wird es kochen.", add:"Zutaten Hinzufügen", yours:"Deine Zutaten", response:"Didis Antwort", find:"Mahlzeit Finden", how:"Wie soll Didi kochen?", sittings:"Anzahl der Mahlzeiten", perSitting:"pro Mahlzeit", goal:"Ziel", login:"Anmelden", logout:"Abmelden", welcome:"Willkommen", tip:"Tipp", popular:"Gerade Beliebt", howWorks:"Wie Didi Funktioniert" },
  it: { title:"Cosa c’è nella tua cucina?", subtitle:"Didi lo cucinerà.", add:"Aggiungi Ingredienti", yours:"I Tuoi Ingredienti", response:"Risposta di Didi", find:"Trova Pasto", how:"Come vuoi che Didi cucini?", sittings:"Numero di pasti", perSitting:"per pasto", goal:"Obiettivo", login:"Accedi", logout:"Esci", welcome:"Benvenuto", tip:"Consiglio", popular:"Popolare Ora", howWorks:"Come Funziona Didi" },
  ar: { title:"ماذا يوجد في مطبخك؟", subtitle:"ديدي سوف تطبخه.", add:"أضف المكونات", yours:"مكوناتك", response:"رد ديدي", find:"ابحث عن وجبة", how:"كيف تريد أن تطبخ ديدي؟", sittings:"عدد الوجبات", perSitting:"لكل وجبة", goal:"الهدف", login:"تسجيل الدخول", logout:"تسجيل الخروج", welcome:"أهلاً بك", tip:"نصيحة", popular:"شائع الآن", howWorks:"كيف تعمل ديدي" },
  zh: { title:"你的厨房里有什么？", subtitle:"Didi 会帮你做出来。", add:"添加食材", yours:"你的食材", response:"Didi 的回复", find:"找菜", how:"你想让 Didi 怎么煮？", sittings:"用餐次数", perSitting:"每次", goal:"目标", login:"登录", logout:"退出", welcome:"欢迎", tip:"小贴士", popular:"现在热门", howWorks:"Didi 是怎么工作的" },
  hi: { title:"तुम्हारे किचन में क्या है?", subtitle:"Didi इसे पकाएगी।", add:"सामग्री जोड़ें", yours:"तुम्हारी सामग्री", response:"Didi का जवाब", find:"खाना खोजें", how:"तुम Didi से कैसे पकवाना चाहते हो?", sittings:"बैठकों की संख्या", perSitting:"प्रति बैठक", goal:"लक्ष्य", login:"लॉगिन", logout:"लॉगआउट", welcome:"स्वागत है", tip:"टिप", popular:"अभी लोकप्रिय", howWorks:"Didi कैसे काम करती है" },
  sw: { title:"Nini kiko jikoni kwako?", subtitle:"Didi ataipika.", add:"Ongeza Viungo", yours:"Viungo Vyako", response:"Jibu la Didi", find:"Tafuta Chakula", how:"Unataka Didi apike vipi?", sittings:"Idadi ya mikao", perSitting:"kwa mkao", goal:"Lengo", login:"Ingia", logout:"Toka", welcome:"Karibu", tip:"Kidokezo", popular:"Maarufu Sasa", howWorks:"Didi Anafanya Kazi Vipi" },
  tr: { title:"Mutfağında ne var?", subtitle:"Didi pişirecek.", add:"Malzeme Ekle", yours:"Malzemelerin", response:"Didi’nin Cevabı", find:"Yemek Bul", how:"Didi’nin nasıl pişirmesini istiyorsun?", sittings:"Öğün Sayısı", perSitting:"öğün başına", goal:"Hedef", login:"Giriş Yap", logout:"Çıkış Yap", welcome:"Hoş Geldin", tip:"İpucu", popular:"Şu An Popüler", howWorks:"Didi Nasıl Çalışır" },
  ru: { title:"Что у тебя на кухне?", subtitle:"Didi приготовит это.", add:"Добавить Ингредиенты", yours:"Твои Ингредиенты", response:"Ответ Didi", find:"Найти Блюдо", how:"Как ты хочешь, чтобы Didi готовила?", sittings:"Количество приёмов", perSitting:"за приём", goal:"Цель", login:"Войти", logout:"Выйти", welcome:"Добро пожаловать", tip:"Совет", popular:"Популярное Сейчас", howWorks:"Как Работает Didi" },
};
export const t = (lang, key) => (T[lang] && T[lang][key]) || T.en[key] || key;
const USERS_KEY='didi_users', SESSION_KEY='didi_session';
const PREF_KEY=(email)=>`didi_prefs_${email}`;
export function getUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY))||[] }catch{ return [] } }
export function registerUser(name,email,password){
  const users=getUsers(); if(users.find(u=>u.email===email)) throw new Error('Email already registered. Login instead.');
  const user={name,email,password}; localStorage.setItem(USERS_KEY, JSON.stringify([...users,user]));
  localStorage.setItem(SESSION_KEY, JSON.stringify({email,name})); savePrefs(email,{goal:'normal',theme:'purple',lang:'en',sittings:3}); return user;
}
export function loginUser(email,password){
  const user=getUsers().find(u=>u.email===email&&u.password===password); if(!user) throw new Error('Wrong email or password.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({email:user.email,name:user.name})); return user;
}
export function getSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY))||null }catch{ return null } }
export function logoutUser(){ localStorage.removeItem(SESSION_KEY); }
export function getPrefs(email){ if(!email) return {goal:'normal',theme:'purple',lang:'en',sittings:3}; try{ return {goal:'normal',theme:'purple',lang:'en',sittings:3,...JSON.parse(localStorage.getItem(PREF_KEY(email)))} }catch{ return {goal:'normal',theme:'purple',lang:'en',sittings:3} } }
export function savePrefs(email,prefs){ if(!email) return; localStorage.setItem(PREF_KEY(email), JSON.stringify({...getPrefs(email),...prefs})); }
export function caloriesFor(goal,sittings){ const total=GOALS[goal]?.calories||2000; return { total, perSitting: Math.round(total/Math.max(1,sittings)) }; }
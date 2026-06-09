// BookFlow Design Generator — Figma Plugin
// Generates: Design System + Home + Browse + AI Chat + Dashboard + Auth pages
// Run via: Plugins > Development > Import plugin from manifest → select manifest.json → Run

(async () => {
  // ── Font loading ──────────────────────────────────────────────────────────
  const FONTS = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Bold" },
    { family: "Inter", style: "ExtraBold" },
  ];
  for (const f of FONTS) await figma.loadFontAsync(f);

  // ── Color Tokens (RGB 0-1) ────────────────────────────────────────────────
  const C = {
    bg:        [6,   12,  26],
    surface:   [13,  21,  38],
    surfaceEl: [17,  29,  48],
    border:    [30,  45,  69],
    text1:     [226, 232, 240],
    text2:     [148, 163, 184],
    text3:     [100, 116, 139],
    brand:     [107, 127, 255],
    teal:      [45,  212, 191],
    violet:    [167, 139, 250],
    green:     [74,  222, 128],
    amber:     [251, 191, 36],
    rose:      [251, 113, 133],
    red:       [248, 113, 113],
    blue:      [96,  165, 250],
    white:     [255, 255, 255],
    dark:      [6,   12,  26],
  };

  const toRgb = (a) => ({ r: a[0] / 255, g: a[1] / 255, b: a[2] / 255 });
  const solid = (a, op = 1) => [{ type: "SOLID", color: toRgb(a), opacity: op }];
  const noFill = () => [];

  // ── Low-level helpers ─────────────────────────────────────────────────────
  function place(parent, node, x, y) {
    parent.appendChild(node);
    node.x = x;
    node.y = y;
    return node;
  }

  function frame(name, w, h, fillArr = null, fillOp = 1, radius = 0) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(w, h);
    f.fills = fillArr ? solid(fillArr, fillOp) : noFill();
    f.cornerRadius = radius;
    f.clipsContent = false;
    return f;
  }

  function rect(name, w, h, fillArr = null, fillOp = 1, radius = 0) {
    const r = figma.createRectangle();
    r.name = name;
    r.resize(w, h);
    r.fills = fillArr ? solid(fillArr, fillOp) : noFill();
    r.cornerRadius = radius;
    return r;
  }

  function ellipse(name, w, h, fillArr, fillOp = 1) {
    const e = figma.createEllipse();
    e.name = name;
    e.resize(w, h);
    e.fills = solid(fillArr, fillOp);
    return e;
  }

  function text(content, size, weight, fillArr, fillOp = 1, maxW = null) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: weight };
    t.fontSize = size;
    t.fills = solid(fillArr, fillOp);
    if (maxW) { t.textAutoResize = "HEIGHT"; t.resize(maxW, 1); }
    t.characters = content;
    return t;
  }

  function stroke(node, fillArr, op = 0.6, weight = 1) {
    node.strokes = [{ type: "SOLID", color: toRgb(fillArr), opacity: op }];
    node.strokeWeight = weight;
    return node;
  }

  // ── Composite components ───────────────────────────────────────────────────
  function mkHeader(parent, pageW = 1440) {
    const h = frame("Header", pageW, 64, C.bg, 0.95);
    stroke(h, C.border, 0.5);
    place(parent, h, 0, 0);
    place(h, text("📚 BookFlow", 20, "Bold", C.text1), 72, 20);
    const navItems = [
      { label: "Browse",        color: C.text2, x: 300 },
      { label: "Categories",    color: C.text2, x: 420 },
      { label: "✨ AI Search",  color: C.violet, x: 548 },
      { label: "List a Book",   color: C.text2, x: 680 },
    ];
    navItems.forEach((n) => place(h, text(n.label, 14, "Medium", n.color), n.x, 22));

    const loginBtn = frame("Btn/Login", 84, 36, null, 1, 8);
    stroke(loginBtn, C.border, 0.7);
    place(h, loginBtn, pageW - 196, 14);
    place(loginBtn, text("Log In", 14, "Medium", C.text1), 18, 9);

    const regBtn = frame("Btn/Register", 96, 36, C.brand, 1, 8);
    place(h, regBtn, pageW - 104, 14);
    place(regBtn, text("Sign Up", 14, "SemiBold", C.dark), 20, 9);
    return h;
  }

  function mkBadge(label, fillArr, parent, x, y) {
    const b = frame(`Badge/${label}`, label.length * 7 + 20, 24, fillArr, 0.12, 999);
    stroke(b, fillArr, 0.3);
    place(parent, b, x, y);
    place(b, text(label, 11, "SemiBold", fillArr), 10, 5);
    return b;
  }

  function mkBookCard(parent, book, cx, cy) {
    const card = frame(`Card/${book.title}`, 264, 292, C.surfaceEl, 1, 14);
    stroke(card, C.border, 0.55);
    place(parent, card, cx, cy);

    // Cover
    const cover = rect("Cover", 264, 152, book.accentColor, 0.1);
    place(card, cover, 0, 0);
    place(card, text(book.icon, 52, "Regular", book.accentColor), 104, 44);

    // Listing type badge
    const ltColor = book.listType === "Sale" ? C.brand : book.listType === "Exchange" ? C.teal : C.violet;
    mkBadge(book.listType, ltColor, card, 12, 12);

    // Wishlist btn
    place(card, text("♡", 16, "Regular", C.text3), 232, 12);

    // Info
    place(card, text(book.title, 14, "SemiBold", C.text1, 1, 236), 14, 164);
    place(card, text(book.author, 12, "Regular", C.text2, 1, 236), 14, 184);
    place(card, text(book.price, 18, "Bold", C.brand), 14, 212);

    const condColor = book.cond === "New" ? C.green : book.cond === "Good" ? C.blue : book.cond === "Acceptable" ? C.amber : C.red;
    mkBadge(book.cond, condColor, card, 14, 250);
    place(card, text("📍 " + book.city, 11, "Regular", C.text3), 100, 253);
    return card;
  }

  // ── Page setup ────────────────────────────────────────────────────────────
  figma.currentPage.name = "🎨 Design System";
  const DS_PAGE  = figma.currentPage;
  const HOME_PAGE  = figma.createPage(); HOME_PAGE.name  = "🏠 Home";
  const BROWSE_PAGE = figma.createPage(); BROWSE_PAGE.name = "📚 Browse";
  const CHAT_PAGE  = figma.createPage(); CHAT_PAGE.name  = "🤖 AI Chat";
  const DASH_PAGE  = figma.createPage(); DASH_PAGE.name  = "📊 Dashboard";
  const AUTH_PAGE  = figma.createPage(); AUTH_PAGE.name  = "🔐 Auth";
  const DETAIL_PAGE = figma.createPage(); DETAIL_PAGE.name = "📖 Book Detail";
  const ADMIN_PAGE = figma.createPage(); ADMIN_PAGE.name = "⚙️ Admin";

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — DESIGN SYSTEM
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = DS_PAGE;

  place(DS_PAGE, text("BookFlow Design System", 36, "Bold", C.text1), 48, 48);
  place(DS_PAGE, text("Dark Glass Morphism  ·  Arabic/English Bilingual  ·  AI-Enhanced", 16, "Regular", C.text2), 48, 100);

  // ── Colors ──
  const colorSec = frame("Color Palette", 1344, 340, C.surface, 1, 16);
  place(DS_PAGE, colorSec, 48, 152);
  place(colorSec, text("Color Palette", 18, "SemiBold", C.text1), 32, 24);

  const colorTokens = [
    { name: "Background",  hex: "#060c1a",  c: C.bg },
    { name: "Surface",     hex: "#0d1526",  c: C.surface },
    { name: "Elevated",    hex: "#111d30",  c: C.surfaceEl },
    { name: "Border",      hex: "#1e2d45",  c: C.border },
    { name: "Brand",       hex: "#6b7fff",  c: C.brand },
    { name: "Teal/Accent", hex: "#2dd4bf",  c: C.teal },
    { name: "Violet/AI",   hex: "#a78bfa",  c: C.violet },
    { name: "Green/New",   hex: "#4ade80",  c: C.green },
    { name: "Amber",       hex: "#fbbf24",  c: C.amber },
    { name: "Rose",        hex: "#fb7185",  c: C.rose },
  ];

  colorTokens.forEach((t, i) => {
    const cx = 32 + (i % 5) * 264;
    const cy = 62 + Math.floor(i / 5) * 128;
    const swatch = rect(t.name, 224, 68, t.c, 1, 10);
    place(colorSec, swatch, cx, cy);
    place(colorSec, text(t.name, 12, "SemiBold", C.text1), cx, cy + 76);
    place(colorSec, text(t.hex,  11, "Regular",  C.text3), cx, cy + 94);
  });

  // ── Typography ──
  const typSec = frame("Typography", 1344, 360, C.surface, 1, 16);
  place(DS_PAGE, typSec, 48, 540);
  place(typSec, text("Typography — Inter", 18, "SemiBold", C.text1), 32, 24);

  const typeStyles = [
    { label: "Display / H1",   size: 48, weight: "ExtraBold", sample: "AI-Powered Book Exchange" },
    { label: "Heading / H2",   size: 32, weight: "Bold",      sample: "Browse 2,500+ Books" },
    { label: "Subheading / H3",size: 24, weight: "SemiBold",  sample: "Featured Listings" },
    { label: "Body Large",     size: 18, weight: "Regular",   sample: "Discover, trade, and explore books with AI assistance" },
    { label: "Body",           size: 14, weight: "Regular",   sample: "Connect with readers across the MENA region" },
    { label: "Caption",        size: 11, weight: "Medium",    sample: "14 views · 2 days ago · Riyadh, SA" },
  ];

  let tyY = 62;
  typeStyles.forEach((s) => {
    place(typSec, text(s.label, 11, "Medium", C.text3), 32, tyY + 2);
    place(typSec, text(s.sample, s.size, s.weight, C.text1, 1, 1100), 200, tyY);
    tyY += s.size + 20;
  });

  // ── Components ──
  const compSec = frame("Components", 1344, 560, C.surface, 1, 16);
  place(DS_PAGE, compSec, 48, 956);
  place(compSec, text("Components", 18, "SemiBold", C.text1), 32, 24);

  // Buttons
  place(compSec, text("Buttons", 11, "Medium", C.text3), 32, 62);

  const btn1 = frame("Button/Primary", 160, 44, C.brand, 1, 12);
  place(compSec, btn1, 32, 80);
  place(btn1, text("Browse Books", 14, "SemiBold", C.dark), 24, 12);

  const btn2 = frame("Button/AI", 172, 44, C.violet, 0.15, 12);
  stroke(btn2, C.violet, 0.4);
  place(compSec, btn2, 208, 80);
  place(btn2, text("✨ Try AI Search", 14, "SemiBold", C.violet), 18, 12);

  const btn3 = frame("Button/Ghost", 168, 44, null, 1, 12);
  stroke(btn3, C.border, 0.8);
  place(compSec, btn3, 396, 80);
  place(btn3, text("List Your Book", 14, "Medium", C.text1), 22, 12);

  const btn4 = frame("Button/Teal", 176, 44, C.teal, 1, 12);
  place(compSec, btn4, 580, 80);
  place(btn4, text("Request Exchange", 14, "SemiBold", C.dark), 14, 12);

  const btn5 = frame("Button/Danger", 112, 44, C.rose, 0.12, 12);
  stroke(btn5, C.rose, 0.35);
  place(compSec, btn5, 772, 80);
  place(btn5, text("Remove", 14, "Medium", C.rose), 22, 12);

  // Book card component
  place(compSec, text("Book Card", 11, "Medium", C.text3), 32, 156);
  const SAMPLE_BOOKS = [
    { title: "Clean Code",         author: "Robert C. Martin",  price: "SAR 45", listType: "Sale",     cond: "Good",       city: "Riyadh", icon: "📗", accentColor: C.blue },
    { title: "The Pragmatic Prog.", author: "David Thomas",      price: "SAR 35", listType: "Exchange", cond: "New",        city: "Jeddah", icon: "📘", accentColor: C.brand },
    { title: "Design Patterns",    author: "Gang of Four",      price: "SAR 60", listType: "Sale",     cond: "Good",       city: "Riyadh", icon: "📙", accentColor: C.violet },
    { title: "Atomic Habits",      author: "James Clear",       price: "SAR 40", listType: "Both",     cond: "New",        city: "Dammam", icon: "📕", accentColor: C.green },
    { title: "Zero to One",        author: "Peter Thiel",       price: "SAR 30", listType: "Sale",     cond: "Acceptable", city: "Mecca",  icon: "📓", accentColor: C.amber },
    { title: "Deep Learning",      author: "Ian Goodfellow",    price: "SAR 80", listType: "Sale",     cond: "New",        city: "Riyadh", icon: "📒", accentColor: C.teal },
    { title: "Cracking the Coding",author: "Gayle McDowell",    price: "SAR 55", listType: "Both",     cond: "Good",       city: "Jeddah", icon: "📔", accentColor: C.rose },
    { title: "Automate the Boring",author: "Al Sweigart",       price: "SAR 25", listType: "Exchange", cond: "New",        city: "Riyadh", icon: "📃", accentColor: C.brand },
  ];

  mkBookCard(compSec, SAMPLE_BOOKS[0], 32, 176);
  mkBookCard(compSec, SAMPLE_BOOKS[1], 312, 176);

  // Badges
  place(compSec, text("Badges — Condition", 11, "Medium", C.text3), 620, 156);
  mkBadge("New",        C.green,  compSec, 620, 176);
  mkBadge("Good",       C.blue,   compSec, 680, 176);
  mkBadge("Acceptable", C.amber,  compSec, 740, 176);
  mkBadge("Poor",       C.red,    compSec, 840, 176);

  place(compSec, text("Badges — Listing Type", 11, "Medium", C.text3), 620, 216);
  mkBadge("Sale",     C.brand,  compSec, 620, 234);
  mkBadge("Exchange", C.teal,   compSec, 692, 234);
  mkBadge("Both",     C.violet, compSec, 780, 234);
  mkBadge("Sold",     C.text3,  compSec, 842, 234);

  // Input fields
  place(compSec, text("Inputs", 11, "Medium", C.text3), 620, 276);

  const inp1 = frame("Input/Default", 400, 48, C.surfaceEl, 1, 12);
  stroke(inp1, C.border, 0.7);
  place(compSec, inp1, 620, 294);
  place(inp1, text("Search by title, author, or ISBN...", 14, "Regular", C.text3), 16, 14);

  const inp2 = frame("Input/AI", 400, 52, C.surfaceEl, 1, 26);
  stroke(inp2, C.violet, 0.45);
  place(compSec, inp2, 620, 358);
  place(inp2, text("✨ Ask AI: 'Find Python books under SAR 50'", 14, "Regular", C.violet, 0.6), 16, 16);

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 2 — HOME / LANDING
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = HOME_PAGE;
  const W = 1440;

  const homeRoot = frame("Home — Landing", W, 2800, C.bg);
  place(HOME_PAGE, homeRoot, 0, 0);

  // Ambient orbs
  place(homeRoot, ellipse("Orb/Brand",  700, 700, C.brand,  0.06), -80,  80);
  place(homeRoot, ellipse("Orb/Violet", 560, 560, C.violet, 0.05), 1100, 140);
  place(homeRoot, ellipse("Orb/Teal",   440, 440, C.teal,   0.04), 640,  480);

  mkHeader(homeRoot);

  // ── Hero ──
  const hero = frame("Hero", W, 620, null);
  place(homeRoot, hero, 0, 64);

  const heroBadge = frame("Hero Badge", 400, 32, C.brand, 0.08, 999);
  stroke(heroBadge, C.brand, 0.22);
  place(hero, heroBadge, (W - 400) / 2, 52);
  place(heroBadge, text("✨  AI-Powered Book Marketplace  ·  MENA Region", 12, "Medium", C.brand), 16, 8);

  place(hero, text("Trade Books,",   72, "ExtraBold", C.text1, 1, 900), (W - 900) / 2, 108);
  place(hero, text("Powered by AI.", 72, "ExtraBold", C.brand, 1, 900), (W - 900) / 2, 188);
  place(hero, text(
    "Connect with book lovers across Saudi Arabia, UAE, and the MENA region.\nFind, trade, and discover books with intelligent AI assistance.",
    20, "Regular", C.text2, 1, 760
  ), (W - 760) / 2, 294);

  const ctaRow = frame("CTA Row", 620, 52, null);
  place(hero, ctaRow, (W - 620) / 2, 376);

  const ctaBrowse = frame("CTA/Browse", 196, 52, C.brand, 1, 14);
  place(ctaRow, ctaBrowse, 0, 0);
  place(ctaBrowse, text("Browse Books", 16, "SemiBold", C.dark), 32, 14);

  const ctaAI = frame("CTA/AI", 196, 52, C.violet, 0.15, 14);
  stroke(ctaAI, C.violet, 0.4);
  place(ctaRow, ctaAI, 212, 0);
  place(ctaAI, text("✨ Try AI Search", 16, "SemiBold", C.violet), 20, 14);

  const ctaList = frame("CTA/List", 196, 52, null, 1, 14);
  stroke(ctaList, C.border, 0.8);
  place(ctaRow, ctaList, 424, 0);
  place(ctaList, text("List Your Book", 16, "Medium", C.text1), 26, 14);

  // Stats
  const statsData = [
    { val: "2,500+", lbl: "Books Listed" },
    { val: "1,200+", lbl: "Active Traders" },
    { val: "850+",   lbl: "Exchanges Done" },
    { val: "SAR 35", lbl: "Avg. Price" },
  ];
  statsData.forEach((s, i) => {
    const sc = frame(`Stat/${s.lbl}`, 220, 84, C.surface, 1, 12);
    stroke(sc, C.border, 0.4);
    place(hero, sc, (W - 4 * 220 - 3 * 28) / 2 + i * 248, 468);
    place(sc, text(s.val, 28, "Bold", C.brand), 24, 16);
    place(sc, text(s.lbl, 13, "Regular", C.text2), 24, 52);
  });

  // Category pills
  const cats = ["🖥️ Programming", "📐 Engineering", "💼 Business", "🎨 Design", "🔬 Science", "📜 Literature", "🌍 History", "🧘 Self-Help"];
  let catX = 72;
  cats.forEach((c) => {
    const pill = frame(`Cat/${c}`, c.length * 8.5 + 28, 40, C.surface, 1, 999);
    stroke(pill, C.border, 0.5);
    place(homeRoot, pill, catX, 724);
    place(pill, text(c, 13, "Medium", C.text2), 14, 11);
    catX += c.length * 8.5 + 44;
  });

  // ── Trending Books ──
  place(homeRoot, text("Trending Books", 28, "Bold", C.text1), 72, 804);
  place(homeRoot, text("Recently listed books in your region", 15, "Regular", C.text2), 72, 844);

  SAMPLE_BOOKS.forEach((b, i) => {
    const cx = 72  + (i % 4) * 326;
    const cy = 884 + Math.floor(i / 4) * 312;
    mkBookCard(homeRoot, b, cx, cy);
  });

  // ── AI Features ──
  const aiBg = rect("AI Section BG", W, 400, C.surface, 0.5);
  place(homeRoot, aiBg, 0, 1560);

  place(homeRoot, text("Powered by AI", 36, "Bold", C.text1),  72, 1616);
  place(homeRoot, text("Features that make BookFlow unique", 17, "Regular", C.text2), 72, 1664);

  const aiFeatures = [
    { icon: "✨", title: "AI Book Search",    desc: "Natural language queries. Ask 'Python books under SAR 50 in Riyadh' and get instant results.", col: C.violet },
    { icon: "📝", title: "Smart Summaries",  desc: "Claude AI generates summaries and Q&A. Know exactly what you're getting before you buy.", col: [99, 102, 241] },
    { icon: "🎧", title: "Audio Previews",   desc: "TTS-powered audio samples let you hear the writing style before committing to exchange.", col: C.teal },
  ];
  aiFeatures.forEach((af, i) => {
    const afc = frame(`AI Feature ${i + 1}`, 400, 220, af.col, 0.05, 16);
    stroke(afc, af.col, 0.18);
    place(homeRoot, afc, 72 + i * 444, 1710);
    place(afc, text(af.icon, 32, "Regular", af.col), 24, 24);
    place(afc, text(af.title, 20, "SemiBold", C.text1), 24, 76);
    place(afc, text(af.desc, 14, "Regular", C.text2, 1, 352), 24, 110);
  });

  // ── How It Works ──
  place(homeRoot, text("How It Works", 36, "Bold", C.text1), 72, 2008);
  const steps = [
    { n: "1", title: "Browse or List",    desc: "Search thousands of books or list your own in minutes with ISBN autofill." },
    { n: "2", title: "Ask AI",            desc: "Use the AI search agent to find exactly what you want at the right price." },
    { n: "3", title: "Connect & Request", desc: "Send exchange requests or purchase directly from verified sellers." },
    { n: "4", title: "Trade & Review",    desc: "Complete your exchange and build your reputation in the community." },
  ];
  steps.forEach((s, i) => {
    const sc = frame(`Step ${s.n}`, 320, 180, C.surface, 1, 14);
    stroke(sc, C.border, 0.4);
    place(homeRoot, sc, 72 + i * 340, 2068);
    const numBadge = frame("Num", 40, 40, C.brand, 1, 999);
    place(sc, numBadge, 24, 24);
    place(numBadge, text(s.n, 18, "Bold", C.dark), 13, 9);
    place(sc, text(s.title, 16, "SemiBold", C.text1), 24, 78);
    place(sc, text(s.desc, 13, "Regular", C.text2, 1, 272), 24, 104);
  });

  // ── CTA Banner ──
  const ctaBanner = frame("CTA Banner", W, 200, C.brand, 0.08, 0);
  stroke(ctaBanner, C.brand, 0.15);
  place(homeRoot, ctaBanner, 0, 2560);
  place(ctaBanner, ellipse("Orb1", 300, 300, C.brand, 0.07), -60, -80);
  place(ctaBanner, ellipse("Orb2", 200, 200, C.violet, 0.06), 1300, -60);
  place(ctaBanner, text("Start Trading Books Today", 36, "Bold", C.text1, 1, 600), (W - 600) / 2, 48);
  const joinBtn = frame("CTA/Join", 188, 52, C.brand, 1, 14);
  place(ctaBanner, joinBtn, (W - 188) / 2, 112);
  place(joinBtn, text("Join for Free", 16, "SemiBold", C.dark), 32, 14);

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 3 — AI CHAT
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = CHAT_PAGE;

  const chatRoot = frame("AI Chat — Search Agent", W, 900, C.bg);
  place(CHAT_PAGE, chatRoot, 0, 0);
  place(chatRoot, ellipse("Orb/Violet", 700, 700, C.violet, 0.04), 500, 80);
  place(chatRoot, ellipse("Orb/Brand",  400, 400, C.brand,  0.03), -100, 300);

  mkHeader(chatRoot);

  // Left sidebar: chat list
  const chatSidebar = frame("Chat List", 280, 836, C.surface, 1, 0);
  stroke(chatSidebar, C.border, 0.4);
  place(chatRoot, chatSidebar, 0, 64);
  place(chatSidebar, text("Conversations", 14, "SemiBold", C.text2), 24, 20);

  const chatItems = [
    { label: "Python books under SAR 80", active: true },
    { label: "Business books Riyadh",     active: false },
    { label: "Design for exchange",       active: false },
    { label: "Self-help new condition",   active: false },
  ];
  chatItems.forEach((ci, i) => {
    const ci_f = frame(`Chat Item ${i}`, 256, 52, ci.active ? C.brand : null, ci.active ? 0.1 : 0, 10);
    if (ci.active) stroke(ci_f, C.brand, 0.2);
    place(chatSidebar, ci_f, 12, 52 + i * 64);
    place(ci_f, text(ci.label, 13, ci.active ? "SemiBold" : "Regular", ci.active ? C.brand : C.text2, 1, 220), 14, 16);
  });

  // Chat main panel
  const chatMain = frame("Chat Panel", W - 280, 836, null);
  place(chatRoot, chatMain, 280, 64);

  // Chat header bar
  const chatBar = frame("Chat Bar", W - 280, 72, C.surface, 0.8);
  stroke(chatBar, C.border, 0.4);
  place(chatMain, chatBar, 0, 0);

  const aiChip = frame("AI Chip", 160, 36, C.violet, 0.12, 999);
  stroke(aiChip, C.violet, 0.3);
  place(chatBar, aiChip, 28, 18);
  place(aiChip, text("✨ AI Search Agent", 13, "SemiBold", C.violet), 16, 9);
  place(chatBar, text("Powered by Claude claude-sonnet-4-6 · Tool-augmented search", 12, "Regular", C.text3), 204, 24);

  const newChatBtn = frame("New Chat", 124, 36, C.surface, 1, 8);
  stroke(newChatBtn, C.border, 0.6);
  place(chatBar, newChatBtn, W - 280 - 148, 18);
  place(newChatBtn, text("+ New Chat", 13, "Medium", C.text1), 18, 9);

  // Suggestion chips
  const suggestions = [
    "📚 Python books under SAR 50",
    "🔄 Books for exchange in Riyadh",
    "⭐ New condition textbooks",
    "💼 Business books SAR 20–60",
    "🧘 Self-help cheap books",
    "🎓 Engineering books any price",
  ];
  let chipX = 28;
  let chipY = 100;
  suggestions.forEach((s, i) => {
    if (i === 3) { chipX = 28; chipY = 140; }
    const cw = s.length * 8 + 28;
    const chip = frame(`Chip${i}`, cw, 34, C.surfaceEl, 1, 999);
    stroke(chip, C.border, 0.55);
    place(chatMain, chip, chipX, chipY);
    place(chip, text(s, 13, "Medium", C.text2), 14, 8);
    chipX += cw + 12;
  });

  // Conversation
  // User bubble
  const userBubble = frame("Msg/User", 640, 56, C.brand, 0.14, 16);
  stroke(userBubble, C.brand, 0.3);
  place(chatMain, userBubble, W - 280 - 668, 198);
  place(userBubble, text("Find me Python programming books under SAR 80", 14, "Regular", C.text1, 1, 600), 20, 17);

  // AI bubble
  const aiBubble = frame("Msg/AI", 780, 320, C.surfaceEl, 1, 16);
  stroke(aiBubble, C.border, 0.5);
  place(chatMain, aiBubble, 28, 278);

  const sparkle = frame("AI Avatar", 36, 36, C.violet, 0.15, 999);
  stroke(sparkle, C.violet, 0.3);
  place(aiBubble, sparkle, 16, 16);
  place(sparkle, text("✨", 16, "Regular", C.violet), 8, 7);

  place(aiBubble, text("Found 6 Python books under SAR 80. Here are the best matches:", 14, "Regular", C.text1, 1, 700), 64, 22);

  // Mini result cards inside AI bubble
  const miniBooks = [
    { title: "Python Crash Course", author: "Eric Matthes",  price: "SAR 45", cond: "New",  icon: "📗" },
    { title: "Automate the Boring Stuff", author: "Al Sweigart",  price: "SAR 35", cond: "New",  icon: "📘" },
    { title: "Fluent Python",       author: "Luciano Ramalho", price: "SAR 70", cond: "Good", icon: "📙" },
  ];
  miniBooks.forEach((mb, i) => {
    const mc = frame(`Mini/${mb.title}`, 228, 80, C.bg, 0.7, 10);
    stroke(mc, C.border, 0.4);
    place(aiBubble, mc, 16 + i * 248, 68);
    place(mc, text(mb.icon, 28, "Regular", C.brand), 12, 16);
    place(mc, text(mb.title,  13, "SemiBold", C.text1, 1, 172), 52, 12);
    place(mc, text(mb.author, 11, "Regular",  C.text2, 1, 172), 52, 30);
    place(mc, text(mb.price,  16, "Bold",     C.brand),          52, 50);
    const condColor = mb.cond === "New" ? C.green : C.blue;
    mkBadge(mb.cond, condColor, mc, 160, 52);
  });

  place(aiBubble, text("Want me to filter by city, condition, or sort by price?", 13, "Regular", C.text2, 1, 748), 16, 268);

  // Typing indicator
  const typingBubble = frame("Typing Indicator", 80, 44, C.surfaceEl, 1, 22);
  stroke(typingBubble, C.border, 0.4);
  place(chatMain, typingBubble, 28, 624);
  [14, 34, 54].forEach((dx) => {
    const dot = ellipse("Dot", 8, 8, C.text3, 0.7);
    place(typingBubble, dot, dx, 18);
  });

  // Input dock
  const inputDock = frame("Input Dock", W - 280, 88, C.bg, 0.96);
  stroke(inputDock, C.border, 0.3);
  place(chatMain, inputDock, 0, 748);

  const chatInputField = frame("Chat Input Field", W - 280 - 104, 52, C.surfaceEl, 1, 26);
  stroke(chatInputField, C.violet, 0.4);
  place(inputDock, chatInputField, 24, 18);
  place(chatInputField, text("✨ Ask anything about books...", 14, "Regular", C.text3), 20, 15);

  const sendBtn = frame("Send Btn", 52, 52, C.brand, 1, 26);
  place(inputDock, sendBtn, W - 280 - 72, 18);
  place(sendBtn, text("→", 20, "Bold", C.dark), 14, 13);

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 4 — BROWSE
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = BROWSE_PAGE;

  const browseRoot = frame("Browse Books", W, 1100, C.bg);
  place(BROWSE_PAGE, browseRoot, 0, 0);

  mkHeader(browseRoot);

  // Page title + search
  place(browseRoot, text("Browse Books", 32, "Bold", C.text1), 72, 88);
  place(browseRoot, text("2,500+ books available across Saudi Arabia and MENA", 16, "Regular", C.text2), 72, 132);

  const bSearch = frame("Search Bar", 880, 52, C.surfaceEl, 1, 14);
  stroke(bSearch, C.border, 0.6);
  place(browseRoot, bSearch, 72, 172);
  place(bSearch, text("🔍  Search by title, author, or ISBN...", 14, "Regular", C.text3), 20, 16);

  const searchBtn = frame("Search Btn", 100, 52, C.brand, 1, 14);
  place(browseRoot, searchBtn, 960, 172);
  place(searchBtn, text("Search", 14, "SemiBold", C.dark), 20, 16);

  // Sidebar filters
  const sidebar = frame("Filters", 256, 840, C.surface, 1, 14);
  stroke(sidebar, C.border, 0.35);
  place(browseRoot, sidebar, 72, 252);
  place(sidebar, text("Filters", 16, "SemiBold", C.text1), 20, 20);

  const filterData = [
    { title: "Listing Type",  options: [{ l: "All Types", active: true }, { l: "For Sale", active: false }, { l: "For Exchange", active: false }, { l: "Both", active: false }] },
    { title: "Condition",     options: [{ l: "New", active: true }, { l: "Good", active: false }, { l: "Acceptable", active: false }, { l: "Poor", active: false }] },
    { title: "City",          options: [{ l: "All Cities", active: true }, { l: "Riyadh", active: false }, { l: "Jeddah", active: false }, { l: "Dammam", active: false }] },
    { title: "Language",      options: [{ l: "Any", active: true }, { l: "Arabic", active: false }, { l: "English", active: false }] },
  ];

  let filterY = 56;
  filterData.forEach((fd) => {
    place(sidebar, text(fd.title, 11, "SemiBold", C.text3), 20, filterY);
    filterY += 22;
    fd.options.forEach((opt) => {
      const optRow = frame(`Opt/${opt.l}`, 216, 28, null);
      place(sidebar, optRow, 20, filterY);
      const cb = rect("CB", 16, 16, opt.active ? C.brand : null, opt.active ? 1 : 0, 4);
      if (!opt.active) stroke(cb, C.border, 0.7);
      place(optRow, cb, 0, 5);
      if (opt.active) place(optRow, text("✓", 10, "Bold", C.dark), 3, 5);
      place(optRow, text(opt.l, 13, "Regular", opt.active ? C.text1 : C.text2), 26, 5);
      filterY += 30;
    });
    // Price slider area
    filterY += 12;
  });

  // Price slider
  place(sidebar, text("Price Range", 11, "SemiBold", C.text3), 20, filterY);
  filterY += 22;
  const sliderTrack = rect("Track", 216, 4, C.border, 1, 999);
  const sliderFill  = rect("Fill",  140, 4, C.brand,  1, 999);
  place(sidebar, sliderTrack, 20, filterY + 8);
  place(sidebar, sliderFill,  20, filterY + 8);
  place(sidebar, text("SAR 0",   11, "Regular", C.text3), 20,  filterY + 20);
  place(sidebar, text("SAR 200", 11, "Regular", C.text3), 186, filterY + 20);

  // Book grid
  const grid = frame("Book Grid", W - 72 - 256 - 28, 840, null);
  place(browseRoot, grid, 72 + 256 + 28, 252);

  place(grid, text("2,483 results", 14, "Regular", C.text2), 0, 10);

  SAMPLE_BOOKS.forEach((b, i) => {
    const ci = i % 3;
    const ri = Math.floor(i / 3);
    mkBookCard(grid, b, ci * 296, 40 + ri * 312);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 5 — DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = DASH_PAGE;

  const dashRoot = frame("Dashboard", W, 900, C.bg);
  place(DASH_PAGE, dashRoot, 0, 0);

  // Sidebar nav
  const dashNav = frame("Sidebar Nav", 240, 900, C.surface, 1);
  stroke(dashNav, C.border, 0.35);
  place(dashRoot, dashNav, 0, 0);
  place(dashNav, text("📚 BookFlow", 18, "Bold", C.text1), 24, 24);

  const navItems = [
    { icon: "🏠", label: "Overview",    active: true },
    { icon: "📗", label: "My Listings", active: false },
    { icon: "❤️", label: "Wishlist",    active: false },
    { icon: "🤝", label: "Requests",    active: false },
    { icon: "📋", label: "History",     active: false },
    { icon: "👤", label: "Profile",     active: false },
  ];
  navItems.forEach((n, i) => {
    const li = frame(`Nav/${n.label}`, 216, 44, n.active ? C.brand : null, n.active ? 0.1 : 0, 10);
    if (n.active) stroke(li, C.brand, 0.2);
    place(dashNav, li, 12, 76 + i * 54);
    place(li, text(n.icon,  16, "Regular",                 n.active ? C.brand : C.text2), 14, 12);
    place(li, text(n.label, 14, n.active ? "SemiBold" : "Regular", n.active ? C.brand : C.text2), 44, 12);
  });

  // Main content
  const dashMain = frame("Main", W - 240, 900, null);
  place(dashRoot, dashMain, 240, 0);

  const topBar = frame("Top Bar", W - 240, 64, C.bg, 0.95);
  stroke(topBar, C.border, 0.35);
  place(dashMain, topBar, 0, 0);
  place(topBar, text("Good morning, Ahmed 👋", 18, "SemiBold", C.text1), 32, 20);

  const avatarCircle = frame("Avatar", 36, 36, C.brand, 0.2, 999);
  stroke(avatarCircle, C.brand, 0.3);
  place(topBar, avatarCircle, W - 240 - 56, 14);
  place(avatarCircle, text("A", 16, "Bold", C.brand), 11, 7);

  // Stat cards
  const dashStats = [
    { icon: "📗", lbl: "Active Listings",  val: "12",       col: C.brand },
    { icon: "💰", lbl: "Total Earned",     val: "SAR 1,240", col: C.green },
    { icon: "🤝", lbl: "Exchanges Done",   val: "8",        col: C.teal },
    { icon: "❤️", lbl: "Wishlist",         val: "24",       col: C.rose },
  ];
  dashStats.forEach((s, i) => {
    const sc = frame(`Stat/${s.lbl}`, 264, 104, C.surface, 1, 12);
    stroke(sc, C.border, 0.35);
    place(dashMain, sc, 32 + i * 284, 84);
    place(sc, text(s.icon, 28, "Regular", s.col), 20, 14);
    place(sc, text(s.val, 26, "Bold", s.col), 20, 50);
    place(sc, text(s.lbl, 12, "Regular", C.text2), 20, 82);
  });

  // Listings table
  place(dashMain, text("My Listings", 18, "SemiBold", C.text1), 32, 218);

  const tableContainer = frame("Listings Table", W - 240 - 64, 320, C.surface, 1, 12);
  stroke(tableContainer, C.border, 0.35);
  place(dashMain, tableContainer, 32, 256);

  const tableHead = frame("TH", W - 240 - 64, 44, C.surfaceEl, 1);
  place(tableContainer, tableHead, 0, 0);

  const cols = [{ lbl: "Book",       w: 320 }, { lbl: "Price",  w: 100 },
                { lbl: "Condition",  w: 110 }, { lbl: "Type",   w: 110 },
                { lbl: "Status",     w: 110 }, { lbl: "Views",  w: 80  }, { lbl: "", w: 120 }];
  let thX = 0;
  cols.forEach((c) => {
    if (c.lbl) place(tableHead, text(c.lbl, 11, "SemiBold", C.text3), thX + 16, 16);
    thX += c.w;
  });

  const rows = [
    { title: "Clean Code",              price: "SAR 45", cond: "Good",       type: "Sale",     status: "Active",      views: "23" },
    { title: "The Pragmatic Programmer",price: "SAR 35", cond: "New",        type: "Exchange", status: "Active",      views: "17" },
    { title: "Design Patterns",         price: "SAR 60", cond: "Good",       type: "Sale",     status: "Sold",        views: "41" },
    { title: "Atomic Habits",           price: "SAR 40", cond: "New",        type: "Both",     status: "Active",      views: "8"  },
    { title: "Zero to One",             price: "SAR 30", cond: "Acceptable", type: "Sale",     status: "Unavailable", views: "15" },
  ];
  rows.forEach((r, ri) => {
    const rowF = frame(`Row${ri}`, W - 240 - 64, 48, null);
    stroke(rowF, C.border, 0.25);
    place(tableContainer, rowF, 0, 44 + ri * 48);
    place(rowF, text(r.title, 13, "Medium", C.text1, 1, 300), 16, 14);
    place(rowF, text(r.price, 13, "SemiBold", C.brand), 336, 14);
    const cColor = r.cond === "New" ? C.green : r.cond === "Good" ? C.blue : C.amber;
    mkBadge(r.cond, cColor, rowF, 436, 11);
    const tColor = r.type === "Sale" ? C.brand : r.type === "Exchange" ? C.teal : C.violet;
    mkBadge(r.type, tColor, rowF, 546, 11);
    const sColor = r.status === "Active" ? C.green : r.status === "Sold" ? C.text3 : C.amber;
    mkBadge(r.status, sColor, rowF, 656, 11);
    place(rowF, text(r.views + " views", 12, "Regular", C.text2), 766, 16);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 6 — AUTH
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = AUTH_PAGE;

  // Login
  const loginRoot = frame("Login Screen", 600, 720, C.bg);
  place(AUTH_PAGE, loginRoot, 0, 0);
  place(loginRoot, ellipse("Orb", 500, 500, C.brand, 0.05), -100, -50);
  place(loginRoot, text("📚 BookFlow",               24, "Bold",    C.text1), 192, 48);
  place(loginRoot, text("MENA's AI Book Exchange",   13, "Regular", C.text2), 188, 82);

  const lCard = frame("Login Card", 480, 548, C.surface, 1, 16);
  stroke(lCard, C.border, 0.5);
  place(loginRoot, lCard, 60, 124);

  place(lCard, text("Welcome back",      24, "Bold",    C.text1), 32, 32);
  place(lCard, text("Sign in to your account", 14, "Regular", C.text2), 32, 68);

  const lFields = [
    { label: "Email",    ph: "you@example.com", y: 116 },
    { label: "Password", ph: "••••••••••",       y: 200 },
  ];
  lFields.forEach((lf) => {
    place(lCard, text(lf.label, 12, "Medium", C.text2), 32, lf.y);
    const inp = frame(`Input/${lf.label}`, 416, 48, C.surfaceEl, 1, 10);
    stroke(inp, C.border, 0.7);
    place(lCard, inp, 32, lf.y + 18);
    place(inp, text(lf.ph, 14, "Regular", C.text3), 16, 14);
  });

  const lBtn = frame("Login Btn", 416, 52, C.brand, 1, 12);
  place(lCard, lBtn, 32, 276);
  place(lBtn, text("Sign In", 16, "SemiBold", C.dark), 172, 14);

  const lDivider = rect("Divider", 416, 1, C.border, 0.6);
  place(lCard, lDivider, 32, 352);
  place(lCard, text("or continue with", 13, "Regular", C.text3), 168, 362);

  const gBtn = frame("Google Btn", 416, 48, C.surfaceEl, 1, 10);
  stroke(gBtn, C.border, 0.6);
  place(lCard, gBtn, 32, 390);
  place(gBtn, text("🔗  Continue with Google", 14, "Medium", C.text1), 108, 13);

  place(lCard, text("Don't have an account? Sign up →", 13, "Regular", C.brand), 108, 460);

  // Register
  const regRoot = frame("Register Screen", 600, 800, C.bg);
  place(AUTH_PAGE, regRoot, 640, 0);
  place(regRoot, ellipse("Orb", 500, 500, C.teal, 0.04), 200, -100);
  place(regRoot, text("📚 BookFlow", 24, "Bold", C.text1), 192, 32);

  const rCard = frame("Register Card", 480, 720, C.surface, 1, 16);
  stroke(rCard, C.border, 0.5);
  place(regRoot, rCard, 60, 72);

  place(rCard, text("Create account", 24, "Bold", C.text1), 32, 28);
  place(rCard, text("Join the MENA book exchange community", 14, "Regular", C.text2), 32, 62);

  const rFields = [
    { label: "Full Name",        ph: "Ahmad Al-Nashat",    y: 108 },
    { label: "Email",            ph: "you@example.com",   y: 192 },
    { label: "Password",         ph: "Create password",   y: 276 },
    { label: "City",             ph: "Riyadh ▾",          y: 360 },
  ];
  rFields.forEach((rf) => {
    place(rCard, text(rf.label, 12, "Medium", C.text2), 32, rf.y);
    const inp = frame(`Input/${rf.label}`, 416, 48, C.surfaceEl, 1, 10);
    stroke(inp, C.border, 0.7);
    place(rCard, inp, 32, rf.y + 18);
    place(inp, text(rf.ph, 14, "Regular", C.text3), 16, 14);
  });

  const rBtn = frame("Register Btn", 416, 52, C.brand, 1, 12);
  place(rCard, rBtn, 32, 444);
  place(rBtn, text("Create Account", 16, "SemiBold", C.dark), 148, 14);

  place(rCard, text("Already have an account? Sign in →", 13, "Regular", C.brand), 100, 516);

  const termsText = text("By registering you agree to our Terms & Privacy Policy", 11, "Regular", C.text3, 1, 416);
  place(rCard, termsText, 32, 556);

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 7 — BOOK DETAIL  (skeleton)
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = DETAIL_PAGE;

  const detailRoot = frame("Book Detail", W, 1100, C.bg);
  place(DETAIL_PAGE, detailRoot, 0, 0);
  mkHeader(detailRoot);
  place(detailRoot, ellipse("Orb", 600, 600, C.brand, 0.05), -100, 100);

  // Book info left
  const detailLeft = frame("Book Info", 480, 560, C.surface, 1, 16);
  stroke(detailLeft, C.border, 0.4);
  place(detailRoot, detailLeft, 72, 100);

  const detailCover = rect("Cover", 480, 260, C.brand, 0.1);
  place(detailLeft, detailCover, 0, 0);
  place(detailLeft, text("📗", 80, "Regular", C.brand), 196, 88);

  place(detailLeft, text("Clean Code", 28, "Bold", C.text1), 24, 280);
  place(detailLeft, text("Robert C. Martin", 16, "Regular", C.text2), 24, 318);
  place(detailLeft, text("SAR 45", 32, "ExtraBold", C.brand), 24, 360);
  mkBadge("For Sale",  C.brand,  detailLeft, 24,  406);
  mkBadge("Good Cond", C.blue,   detailLeft, 108, 406);
  mkBadge("Riyadh",    C.text3,  detailLeft, 208, 406);
  place(detailLeft, text("👁 23 views  ·  🤍 12 saves  ·  📅 3 days ago", 12, "Regular", C.text3), 24, 444);

  const buyBtn = frame("Buy Btn", 220, 52, C.brand, 1, 14);
  place(detailLeft, buyBtn, 24, 484);
  place(buyBtn, text("Buy Now — SAR 45", 15, "SemiBold", C.dark), 24, 15);

  const exBtn = frame("Exchange Btn", 196, 52, C.teal, 0.12, 14);
  stroke(exBtn, C.teal, 0.35);
  place(detailLeft, exBtn, 256, 484);
  place(exBtn, text("Request Exchange", 14, "SemiBold", C.teal), 16, 15);

  // AI features right panel
  const detailRight = frame("AI Panel", W - 480 - 72 - 28 - 72, 820, null);
  place(detailRoot, detailRight, 72 + 480 + 28, 100);

  // Description
  const descCard = frame("Description", W - 480 - 72 - 28 - 72, 160, C.surface, 1, 12);
  stroke(descCard, C.border, 0.4);
  place(detailRight, descCard, 0, 0);
  place(descCard, text("Description", 16, "SemiBold", C.text1), 20, 20);
  place(descCard, text("A handbook of agile software craftsmanship. Teaches how to write clean, readable, maintainable code through practical examples and case studies.", 14, "Regular", C.text2, 1, descCard.width - 40), 20, 52);

  // AI Summary card
  const aiSummCard = frame("AI Summary", W - 480 - 72 - 28 - 72, 220, C.violet, 0.05, 12);
  stroke(aiSummCard, C.violet, 0.2);
  place(detailRight, aiSummCard, 0, 176);
  const aiSummHead = frame("AI Header", 160, 32, C.violet, 0.12, 999);
  stroke(aiSummHead, C.violet, 0.3);
  place(aiSummCard, aiSummHead, 20, 20);
  place(aiSummHead, text("✨ AI Summary", 12, "SemiBold", C.violet), 16, 8);
  place(aiSummCard, text("Clean Code focuses on the art of writing software that is easy to read, modify, and maintain. Martin presents naming conventions, function design, comment strategies, and error handling. Key insight: code is read far more often than written, so clarity is paramount.", 13, "Regular", C.text2, 1, aiSummCard.width - 40), 20, 68);

  // Audio player
  const audioCard = frame("Audio Preview", W - 480 - 72 - 28 - 72, 80, C.teal, 0.05, 12);
  stroke(audioCard, C.teal, 0.2);
  place(detailRight, audioCard, 0, 412);
  const playBtn = frame("Play", 36, 36, C.teal, 0.2, 999);
  stroke(playBtn, C.teal, 0.3);
  place(audioCard, playBtn, 20, 22);
  place(playBtn, text("▶", 14, "Bold", C.teal), 10, 8);
  place(audioCard, text("🎧 Audio Preview", 14, "SemiBold", C.teal), 68, 14);
  place(audioCard, text("Listen to a 60-second narration of the introduction", 12, "Regular", C.text2), 68, 36);

  // Recommendations
  const recoTitle = text("Similar Books", 18, "SemiBold", C.text1);
  place(detailRight, recoTitle, 0, 512);
  SAMPLE_BOOKS.slice(0, 3).forEach((b, i) => {
    mkBookCard(detailRight, b, i * 284, 552);
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PAGE 8 — ADMIN (skeleton)
  // ══════════════════════════════════════════════════════════════════════════
  figma.currentPage = ADMIN_PAGE;

  const adminRoot = frame("Admin Dashboard", W, 900, C.bg);
  place(ADMIN_PAGE, adminRoot, 0, 0);
  mkHeader(adminRoot);

  // Admin sidebar
  const adminNav = frame("Admin Nav", 240, 836, C.surface, 1);
  stroke(adminNav, C.border, 0.35);
  place(adminRoot, adminNav, 0, 64);
  place(adminNav, text("⚙️ Admin", 16, "Bold", C.text1), 24, 24);

  const adminLinks = [
    { icon: "📊", label: "Overview",   active: true },
    { icon: "👤", label: "Users",      active: false },
    { icon: "📚", label: "Listings",   active: false },
    { icon: "🗂️", label: "Categories", active: false },
    { icon: "⚠️", label: "Reports",    active: false },
  ];
  adminLinks.forEach((l, i) => {
    const li = frame(`AdminNav/${l.label}`, 216, 44, l.active ? C.brand : null, l.active ? 0.1 : 0, 10);
    if (l.active) stroke(li, C.brand, 0.2);
    place(adminNav, li, 12, 60 + i * 54);
    place(li, text(l.icon, 16, "Regular", l.active ? C.brand : C.text2), 14, 12);
    place(li, text(l.label, 14, l.active ? "SemiBold" : "Regular", l.active ? C.brand : C.text2), 44, 12);
  });

  // Admin main
  const adminMain = frame("Admin Main", W - 240, 836, null);
  place(adminRoot, adminMain, 240, 64);

  // Admin stats
  const adminStats = [
    { icon: "👥", lbl: "Total Users",    val: "1,247", col: C.brand },
    { icon: "📗", lbl: "Total Listings", val: "2,483", col: C.teal },
    { icon: "🤝", lbl: "Exchanges",      val: "856",   col: C.green },
    { icon: "⚠️", lbl: "Open Reports",   val: "12",    col: C.rose },
  ];
  place(adminMain, text("Platform Overview", 20, "Bold", C.text1), 32, 24);
  adminStats.forEach((s, i) => {
    const sc = frame(`Stat/${s.lbl}`, 264, 100, C.surface, 1, 12);
    stroke(sc, C.border, 0.35);
    place(adminMain, sc, 32 + i * 284, 64);
    place(sc, text(s.icon, 28, "Regular", s.col), 20, 12);
    place(sc, text(s.val,  26, "Bold",    s.col), 20, 48);
    place(sc, text(s.lbl,  12, "Regular", C.text2), 20, 80);
  });

  // Users table
  place(adminMain, text("Recent Users", 18, "SemiBold", C.text1), 32, 198);
  const uTable = frame("Users Table", W - 240 - 64, 340, C.surface, 1, 12);
  stroke(uTable, C.border, 0.35);
  place(adminMain, uTable, 32, 236);

  const uHead = frame("UH", W - 240 - 64, 44, C.surfaceEl, 1);
  place(uTable, uHead, 0, 0);
  [{ l: "User", x: 16 }, { l: "City", x: 340 }, { l: "Role", x: 460 }, { l: "Listings", x: 560 }, { l: "Joined", x: 660 }].forEach((c) => {
    place(uHead, text(c.l, 11, "SemiBold", C.text3), c.x, 16);
  });

  const users = [
    { name: "Ahmad Al-Nashat", email: "ahmad@ex.com", city: "Riyadh",  role: "user",  listings: "12", joined: "Jan 2024" },
    { name: "Sara Al-Ghamdi",  email: "sara@ex.com",  city: "Jeddah",  role: "user",  listings: "7",  joined: "Feb 2024" },
    { name: "Omar bin Faris",  email: "omar@ex.com",  city: "Dammam",  role: "admin", listings: "0",  joined: "Dec 2023" },
    { name: "Lena Khalil",     email: "lena@ex.com",  city: "Dubai",   role: "user",  listings: "23", joined: "Mar 2024" },
    { name: "Reem Al-Mutairi", email: "reem@ex.com",  city: "Riyadh",  role: "user",  listings: "5",  joined: "Mar 2024" },
  ];
  users.forEach((u, ui) => {
    const uRow = frame(`URow${ui}`, W - 240 - 64, 48, null);
    stroke(uRow, C.border, 0.2);
    place(uTable, uRow, 0, 44 + ui * 48);
    const av = frame("Av", 28, 28, C.brand, 0.2, 999);
    place(uRow, av, 16, 10);
    place(av, text(u.name[0], 13, "Bold", C.brand), 8, 5);
    place(uRow, text(u.name,  13, "Medium",  C.text1), 56, 8);
    place(uRow, text(u.email, 11, "Regular", C.text3), 56, 26);
    place(uRow, text(u.city, 13, "Regular", C.text2), 340, 16);
    const roleColor = u.role === "admin" ? C.amber : C.text3;
    mkBadge(u.role, roleColor, uRow, 460, 11);
    place(uRow, text(u.listings, 13, "Regular", C.text2), 560, 16);
    place(uRow, text(u.joined,   12, "Regular", C.text3), 660, 16);
  });

  // ── Done ──────────────────────────────────────────────────────────────────
  figma.currentPage = DS_PAGE;
  figma.closePlugin("✅ BookFlow design generated! 8 pages: Design System · Home · Browse · AI Chat · Dashboard · Auth · Book Detail · Admin");
})();

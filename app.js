/* ---------------------------------------------
   栖页 · app logic
   No frameworks, no network requests except
   the sites and favicons you choose to use.
   --------------------------------------------- */

(() => {
  "use strict";

  const STORAGE_KEY = "qiyue-start-state-v1";
  const WALLPAPER_FALLBACK_KEY = "qiyue-start-wallpaper-v1";
  const WALLPAPER_TOMBSTONE_KEY = "qiyue-start-wallpaper-cleared-v1";
  const DB_NAME = "qiyue-start";
  const DB_VERSION = 1;
  const STORE_NAME = "wallpapers";
  const WALLPAPER_KEY = "custom";
  const MAX_BOOKMARKS = 40;
  const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
  const MAX_WALLPAPER_SIDE = 2560;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const SEARCH_ENGINES = {
    bing: {
      name: "必应",
      short: "B",
      color: "#78c8ea",
      searchUrl: "https://www.bing.com/search?q="
    },
    google: {
      name: "Google",
      short: "G",
      color: "#8fa9ff",
      searchUrl: "https://www.google.com/search?q="
    },
    baidu: {
      name: "百度",
      short: "百",
      color: "#8ea6ff",
      searchUrl: "https://www.baidu.com/s?wd="
    },
    duckduckgo: {
      name: "DuckDuckGo",
      short: "D",
      color: "#f09876",
      searchUrl: "https://duckduckgo.com/?q="
    }
  };

  const PRESETS = {
    aurora: {
      name: "极光",
      background:
        "radial-gradient(120% 90% at 12% 5%, rgba(48, 129, 116, 0.58), transparent 56%), " +
        "radial-gradient(100% 85% at 88% 16%, rgba(112, 88, 171, 0.46), transparent 58%), " +
        "radial-gradient(90% 70% at 48% 112%, rgba(176, 115, 79, 0.24), transparent 62%), " +
        "linear-gradient(142deg, #061411 0%, #0a1b20 50%, #121524 100%)"
    },
    dusk: {
      name: "暮色",
      background:
        "radial-gradient(115% 90% at 16% 0%, rgba(196, 105, 83, 0.5), transparent 55%), " +
        "radial-gradient(90% 80% at 86% 16%, rgba(137, 82, 132, 0.38), transparent 56%), " +
        "radial-gradient(85% 70% at 52% 112%, rgba(220, 160, 101, 0.3), transparent 62%), " +
        "linear-gradient(145deg, #180f18 0%, #24151d 48%, #111522 100%)"
    },
    tide: {
      name: "潮汐",
      background:
        "radial-gradient(115% 90% at 18% 8%, rgba(29, 107, 140, 0.54), transparent 55%), " +
        "radial-gradient(90% 80% at 86% 18%, rgba(34, 139, 130, 0.3), transparent 58%), " +
        "radial-gradient(95% 80% at 50% 112%, rgba(42, 82, 133, 0.46), transparent 62%), " +
        "linear-gradient(150deg, #04131b 0%, #061a23 50%, #08131f 100%)"
    },
    ink: {
      name: "墨夜",
      background:
        "radial-gradient(110% 85% at 25% 0%, rgba(154, 142, 122, 0.24), transparent 56%), " +
        "radial-gradient(90% 80% at 90% 20%, rgba(75, 88, 102, 0.28), transparent 58%), " +
        "radial-gradient(85% 75% at 52% 112%, rgba(150, 104, 76, 0.2), transparent 62%), " +
        "linear-gradient(145deg, #0b0c0e 0%, #141517 55%, #090b0e 100%)"
    }
  };

  // Curated from the local Chrome bookmark/history profile:
  // video, development, AI, and Minecraft are the strongest recurring themes.
  // Private/intranet bookmarks are deliberately excluded.
  const DEFAULT_BOOKMARKS = [
    { name: "哔哩哔哩", url: "https://www.bilibili.com/" },
    { name: "GitHub", url: "https://github.com/" },
    { name: "CSDN", url: "https://www.csdn.net/" },
    { name: "DeepSeek", url: "https://chat.deepseek.com/" },
    { name: "豆包", url: "https://www.doubao.com/chat/" },
    { name: "MC Wiki", url: "https://zh.minecraft.wiki/" },
    { name: "Modrinth", url: "https://modrinth.com/" }
  ];

  // Previous built-in set, used only to migrate an untouched first-run state.
  // Customized bookmark sets are never replaced.
  const LEGACY_DEFAULT_BOOKMARKS = [
    { name: "哔哩哔哩", url: "https://www.bilibili.com/" },
    { name: "知乎", url: "https://www.zhihu.com/" },
    { name: "微博", url: "https://weibo.com/" },
    { name: "GitHub", url: "https://github.com/" },
    { name: "小红书", url: "https://www.xiaohongshu.com/" },
    { name: "豆瓣", url: "https://www.douban.com/" },
    { name: "YouTube", url: "https://www.youtube.com/" }
  ];

  const SITE_NAMES = {
    "bilibili.com": "哔哩哔哩",
    "github.com": "GitHub",
    "csdn.net": "CSDN",
    "deepseek.com": "DeepSeek",
    "doubao.com": "豆包",
    "minecraft.wiki": "MC Wiki",
    "modrinth.com": "Modrinth",
    "zhihu.com": "知乎",
    "weibo.com": "微博",
    "xiaohongshu.com": "小红书",
    "douban.com": "豆瓣",
    "youtube.com": "YouTube",
    "google.com": "Google",
    "bing.com": "Bing",
    "baidu.com": "百度",
    "gmail.com": "Gmail",
    "chatgpt.com": "ChatGPT",
    "qwen.ai": "Qwen",
    "chatglm.cn": "智谱清言",
    "miyoushe.com": "米游社",
    "kurobbs.com": "库街区",
    "mcmod.cn": "MC 百科",
    "juejin.cn": "掘金",
    "runoob.com": "菜鸟教程",
    "djangoproject.com": "Django",
    "spring.io": "Spring",
    "unity.cn": "Unity",
    "qt.io": "Qt",
    "hf-mirror.com": "HF-Mirror",
    "ollama.com": "Ollama",
    "npmjs.com": "npm",
    "developer.mozilla.org": "MDN",
    "stackoverflow.com": "Stack Overflow",
    "wikipedia.org": "Wikipedia",
    "outlook.com": "Outlook",
    "office.com": "Microsoft 365",
    "feishu.cn": "飞书",
    "notion.so": "Notion",
    "vercel.app": "Vercel",
    "v0.app": "v0"
  };

  const SITE_NAME_ENTRIES = Object.entries(SITE_NAMES)
    .sort(([a], [b]) => b.length - a.length);

  const MULTI_LABEL_SUFFIXES = new Set([
    "com.cn", "net.cn", "org.cn", "gov.cn", "edu.cn",
    "co.uk", "com.au", "co.jp", "com.hk", "com.tw",
    "co.kr", "com.sg", "com.br"
  ]);

  const TLD_SET = new Set([
    "com", "cn", "net", "org", "io", "dev", "app", "ai", "co", "me", "tv", "cc",
    "xyz", "info", "edu", "gov", "top", "site", "online", "store", "art", "tech",
    "cloud", "live", "fun", "vip", "pro", "biz", "us", "uk", "jp", "hk", "tw",
    "de", "fr", "au", "ca", "sg", "ru", "in", "br", "nl", "se", "no", "es",
    "it", "ch", "at", "be", "dk", "fi", "pl", "pt", "ie", "nz", "za", "kr",
    "mx", "ar", "id", "my", "th", "vn", "ph", "tr", "il", "ae", "sa", "eu",
    "world", "design", "space", "website", "blog", "wiki", "ink", "run", "sh",
    "moe", "lol", "games", "news", "email", "page", "link", "work", "studio"
  ]);

  const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const icon = (name, className = "icon") => {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#${name}`);
    svg.append(use);
    return svg;
  };

  const pad = (value) => String(value).padStart(2, "0");

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const uid = () => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `bm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const cleanText = (value, maxLength) => String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);

  const firstGlyph = (value) => {
    const chars = Array.from(String(value || "").trim());
    return (chars[0] || "·").toUpperCase();
  };

  const hashHue = (value) => {
    let hash = 0;
    for (const char of String(value)) {
      hash = (hash * 31 + char.codePointAt(0)) % 360;
    }
    return hash;
  };

  const hostLabel = (url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "");
      if (isIpHost(host) || host === "localhost") return host;
      const label = host.split(".")[0] || host;
      return label.charAt(0).toUpperCase() + label.slice(1);
    } catch {
      return "新书签";
    }
  };

  const stripProtocol = (value) => String(value || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  const normalizeUrl = (input) => {
    let raw = String(input || "").trim();
    if (!raw) return null;
    if (/^\/\//.test(raw)) {
      raw = `https:${raw}`;
    } else if (!/^https?:\/\//i.test(raw)) {
      if (/^https?:/i.test(raw)) return null;
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return null;
      if (/^(?:mailto|tel|javascript|data|file|ftp|ftps|blob|about):/i.test(raw)) return null;
      raw = `https://${raw}`;
    }

    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      if (!url.hostname) return null;
      return url.href;
    } catch {
      return null;
    }
  };

  const isIpHost = (value) => /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(value);

  const isLikelyHost = (raw) => {
    const candidate = raw.split(/[/?#]/)[0].toLowerCase();
    if (candidate === "localhost" || /^localhost:\d+$/.test(candidate)) return true;
    if (isIpHost(candidate)) return true;
    const withoutPort = candidate.replace(/:\d+$/, "");
    const parts = withoutPort.split(".");
    if (parts.length < 2 || parts.some((part) => !part)) return false;
    const tld = parts[parts.length - 1];
    return TLD_SET.has(tld) || /^xn--/i.test(tld);
  };

  const getDirectUrl = (raw) => {
    const value = raw.trim();
    if (!value || /\s/.test(value)) return null;
    if (/^https?:\/\//i.test(value)) return normalizeUrl(value);
    if (!isLikelyHost(value)) return null;
    return normalizeUrl(value);
  };

  const externalUrlFromText = (text) => {
    const raw = String(text || "").trim();
    if (!raw || raw.length > 4096) return null;
    const lines = raw.split(/\r?\n/)
      .map((line) => line.trim().replace(/^[<"']+|[>"']+$/g, ""))
      .filter((line) => line && !line.startsWith("#"));
    for (const line of lines) {
      const url = getDirectUrl(line);
      if (url) return url;
    }
    return null;
  };

  const canonicalBookmarkUrl = (value) => {
    const normalized = normalizeUrl(value);
    if (!normalized) return "";
    try {
      const url = new URL(normalized);
      url.hash = "";
      return url.href.replace(/\/+$/, "");
    } catch {
      return normalized;
    }
  };

  const siteNameForHost = (hostname) => {
    const host = String(hostname || "").replace(/^www\./i, "").toLowerCase();
    for (const [domain, name] of SITE_NAME_ENTRIES) {
      if (host === domain || host.endsWith(`.${domain}`)) return name;
    }
    return "";
  };

  const prettyHostLabel = (hostname) => {
    const host = String(hostname || "").replace(/^www\./i, "");
    if (!host) return "新书签";
    if (isIpHost(host) || host === "localhost") return host;
    const parts = host.split(".");
    const lastTwo = parts.slice(-2).join(".");
    let index = parts.length - 2;
    if (MULTI_LABEL_SUFFIXES.has(lastTwo)) index = parts.length - 3;
    const label = (parts[Math.max(0, index)] || host).replace(/[-_]+/g, " ").trim();
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : host;
  };

  const bookmarkNameForUrl = (value) => {
    const normalized = normalizeUrl(value);
    if (!normalized) return "新书签";
    try {
      const host = new URL(normalized).hostname.replace(/^www\./i, "").toLowerCase();
      const sameHost = state.bookmarks.find((bookmark) => {
        try {
          return new URL(bookmark.url).hostname.replace(/^www\./i, "").toLowerCase() === host;
        } catch {
          return false;
        }
      });
      if (sameHost) return sameHost.name;
      return siteNameForHost(host) || prettyHostLabel(host);
    } catch {
      return "新书签";
    }
  };

  const findExistingBookmark = (url) => {
    const target = canonicalBookmarkUrl(url);
    if (!target) return null;
    return state.bookmarks.find((bookmark) => canonicalBookmarkUrl(bookmark.url) === target) || null;
  };

  const cssUrl = (value) => `url("${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]/g, "")}")`;

  const makePresetBookmarks = () => DEFAULT_BOOKMARKS.map((bookmark) => ({
    id: uid(),
    name: bookmark.name,
    url: bookmark.url,
    icon: ""
  }));

  const makeDefaultState = () => ({
    version: 1,
    name: "",
    bookmarks: makePresetBookmarks(),
    wallpaper: {
      type: "preset",
      preset: "aurora",
      url: "",
      blur: 0,
      dim: 26
    },
    preferences: {
      seconds: true,
      hour24: true,
      searchNewTab: false,
      engine: "bing"
    }
  });

  const sanitizeState = (raw) => {
    const defaults = makeDefaultState();
    if (!raw || typeof raw !== "object") return defaults;

    const sourceBookmarks = Array.isArray(raw.bookmarks) ? raw.bookmarks : defaults.bookmarks;
    const seenIds = new Set();
    const bookmarks = [];

    for (const item of sourceBookmarks) {
      if (!item || typeof item !== "object" || bookmarks.length >= MAX_BOOKMARKS) continue;
      const url = normalizeUrl(item.url);
      if (!url) continue;
      let id = typeof item.id === "string" && /^[a-zA-Z0-9_-]{1,90}$/.test(item.id) ? item.id : uid();
      if (seenIds.has(id)) id = uid();
      seenIds.add(id);
      const name = cleanText(item.name, 40) || hostLabel(url);
      const iconUrl = item.icon ? normalizeUrl(item.icon) : "";
      bookmarks.push({
        id,
        name,
        url,
        icon: iconUrl || ""
      });
    }

    const wallpaperSource = raw.wallpaper && typeof raw.wallpaper === "object" ? raw.wallpaper : {};
    const preset = Object.prototype.hasOwnProperty.call(PRESETS, wallpaperSource.preset)
      ? wallpaperSource.preset
      : "aurora";
    let type = ["preset", "upload", "url"].includes(wallpaperSource.type)
      ? wallpaperSource.type
      : "preset";
    const wallpaperUrl = normalizeUrl(wallpaperSource.url);
    if (type === "url" && !wallpaperUrl) type = "preset";
    const blur = Number.isFinite(Number(wallpaperSource.blur))
      ? clamp(Math.round(Number(wallpaperSource.blur)), 0, 30)
      : 0;
    const dim = Number.isFinite(Number(wallpaperSource.dim))
      ? clamp(Math.round(Number(wallpaperSource.dim)), 0, 70)
      : 26;

    const prefSource = raw.preferences && typeof raw.preferences === "object" ? raw.preferences : {};
    const engine = Object.prototype.hasOwnProperty.call(SEARCH_ENGINES, prefSource.engine)
      ? prefSource.engine
      : "bing";

    return {
      version: 1,
      name: cleanText(raw.name, 16),
      bookmarks,
      wallpaper: {
        type,
        preset,
        url: type === "url" ? wallpaperUrl : "",
        blur,
        dim
      },
      preferences: {
        seconds: typeof prefSource.seconds === "boolean" ? prefSource.seconds : true,
        hour24: typeof prefSource.hour24 === "boolean" ? prefSource.hour24 : true,
        searchNewTab: typeof prefSource.searchNewTab === "boolean" ? prefSource.searchNewTab : false,
        engine
      }
    };
  };

  let storageWritable = true;
  try {
    const testKey = "__qiyue_storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
  } catch {
    storageWritable = false;
  }

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return makeDefaultState();
      return sanitizeState(JSON.parse(raw));
    } catch {
      return makeDefaultState();
    }
  };

  let state = loadState();
  let storageWarningShown = false;

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showToast("浏览器存储空间不足，部分改动可能无法保存");
      }
    }
  };

  const migrateLegacyPresetBookmarks = () => {
    if (state.bookmarks.length !== LEGACY_DEFAULT_BOOKMARKS.length) return false;
    const untouched = state.bookmarks.every((bookmark, index) => {
      const legacy = LEGACY_DEFAULT_BOOKMARKS[index];
      return bookmark.name === legacy.name
        && bookmark.url === legacy.url
        && !bookmark.icon;
    });
    if (!untouched) return false;

    state.bookmarks = makePresetBookmarks();
    saveState();
    return true;
  };

  /* ---------------------------------------------
     IndexedDB wallpaper storage
     --------------------------------------------- */

  let dbPromise = null;

  const openDatabase = () => {
    if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB unavailable"));
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB error"));
      request.onblocked = () => reject(new Error("IndexedDB blocked"));
    });

    return dbPromise;
  };

  const idbRequest = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });

  const idbGetWallpaper = async () => {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    return idbRequest(transaction.objectStore(STORE_NAME).get(WALLPAPER_KEY));
  };

  const idbPutWallpaper = async (blob) => {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    await idbRequest(transaction.objectStore(STORE_NAME).put(blob, WALLPAPER_KEY));
  };

  const idbDeleteWallpaper = async () => {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    await idbRequest(transaction.objectStore(STORE_NAME).delete(WALLPAPER_KEY));
  };

  /* ---------------------------------------------
     DOM
     --------------------------------------------- */

  const dom = {
    backdrop: $("#backdrop"),
    wallpaperArt: $("#wallpaperArt"),
    wallpaperPhoto: $("#wallpaperPhoto"),
    dateText: $("#dateText"),
    clock: $("#clock"),
    clockMain: $("#clockMain"),
    clockSeconds: $("#clockSeconds"),
    clockPeriod: $("#clockPeriod"),
    greeting: $("#greeting"),
    searchForm: $("#searchForm"),
    engineButton: $("#engineButton"),
    engineLogo: $("#engineLogo"),
    engineChevron: $(".engine-chevron"),
    engineMenu: $("#engineMenu"),
    searchInput: $("#searchInput"),
    searchKbd: $("#searchKbd"),
    searchSubmit: $(".search-submit"),
    bookmarks: $("#bookmarks"),
    manageBookmarks: $("#manageBookmarks"),
    clipboardBookmark: $("#clipboardBookmark"),
    customizeDialog: $("#customizeDialog"),
    closeSheet: $("#closeSheet"),
    tabs: $$(".tab"),
    tabList: $(".tabs"),
    sheetScroll: $("#sheetScroll"),
    presetGrid: $("#presetGrid"),
    wallpaperStatus: $("#wallpaperStatus"),
    uploadButton: $("#uploadButton"),
    wallpaperFile: $("#wallpaperFile"),
    wallpaperUrl: $("#wallpaperUrl"),
    applyWallpaperUrl: $("#applyWallpaperUrl"),
    blurRange: $("#blurRange"),
    blurValue: $("#blurValue"),
    dimRange: $("#dimRange"),
    dimValue: $("#dimValue"),
    resetWallpaper: $("#resetWallpaper"),
    panelAddBookmark: $("#panelAddBookmark"),
    bookmarkList: $("#bookmarkList"),
    inlineUndo: $("#inlineUndo"),
    inlineUndoText: $("#inlineUndoText"),
    inlineUndoAction: $("#inlineUndoAction"),
    toggleSeconds: $("#toggleSeconds"),
    toggle24h: $("#toggle24h"),
    toggleNewTab: $("#toggleNewTab"),
    displayName: $("#displayName"),
    exportButton: $("#exportButton"),
    importButton: $("#importButton"),
    importFile: $("#importFile"),
    resetAll: $("#resetAll"),
    bookmarkDialog: $("#bookmarkDialog"),
    bookmarkDialogTitle: $("#bookmarkDialogTitle"),
    closeBookmarkDialog: $("#closeBookmarkDialog"),
    bookmarkForm: $("#bookmarkForm"),
    bookmarkName: $("#bookmarkName"),
    bookmarkUrl: $("#bookmarkUrl"),
    bookmarkIcon: $("#bookmarkIcon"),
    bookmarkError: $("#bookmarkError"),
    cancelBookmark: $("#cancelBookmark"),
    previewIcon: $("#previewIcon"),
    previewFallback: $("#previewFallback"),
    previewImage: $("#previewImage"),
    previewName: $("#previewName"),
    previewUrl: $("#previewUrl"),
    confirmDialog: $("#confirmDialog"),
    confirmTitle: $("#confirmTitle"),
    confirmText: $("#confirmText"),
    confirmCancel: $("#confirmCancel"),
    confirmOk: $("#confirmOk"),
    toast: $("#toast"),
    toastText: $("#toastText"),
    toastAction: $("#toastAction"),
    dropOverlay: $("#dropOverlay"),
    dropIcon: $("#dropIcon"),
    dropTitle: $("#dropTitle"),
    dropHint: $("#dropHint")
  };

  let activeTab = "wallpaper";
  let editingBookmarkId = null;
  let customWallpaperUrl = null;
  let customWallpaperIsObjectUrl = false;
  let customWallpaperRevision = 0;
  let lastToastAction = null;
  let lastToastShortcut = null;
  let toastTimer = 0;
  let inlineUndoAction = null;
  let inlineUndoTimer = 0;
  let confirmResolver = null;
  let previewToken = 0;
  let bookmarksRendered = false;
  let clipboardReadInFlight = false;
  let clipboardPermissionGranted = false;
  let clipboardPromptedUrl = "";

  /* ---------------------------------------------
     Toast
     --------------------------------------------- */

  const supportsPopover = dom.toast && typeof dom.toast.showPopover === "function";

  const moveToastIntoOpenDialog = () => {
    const dialogs = $$("dialog[open]");
    const target = dialogs[dialogs.length - 1] || document.body;
    if (dom.toast.parentElement !== target) target.append(dom.toast);
  };

  const ensureToastContainer = () => {
    moveToastIntoOpenDialog();
  };

  const hideToast = () => {
    window.clearTimeout(toastTimer);
    lastToastAction = null;
    lastToastShortcut = null;
    dom.toast.classList.remove("is-visible");
    if (supportsPopover) {
      try {
        if (dom.toast.matches(":popover-open")) dom.toast.hidePopover();
      } catch {
        /* noop */
      }
    }
  };

  function showToast(message, options = {}) {
    const { actionLabel = "", onAction = null, duration = 3600, keyAction = false } = options;
    ensureToastContainer();
    window.clearTimeout(toastTimer);
    dom.toastText.textContent = message;

    if (actionLabel && typeof onAction === "function") {
      dom.toastAction.hidden = false;
      dom.toastAction.textContent = actionLabel;
      lastToastAction = onAction;
      lastToastShortcut = keyAction ? onAction : null;
    } else {
      dom.toastAction.hidden = true;
      lastToastAction = null;
      lastToastShortcut = null;
    }

    dom.toast.classList.add("is-visible");
    if (supportsPopover) {
      try {
        if (!dom.toast.matches(":popover-open")) dom.toast.showPopover();
      } catch {
        moveToastIntoOpenDialog();
      }
    }

    toastTimer = window.setTimeout(hideToast, duration);
  }

  dom.toastAction.addEventListener("click", () => {
    const action = lastToastAction;
    hideToast();
    if (action) action();
  });

  const hideInlineUndo = () => {
    window.clearTimeout(inlineUndoTimer);
    inlineUndoAction = null;
    dom.inlineUndo.hidden = true;
    dom.sheetScroll.classList.remove("has-undo");
  };

  const showInlineUndo = (message, action) => {
    window.clearTimeout(inlineUndoTimer);
    dom.inlineUndoText.textContent = message;
    inlineUndoAction = action;
    dom.inlineUndo.hidden = false;
    dom.sheetScroll.classList.add("has-undo");
    inlineUndoTimer = window.setTimeout(hideInlineUndo, 6500);
  };

  dom.inlineUndoAction.addEventListener("click", () => {
    const action = inlineUndoAction;
    hideInlineUndo();
    if (action) action();
  });

  /* ---------------------------------------------
     Dialog helpers
     --------------------------------------------- */

  const syncModalLock = () => {
    document.body.classList.toggle("modal-open", Boolean(document.querySelector("dialog[open]")));
  };

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("close", syncModalLock);
  });

  const openDialog = (dialog) => {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    syncModalLock();
  };

  const closeOnBackdrop = (dialog, close) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left
        || event.clientX > rect.right
        || event.clientY < rect.top
        || event.clientY > rect.bottom;
      if (outside) close();
    });
  };

  closeOnBackdrop(dom.customizeDialog, () => dom.customizeDialog.close());
  closeOnBackdrop(dom.bookmarkDialog, () => dom.bookmarkDialog.close());

  function askConfirm(title, message, confirmLabel = "确认") {
    return new Promise((resolve) => {
      if (confirmResolver) {
        confirmResolver(false);
        confirmResolver = null;
      }
      dom.confirmTitle.textContent = title;
      dom.confirmText.textContent = message;
      dom.confirmOk.textContent = confirmLabel;
      dom.confirmDialog.returnValue = "";
      confirmResolver = resolve;
      openDialog(dom.confirmDialog);
    });
  }

  dom.confirmCancel.addEventListener("click", () => dom.confirmDialog.close("cancel"));
  dom.confirmOk.addEventListener("click", () => dom.confirmDialog.close("confirm"));
  dom.confirmDialog.addEventListener("close", () => {
    const resolver = confirmResolver;
    confirmResolver = null;
    syncModalLock();
    if (resolver) resolver(dom.confirmDialog.returnValue === "confirm");
  });

  /* ---------------------------------------------
     Clock
     --------------------------------------------- */

  let lastClockKey = "";

  const greetingFor = (hour) => {
    let message;
    if (hour < 5) message = "夜深了，愿你好梦。";
    else if (hour < 9) message = "早上好，新的一天正在展开。";
    else if (hour < 12) message = "上午好，专注眼前这一刻。";
    else if (hour < 14) message = "中午好，记得停下来歇一歇。";
    else if (hour < 18) message = "下午好，慢慢来，也很好。";
    else if (hour < 23) message = "晚上好，把时间留给喜欢的事。";
    else message = "夜深了，早些休息。";
    return state.name ? `${state.name}，${message}` : message;
  };

  function renderClock(force = false) {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const rawHour = now.getHours();
    const showSeconds = state.preferences.seconds;
    const hour24 = state.preferences.hour24;
    const clockKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${rawHour}-${minutes}-${showSeconds ? seconds : "x"}-${hour24}-${state.name}`;
    if (!force && clockKey === lastClockKey) return;
    lastClockKey = clockKey;

    const dateText = `${WEEKDAYS[now.getDay()]} · ${now.getMonth() + 1}月${now.getDate()}日`;
    dom.dateText.textContent = dateText;

    const displayHour = hour24 ? rawHour : (rawHour % 12 || 12);
    dom.clockMain.textContent = `${hour24 ? pad(displayHour) : displayHour}:${pad(minutes)}`;
    dom.clockSeconds.textContent = `:${pad(seconds)}`;
    dom.clockSeconds.classList.toggle("is-hidden", !showSeconds);
    dom.clockPeriod.textContent = rawHour >= 12 ? "PM" : "AM";
    dom.clockPeriod.hidden = hour24;

    const periodLabel = hour24 ? "" : (rawHour >= 12 ? " 下午" : " 上午");
    dom.clock.dateTime = now.toISOString();
    dom.clock.setAttribute(
      "aria-label",
      `${dateText} ${hour24 ? pad(displayHour) : displayHour}:${pad(minutes)}${showSeconds ? `:${pad(seconds)}` : ""}${periodLabel}`
    );
    dom.greeting.textContent = greetingFor(rawHour);
  }

  /* ---------------------------------------------
     Search engines
     --------------------------------------------- */

  const currentEngine = () => SEARCH_ENGINES[state.preferences.engine] || SEARCH_ENGINES.bing;

  function renderEngine() {
    const engine = currentEngine();
    dom.engineLogo.textContent = engine.short;
    dom.engineLogo.style.color = engine.color;
    dom.engineLogo.style.background = `${engine.color}1f`;
    dom.engineButton.setAttribute("aria-label", `搜索引擎：${engine.name}，点击切换`);
    dom.searchInput.placeholder = `在 ${engine.name} 搜索，或输入网址`;
  }

  function buildEngineMenu() {
    dom.engineMenu.replaceChildren();
    Object.entries(SEARCH_ENGINES).forEach(([id, engine]) => {
      const option = el("button", "engine-option");
      option.type = "button";
      option.setAttribute("role", "option");
      option.dataset.engine = id;
      option.setAttribute("aria-selected", String(id === state.preferences.engine));

      const logo = el("span", "engine-logo", engine.short);
      logo.style.color = engine.color;
      logo.style.background = `${engine.color}1f`;

      const name = el("span", "", engine.name);
      const check = icon("i-check", "icon engine-check");

      option.append(logo, name, check);
      option.addEventListener("click", () => selectEngine(id));
      dom.engineMenu.append(option);
    });
  }

  function setEngineSelection(id) {
    $$(".engine-option", dom.engineMenu).forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.engine === id));
    });
  }

  function openEngineMenu({ focusSelected = false } = {}) {
    if (!dom.engineMenu.hidden) return;
    setEngineSelection(state.preferences.engine);
    dom.engineMenu.hidden = false;
    dom.engineButton.setAttribute("aria-expanded", "true");
    if (focusSelected) {
      const selected = $('.engine-option[aria-selected="true"]', dom.engineMenu);
      window.requestAnimationFrame(() => selected?.focus({ preventScroll: true }));
    }
  }

  function closeEngineMenu({ returnFocus = false } = {}) {
    if (dom.engineMenu.hidden) return;
    dom.engineMenu.hidden = true;
    dom.engineButton.setAttribute("aria-expanded", "false");
    if (returnFocus) dom.engineButton.focus();
  }

  function selectEngine(id) {
    if (!SEARCH_ENGINES[id]) return;
    state.preferences.engine = id;
    saveState();
    renderEngine();
    closeEngineMenu();
    dom.searchInput.focus();
  }

  dom.engineButton.addEventListener("click", () => {
    if (dom.engineMenu.hidden) openEngineMenu({ focusSelected: true });
    else closeEngineMenu({ returnFocus: true });
  });

  dom.engineButton.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openEngineMenu({ focusSelected: true });
    }
  });

  dom.engineMenu.addEventListener("keydown", (event) => {
    const options = $$(".engine-option", dom.engineMenu);
    const index = options.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const next = (index + direction + options.length) % options.length;
      options[next].focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      options[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      options[options.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeEngineMenu({ returnFocus: true });
    }
  });

  document.addEventListener("focusin", (event) => {
    if (!dom.engineMenu.hidden && !dom.searchForm.contains(event.target)) {
      closeEngineMenu();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!dom.engineMenu.hidden && !dom.searchForm.contains(event.target)) {
      closeEngineMenu();
    }
  });

  dom.searchInput.addEventListener("input", () => {
    dom.searchKbd.classList.toggle("is-hidden", dom.searchInput.value.length > 0);
    if (!dom.engineMenu.hidden) closeEngineMenu();
  });

  dom.searchInput.addEventListener("focus", () => {
    if (!dom.engineMenu.hidden) closeEngineMenu();
  });

  function runSearch(forceNewTab = false) {
    const query = dom.searchInput.value.trim();
    if (!query) {
      dom.searchInput.focus();
      return;
    }

    const directUrl = getDirectUrl(query);
    const target = directUrl || `${currentEngine().searchUrl}${encodeURIComponent(query)}`;
    const shouldOpenNewTab = forceNewTab || state.preferences.searchNewTab;

    if (shouldOpenNewTab) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(target);
    }
  }

  dom.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      runSearch(true);
      return;
    }

    if (event.key === "Escape") {
      if (!dom.engineMenu.hidden) {
        closeEngineMenu({ returnFocus: true });
      } else {
        dom.searchInput.blur();
      }
    }
  });

  dom.searchSubmit.addEventListener("click", (event) => {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    runSearch(true);
  });

  dom.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });

  /* ---------------------------------------------
     Bookmarks
     --------------------------------------------- */

  function faviconUrl(bookmark) {
    if (bookmark.icon) return bookmark.icon;
    try {
      return `${new URL(bookmark.url).origin}/favicon.ico`;
    } catch {
      return "";
    }
  }

  function fillFavicon(container, bookmark) {
    container.replaceChildren();
    container.style.setProperty("--h", String(hashHue(bookmark.name)));
    const fallback = el("span", "bookmark-fallback", firstGlyph(bookmark.name));
    container.append(fallback);

    const source = faviconUrl(bookmark);
    if (!source) return;

    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("load", () => {
      image.classList.add("is-loaded");
      container.classList.add("has-icon");
    }, { once: true });
    image.addEventListener("error", () => {
      image.remove();
      container.classList.remove("has-icon");
    }, { once: true });
    image.src = source;
    container.append(image);
  }

  function createBookmarkTile(bookmark, index) {
    const link = el("a", "bookmark");
    link.href = bookmark.url;
    link.dataset.bookmarkId = bookmark.id;
    link.title = `${bookmark.name} — ${bookmark.url}`;
    link.style.setProperty("--i", String(Math.min(index, 10)));

    const iconBox = el("span", "bookmark-icon");
    fillFavicon(iconBox, bookmark);
    const label = el("span", "bookmark-name", bookmark.name);
    link.append(iconBox, label);
    return link;
  }

  function renderBookmarks() {
    dom.bookmarks.classList.toggle("is-static", bookmarksRendered);
    dom.bookmarks.replaceChildren();
    state.bookmarks.forEach((bookmark, index) => {
      dom.bookmarks.append(createBookmarkTile(bookmark, index));
    });

    if (state.bookmarks.length < MAX_BOOKMARKS) {
      const add = el("button", "bookmark bookmark-add");
      add.type = "button";
      add.style.setProperty("--i", String(Math.min(state.bookmarks.length, 10)));
      add.setAttribute("aria-label", "添加书签");
      const addIcon = el("span", "bookmark-icon");
      addIcon.append(icon("i-plus"));
      add.append(addIcon, el("span", "bookmark-name", "添加"));
      add.addEventListener("click", () => openBookmarkDialog());
      dom.bookmarks.append(add);
    }

    bookmarksRendered = true;
  }

  function renderManageList() {
    dom.bookmarkList.replaceChildren();

    if (state.bookmarks.length === 0) {
      dom.bookmarkList.append(
        el("div", "empty-state", "还没有书签。\n添加几个常去的地方，让这里更像你的主页。")
      );
    }

    state.bookmarks.forEach((bookmark) => {
      const row = el("div", "manage-item");
      row.dataset.id = bookmark.id;

      const grip = el("span", "manage-grip");
      grip.draggable = true;
      grip.title = "拖动排序";
      grip.setAttribute("aria-hidden", "true");
      grip.append(icon("i-grip"));

      const iconBox = el("span", "manage-icon");
      fillFavicon(iconBox, bookmark);

      const copy = el("span", "manage-copy");
      copy.append(
        el("span", "manage-name", bookmark.name),
        el("span", "manage-url", stripProtocol(bookmark.url))
      );

      const actions = el("span", "manage-actions");
      const edit = el("button", "mini-button");
      edit.type = "button";
      edit.setAttribute("aria-label", `编辑 ${bookmark.name}`);
      edit.title = "编辑";
      edit.append(icon("i-edit"));
      edit.addEventListener("click", () => openBookmarkDialog(bookmark.id));

      const remove = el("button", "mini-button danger");
      remove.type = "button";
      remove.setAttribute("aria-label", `删除 ${bookmark.name}`);
      remove.title = "删除";
      remove.append(icon("i-trash"));
      remove.addEventListener("click", () => deleteBookmark(bookmark.id));

      actions.append(edit, remove);
      row.append(grip, iconBox, copy, actions);
      dom.bookmarkList.append(row);
    });

    const atLimit = state.bookmarks.length >= MAX_BOOKMARKS;
    dom.panelAddBookmark.disabled = atLimit;
    dom.panelAddBookmark.title = atLimit ? `最多 ${MAX_BOOKMARKS} 个书签` : "";
  }

  function deleteBookmark(id) {
    const index = state.bookmarks.findIndex((bookmark) => bookmark.id === id);
    if (index < 0) return;
    const [removed] = state.bookmarks.splice(index, 1);
    saveState();
    renderBookmarks();
    renderManageList();

    const undo = () => {
      if (state.bookmarks.length >= MAX_BOOKMARKS) {
        showToast(`书签已满，无法撤销（最多 ${MAX_BOOKMARKS} 个）`);
        return;
      }
      state.bookmarks.splice(Math.min(index, state.bookmarks.length), 0, removed);
      saveState();
      renderBookmarks();
      renderManageList();
    };

    if (dom.customizeDialog.open) {
      showInlineUndo(`已删除「${removed.name}」`, undo);
      window.requestAnimationFrame(() => dom.inlineUndoAction.focus({ preventScroll: true }));
    } else {
      showToast(`已删除「${removed.name}」`, {
        actionLabel: "撤销",
        duration: 6500,
        keyAction: true,
        onAction: undo
      });
    }
  }

  let draggingRow = null;

  dom.bookmarkList.addEventListener("dragstart", (event) => {
    const grip = event.target.closest(".manage-grip");
    if (!grip) {
      event.preventDefault();
      return;
    }
    const row = grip.closest(".manage-item");
    if (!row) return;
    draggingRow = row;
    row.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.dataset.id);
    event.dataTransfer.setData("application/x-qiyue-bookmark", row.dataset.id);
    try {
      event.dataTransfer.setDragImage(row, 30, 22);
    } catch {
      /* noop */
    }
  });

  dom.bookmarkList.addEventListener("dragover", (event) => {
    if (!draggingRow) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const target = event.target.closest(".manage-item");
    if (!target || target === draggingRow) return;
    const rect = target.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    dom.bookmarkList.insertBefore(draggingRow, before ? target : target.nextSibling);
  });

  const finishBookmarkDrag = () => {
    if (!draggingRow) return;
    const row = draggingRow;
    row.classList.remove("is-dragging");
    draggingRow = null;

    const order = $$(".manage-item", dom.bookmarkList).map((item) => item.dataset.id);
    const byId = new Map(state.bookmarks.map((bookmark) => [bookmark.id, bookmark]));
    const reordered = order.map((id) => byId.get(id)).filter(Boolean);
    if (reordered.length !== state.bookmarks.length) {
      renderManageList();
      return;
    }

    const changed = reordered.some((bookmark, index) => bookmark.id !== state.bookmarks[index]?.id);
    if (!changed) return;
    state.bookmarks = reordered;
    saveState();
    renderBookmarks();
    renderManageList();
  };

  dom.bookmarkList.addEventListener("drop", (event) => {
    if (!draggingRow) return;
    event.preventDefault();
    finishBookmarkDrag();
  });

  dom.bookmarkList.addEventListener("dragend", () => {
    finishBookmarkDrag();
  });

  /* ---------------------------------------------
     Bookmark dialog
     --------------------------------------------- */

  function updateBookmarkPreview() {
    const token = ++previewToken;
    const name = dom.bookmarkName.value.trim();
    const rawUrl = dom.bookmarkUrl.value.trim();
    const normalized = normalizeUrl(rawUrl);
    const fallbackName = name || (normalized ? bookmarkNameForUrl(normalized) : "新书签");

    dom.previewName.textContent = fallbackName;
    dom.previewUrl.textContent = normalized ? stripProtocol(normalized) : (rawUrl || "example.com");
    dom.previewFallback.textContent = firstGlyph(fallbackName);
    dom.previewIcon.style.setProperty("--h", String(hashHue(fallbackName)));

    const iconField = dom.bookmarkIcon.value.trim();
    const customIcon = iconField ? normalizeUrl(iconField) : "";
    const source = customIcon || (normalized ? `${new URL(normalized).origin}/favicon.ico` : "");

    dom.previewImage.hidden = true;
    dom.previewImage.removeAttribute("src");
    dom.previewFallback.style.opacity = "1";

    if (!source) return;

    dom.previewImage.onload = () => {
      if (token !== previewToken) return;
      dom.previewImage.hidden = false;
      dom.previewFallback.style.opacity = "0";
    };
    dom.previewImage.onerror = () => {
      if (token !== previewToken) return;
      dom.previewImage.hidden = true;
      dom.previewFallback.style.opacity = "1";
    };
    dom.previewImage.src = source;
  }

  function openBookmarkDialog(bookmarkId = null, preset = null) {
    const bookmark = bookmarkId
      ? state.bookmarks.find((item) => item.id === bookmarkId)
      : null;
    const prefill = !bookmark && preset ? preset : null;

    if (!bookmark && state.bookmarks.length >= MAX_BOOKMARKS) {
      showToast(`最多只能添加 ${MAX_BOOKMARKS} 个书签`);
      return;
    }

    editingBookmarkId = bookmark ? bookmark.id : null;
    dom.bookmarkDialogTitle.textContent = bookmark ? "编辑书签" : "添加书签";
    dom.bookmarkName.value = bookmark?.name || prefill?.name || "";
    dom.bookmarkUrl.value = bookmark?.url || prefill?.url || "";
    dom.bookmarkIcon.value = bookmark?.icon || prefill?.icon || "";
    dom.bookmarkError.textContent = "";
    updateBookmarkPreview();

    openDialog(dom.bookmarkDialog);
    window.requestAnimationFrame(() => {
      dom.bookmarkName.focus();
      if (prefill) dom.bookmarkName.select();
    });
  }

  const closeBookmarkDialog = () => {
    if (dom.bookmarkDialog.open) dom.bookmarkDialog.close();
  };

  dom.closeBookmarkDialog.addEventListener("click", closeBookmarkDialog);
  dom.cancelBookmark.addEventListener("click", closeBookmarkDialog);

  [dom.bookmarkName, dom.bookmarkUrl, dom.bookmarkIcon].forEach((field) => {
    field.addEventListener("input", () => {
      if (dom.bookmarkError.textContent) dom.bookmarkError.textContent = "";
      updateBookmarkPreview();
    });
  });

  function focusBookmarkControl(id) {
    if (dom.customizeDialog.open) {
      const row = $$(".manage-item", dom.bookmarkList).find((item) => item.dataset.id === id);
      const editButton = row?.querySelector(".mini-button");
      (editButton || dom.panelAddBookmark).focus();
      return;
    }

    const tile = $$(".bookmark", dom.bookmarks).find((item) => item.dataset.bookmarkId === id);
    if (tile) {
      tile.focus();
    } else {
      (dom.bookmarks.querySelector(".bookmark-add") || dom.bookmarks.querySelector(".bookmark"))?.focus();
    }
  }

  function openBookmarkFromExternalUrl(text) {
    const url = externalUrlFromText(text);
    if (!url) return false;

    const existing = findExistingBookmark(url);
    if (existing) {
      showToast(`「${existing.name}」已经在书签中`);
      focusBookmarkControl(existing.id);
      return true;
    }

    if (state.bookmarks.length >= MAX_BOOKMARKS) {
      showToast(`最多只能添加 ${MAX_BOOKMARKS} 个书签`);
      return true;
    }

    hideToast();
    if (!dom.engineMenu.hidden) closeEngineMenu();
    openBookmarkDialog(null, {
      name: bookmarkNameForUrl(url),
      url,
      icon: ""
    });
    return true;
  }

  dom.bookmarkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    dom.bookmarkError.textContent = "";

    const url = normalizeUrl(dom.bookmarkUrl.value);
    if (!url) {
      dom.bookmarkError.textContent = "请输入有效的网址，例如 example.com 或 https://example.com";
      dom.bookmarkUrl.focus();
      return;
    }

    const iconField = dom.bookmarkIcon.value.trim();
    const iconUrl = iconField ? normalizeUrl(iconField) : "";
    if (iconField && !iconUrl) {
      dom.bookmarkError.textContent = "图标地址需要是一个 http(s) 开头的图片链接";
      dom.bookmarkIcon.focus();
      return;
    }

    const duplicate = findExistingBookmark(url);
    if (duplicate && duplicate.id !== editingBookmarkId) {
      dom.bookmarkError.textContent = `「${duplicate.name}」已经在书签中`;
      dom.bookmarkUrl.focus();
      return;
    }

    const name = cleanText(dom.bookmarkName.value, 40) || bookmarkNameForUrl(url);
    const existing = editingBookmarkId
      ? state.bookmarks.find((bookmark) => bookmark.id === editingBookmarkId)
      : null;
    const wasEditing = Boolean(existing);
    let savedId;

    if (existing) {
      existing.name = name;
      existing.url = url;
      existing.icon = iconUrl || "";
      savedId = existing.id;
    } else {
      if (state.bookmarks.length >= MAX_BOOKMARKS) {
        dom.bookmarkError.textContent = `最多只能添加 ${MAX_BOOKMARKS} 个书签`;
        return;
      }
      const created = {
        id: uid(),
        name,
        url,
        icon: iconUrl || ""
      };
      state.bookmarks.push(created);
      savedId = created.id;
    }

    saveState();
    closeBookmarkDialog();
    renderBookmarks();
    renderManageList();
    window.requestAnimationFrame(() => focusBookmarkControl(savedId));
    showToast(wasEditing ? "书签已更新" : `已添加「${name}」`);
  });

  dom.bookmarkDialog.addEventListener("close", () => {
    editingBookmarkId = null;
    dom.bookmarkError.textContent = "";
  });

  /* ---------------------------------------------
     Wallpaper
     --------------------------------------------- */

  const setCustomWallpaperUrl = (url, isObjectUrl = false) => {
    if (customWallpaperUrl && customWallpaperIsObjectUrl) {
      URL.revokeObjectURL(customWallpaperUrl);
    }
    customWallpaperUrl = url;
    customWallpaperIsObjectUrl = isObjectUrl;
    customWallpaperRevision += 1;
  };

  const activeWallpaperSource = () => {
    if (state.wallpaper.type === "upload") return customWallpaperUrl;
    if (state.wallpaper.type === "url") return state.wallpaper.url;
    return "";
  };

  let wallpaperLoadToken = 0;

  function applyWallpaper() {
    const preset = PRESETS[state.wallpaper.preset] || PRESETS.aurora;
    const source = activeWallpaperSource();
    const token = ++wallpaperLoadToken;

    dom.wallpaperArt.style.background = preset.background;
    document.documentElement.dataset.preset = state.wallpaper.preset;
    dom.backdrop.classList.remove("has-photo");

    if (!source) {
      dom.wallpaperPhoto.style.backgroundImage = "none";
    } else {
      const loader = new Image();
      loader.onload = () => {
        if (token !== wallpaperLoadToken) return;
        dom.wallpaperPhoto.style.backgroundImage = cssUrl(source);
        dom.backdrop.classList.add("has-photo");
      };
      loader.onerror = () => {
        if (token !== wallpaperLoadToken) return;
        dom.backdrop.classList.remove("has-photo");
      };
      loader.src = source;
    }

    document.documentElement.style.setProperty("--wallpaper-blur", `${state.wallpaper.blur}px`);
    document.documentElement.style.setProperty("--wallpaper-dim", String(state.wallpaper.dim / 100));
  }

  const updateRange = (input, output, suffix) => {
    const value = Number(input.value);
    const min = Number(input.min);
    const max = Number(input.max);
    const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty("--fill", `${percent}%`);
    output.textContent = `${value}${suffix}`;
    input.setAttribute("aria-valuetext", `${value}${suffix}`);
  };

  function renderPresetGrid() {
    dom.presetGrid.replaceChildren();

    Object.entries(PRESETS).forEach(([id, preset]) => {
      const card = el("button", "wallpaper-card");
      card.type = "button";
      card.dataset.preset = id;
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-label", `壁纸：${preset.name}`);

      const thumb = el("span", "wallpaper-thumb");
      thumb.style.background = preset.background;
      const name = el("span", "wallpaper-name", preset.name);
      const check = el("span", "wallpaper-check");
      check.append(icon("i-check"));

      card.append(thumb, name, check);
      card.addEventListener("click", () => selectPreset(id));
      dom.presetGrid.append(card);
    });

    if (customWallpaperUrl) {
      const card = el("button", "wallpaper-card wallpaper-card-custom");
      card.type = "button";
      card.dataset.custom = "true";
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-label", "壁纸：我的图片");

      const thumb = el("span", "wallpaper-thumb");
      thumb.style.backgroundImage = cssUrl(customWallpaperUrl);
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
      const name = el("span", "wallpaper-name", "我的图片");
      const check = el("span", "wallpaper-check");
      check.append(icon("i-check"));

      card.append(thumb, name, check);
      card.addEventListener("click", () => {
        state.wallpaper.type = "upload";
        state.wallpaper.url = "";
        saveState();
        applyWallpaper();
        updateWallpaperControls();
      });
      dom.presetGrid.append(card);
    }

    updatePresetSelection();
  }

  function updatePresetSelection() {
    $$(".wallpaper-card", dom.presetGrid).forEach((card) => {
      const active = card.dataset.custom
        ? state.wallpaper.type === "upload"
        : state.wallpaper.type === "preset" && state.wallpaper.preset === card.dataset.preset;
      card.setAttribute("aria-pressed", String(active));
    });

    if (state.wallpaper.type === "preset") {
      dom.wallpaperStatus.textContent = `${(PRESETS[state.wallpaper.preset] || PRESETS.aurora).name} · 内置`;
    } else if (state.wallpaper.type === "upload") {
      dom.wallpaperStatus.textContent = "我的图片 · 本地";
    } else {
      dom.wallpaperStatus.textContent = "图片链接 · 网络";
    }
  }

  function updateWallpaperControls() {
    dom.blurRange.value = String(state.wallpaper.blur);
    dom.dimRange.value = String(state.wallpaper.dim);
    updateRange(dom.blurRange, dom.blurValue, "px");
    updateRange(dom.dimRange, dom.dimValue, "%");
    dom.wallpaperUrl.value = state.wallpaper.type === "url" ? state.wallpaper.url : "";
    updatePresetSelection();
  }

  function selectPreset(id) {
    if (!PRESETS[id]) return;
    state.wallpaper.type = "preset";
    state.wallpaper.preset = id;
    state.wallpaper.url = "";
    saveState();
    applyWallpaper();
    updateWallpaperControls();
  }

  async function testImageUrl(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        image.src = "";
        reject(new Error("Image load timed out"));
      }, 12000);

      image.onload = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve();
      };
      image.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(new Error("Image failed to load"));
      };
      image.src = url;
    });
  }

  async function applyWallpaperFromUrl() {
    if (dom.applyWallpaperUrl.disabled) return;
    const url = normalizeUrl(dom.wallpaperUrl.value);
    if (!url) {
      showToast("请输入有效的图片网址");
      dom.wallpaperUrl.focus();
      return;
    }

    const previousLabel = dom.applyWallpaperUrl.textContent;
    dom.applyWallpaperUrl.disabled = true;
    dom.applyWallpaperUrl.textContent = "加载中";
    try {
      await testImageUrl(url);
      state.wallpaper.type = "url";
      state.wallpaper.url = url;
      saveState();
      applyWallpaper();
      updateWallpaperControls();
      showToast("壁纸已更新");
    } catch {
      showToast("图片加载失败，请检查网址是否可以直接访问");
    } finally {
      dom.applyWallpaperUrl.disabled = false;
      dom.applyWallpaperUrl.textContent = previousLabel;
    }
  }

  dom.applyWallpaperUrl.addEventListener("click", applyWallpaperFromUrl);
  dom.wallpaperUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyWallpaperFromUrl();
    }
  });

  /* ---------------------------------------------
     Image upload & compression
     --------------------------------------------- */

  const loadImageFile = (file) => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image decode failed"));
    };
    image.src = objectUrl;
  });

  const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });

  const optimizeImage = async (file) => {
    const image = await loadImageFile(file);
    const scale = Math.min(1, MAX_WALLPAPER_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas unavailable");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = "#0a1014";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let quality = 0.9;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);
    while (blob && blob.size > 2.4 * 1024 * 1024 && quality > 0.66) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (!blob) throw new Error("Image compression failed");
    return blob;
  };

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(blob);
  });

  const persistWallpaperBlob = async (blob) => {
    try {
      await idbPutWallpaper(blob);
      try {
        localStorage.removeItem(WALLPAPER_TOMBSTONE_KEY);
      } catch {
        /* noop */
      }
      try {
        localStorage.removeItem(WALLPAPER_FALLBACK_KEY);
      } catch {
        /* noop */
      }
    } catch {
      try {
        await idbDeleteWallpaper();
      } catch {
        /* noop */
      }
      const dataUrl = await blobToDataUrl(blob);
      localStorage.setItem(WALLPAPER_FALLBACK_KEY, dataUrl);
      try {
        localStorage.removeItem(WALLPAPER_TOMBSTONE_KEY);
      } catch {
        /* noop */
      }
    }
  };

  const wallpaperIsCleared = () => {
    try {
      return localStorage.getItem(WALLPAPER_TOMBSTONE_KEY) === "1";
    } catch {
      return false;
    }
  };

  const readPersistedWallpaper = async () => {
    if (wallpaperIsCleared()) return null;

    // The fallback is only written when IndexedDB failed, so it is newer
    // than anything IndexedDB might still hold.
    try {
      const dataUrl = localStorage.getItem(WALLPAPER_FALLBACK_KEY);
      if (dataUrl && dataUrl.startsWith("data:image/")) {
        return { url: dataUrl, isObjectUrl: false };
      }
    } catch {
      /* noop */
    }

    try {
      const blob = await idbGetWallpaper();
      if (blob instanceof Blob) {
        return { url: URL.createObjectURL(blob), isObjectUrl: true };
      }
    } catch {
      /* noop */
    }

    return null;
  };

  const clearPersistedWallpaper = async () => {
    try {
      localStorage.removeItem(WALLPAPER_FALLBACK_KEY);
      localStorage.setItem(WALLPAPER_TOMBSTONE_KEY, "1");
    } catch {
      /* noop */
    }
    try {
      await idbDeleteWallpaper();
    } catch {
      /* noop */
    }
    setCustomWallpaperUrl(null, false);
  };

  async function handleWallpaperFile(file) {
    if (!file) return;
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
    const supportedMime = file.type.startsWith("image/") && file.type !== "image/svg+xml";
    const supportedExtension = /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name || "");
    if (isSvg || (!supportedMime && !supportedExtension)) {
      showToast("请选择 JPG、PNG、WebP 或 AVIF 图片");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast("图片不能超过 30 MB");
      return;
    }

    dom.uploadButton.classList.add("is-busy");
    try {
      const blob = await optimizeImage(file);
      let persisted = true;
      try {
        await persistWallpaperBlob(blob);
      } catch {
        persisted = false;
      }
      const objectUrl = URL.createObjectURL(blob);
      setCustomWallpaperUrl(objectUrl, true);
      state.wallpaper.type = "upload";
      state.wallpaper.url = "";
      saveState();
      renderPresetGrid();
      applyWallpaper();
      updateWallpaperControls();
      showToast(persisted ? "壁纸已更新" : "壁纸已应用，但浏览器无法保存，刷新后会恢复默认");
    } catch (error) {
      console.error(error);
      showToast("图片处理失败，请换一张图片试试");
    } finally {
      dom.uploadButton.classList.remove("is-busy");
      dom.wallpaperFile.value = "";
    }
  }

  dom.uploadButton.addEventListener("click", () => dom.wallpaperFile.click());
  dom.wallpaperFile.addEventListener("change", () => {
    const file = dom.wallpaperFile.files?.[0];
    dom.wallpaperFile.value = "";
    if (file) handleWallpaperFile(file);
  });

  const isFileDrag = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");

  ["dragenter", "dragover"].forEach((type) => {
    dom.uploadButton.addEventListener(type, (event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      dom.uploadButton.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    dom.uploadButton.addEventListener(type, (event) => {
      if (isFileDrag(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
      dom.uploadButton.classList.remove("is-dragging");
    });
  });
  dom.uploadButton.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) handleWallpaperFile(file);
  });

  dom.blurRange.addEventListener("input", () => {
    state.wallpaper.blur = Number(dom.blurRange.value);
    document.documentElement.style.setProperty("--wallpaper-blur", `${state.wallpaper.blur}px`);
    updateRange(dom.blurRange, dom.blurValue, "px");
  });
  dom.blurRange.addEventListener("change", saveState);

  dom.dimRange.addEventListener("input", () => {
    state.wallpaper.dim = Number(dom.dimRange.value);
    document.documentElement.style.setProperty("--wallpaper-dim", String(state.wallpaper.dim / 100));
    updateRange(dom.dimRange, dom.dimValue, "%");
  });
  dom.dimRange.addEventListener("change", saveState);

  dom.resetWallpaper.addEventListener("click", () => {
    state.wallpaper.type = "preset";
    state.wallpaper.preset = "aurora";
    state.wallpaper.url = "";
    state.wallpaper.blur = 0;
    state.wallpaper.dim = 26;
    saveState();
    renderPresetGrid();
    applyWallpaper();
    updateWallpaperControls();
    showToast("已恢复默认壁纸");
  });

  /* ---------------------------------------------
     Settings / data
     --------------------------------------------- */

  function syncSettingsControls() {
    dom.toggleSeconds.checked = state.preferences.seconds;
    dom.toggle24h.checked = state.preferences.hour24;
    dom.toggleNewTab.checked = state.preferences.searchNewTab;
    dom.displayName.value = state.name;
  }

  dom.toggleSeconds.addEventListener("change", () => {
    state.preferences.seconds = dom.toggleSeconds.checked;
    saveState();
    renderClock(true);
  });

  dom.toggle24h.addEventListener("change", () => {
    state.preferences.hour24 = dom.toggle24h.checked;
    saveState();
    renderClock(true);
  });

  dom.toggleNewTab.addEventListener("change", () => {
    state.preferences.searchNewTab = dom.toggleNewTab.checked;
    saveState();
  });

  dom.displayName.addEventListener("input", () => {
    state.name = cleanText(dom.displayName.value, 16);
    saveState();
    renderClock(true);
  });

  dom.displayName.addEventListener("blur", () => {
    dom.displayName.value = state.name;
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const dateStamp = () => {
    const now = new Date();
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  };

  dom.exportButton.addEventListener("click", async () => {
    dom.exportButton.disabled = true;
    try {
      const payload = {
        app: "qiyue",
        version: 1,
        exportedAt: new Date().toISOString(),
        state: {
          ...state,
          wallpaper: { ...state.wallpaper }
        }
      };

      if (!wallpaperIsCleared()) {
        if (customWallpaperUrl && customWallpaperUrl.startsWith("data:image/")) {
          payload.wallpaperImage = customWallpaperUrl;
        } else {
          try {
            const blob = await idbGetWallpaper();
            if (blob instanceof Blob) {
              payload.wallpaperImage = await blobToDataUrl(blob);
            } else if (customWallpaperUrl && customWallpaperUrl.startsWith("blob:")) {
              const response = await fetch(customWallpaperUrl);
              const fetched = await response.blob();
              if (fetched.type.startsWith("image/")) payload.wallpaperImage = await blobToDataUrl(fetched);
            }
          } catch {
            if (customWallpaperUrl && customWallpaperUrl.startsWith("blob:")) {
              try {
                const response = await fetch(customWallpaperUrl);
                const fetched = await response.blob();
                if (fetched.type.startsWith("image/")) payload.wallpaperImage = await blobToDataUrl(fetched);
              } catch {
                /* noop */
              }
            }
          }
        }
      }

      const json = JSON.stringify(payload, null, 2);
      downloadBlob(new Blob([json], { type: "application/json" }), `qiyue-backup-${dateStamp()}.json`);
      showToast("备份已导出");
    } catch (error) {
      console.error(error);
      showToast("导出失败，请稍后再试");
    } finally {
      dom.exportButton.disabled = false;
    }
  });

  const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("Invalid image data");
    return blob;
  };

  const applyImportedBackup = async (file) => {
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      showToast("备份文件过大，无法导入");
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      showToast("这个文件不是有效的备份");
      return;
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      showToast("这个文件不是有效的备份");
      return;
    }

    if (parsed.app !== "qiyue" || !parsed.state || typeof parsed.state !== "object" || Array.isArray(parsed.state)) {
      showToast("这不是栖页导出的备份文件");
      return;
    }

    const rawState = parsed.state;
    const nextState = sanitizeState(rawState);
    const count = nextState.bookmarks.length;
    const confirmed = await askConfirm(
      "导入备份",
      `将用备份替换当前的书签与设置${count ? `，其中包含 ${count} 个书签` : ""}。导入后仍可再次导出，但当前内容不会保留。`,
      "导入"
    );
    if (!confirmed) return;

    try {
      let importedBlob = null;
      if (typeof parsed.wallpaperImage === "string" && parsed.wallpaperImage.startsWith("data:image/")) {
        try {
          importedBlob = await dataUrlToBlob(parsed.wallpaperImage);
        } catch {
          importedBlob = null;
        }
      }

      if (importedBlob) {
        await persistWallpaperBlob(importedBlob);
        const objectUrl = URL.createObjectURL(importedBlob);
        setCustomWallpaperUrl(objectUrl, true);
        if (nextState.wallpaper.type === "upload") {
          nextState.wallpaper.url = "";
        }
      } else {
        await clearPersistedWallpaper();
        if (nextState.wallpaper.type === "upload") {
          nextState.wallpaper.type = "preset";
        }
      }

      state = nextState;
      hideInlineUndo();
      saveState();
      renderEngine();
      renderClock(true);
      renderBookmarks();
      renderManageList();
      syncSettingsControls();
      renderPresetGrid();
      applyWallpaper();
      updateWallpaperControls();
      showToast("备份已导入");
    } catch (error) {
      console.error(error);
      showToast("导入失败，当前内容没有被修改");
    }
  };

  dom.importButton.addEventListener("click", () => dom.importFile.click());
  dom.importFile.addEventListener("change", () => {
    const file = dom.importFile.files?.[0];
    dom.importFile.value = "";
    if (file) applyImportedBackup(file);
  });

  dom.resetAll.addEventListener("click", async () => {
    const confirmed = await askConfirm(
      "恢复初始设置",
      "书签、壁纸和所有偏好都会恢复到初始状态，且无法撤销。建议先导出备份。",
      "恢复"
    );
    if (!confirmed) return;

    await clearPersistedWallpaper();
    state = makeDefaultState();
    hideInlineUndo();
    saveState();
    renderEngine();
    renderClock(true);
    renderBookmarks();
    renderManageList();
    syncSettingsControls();
    renderPresetGrid();
    applyWallpaper();
    updateWallpaperControls();
    setActiveTab("wallpaper");
    showToast("已恢复初始设置");
  });

  /* ---------------------------------------------
     Sheet / tabs
     --------------------------------------------- */

  function setActiveTab(name, { focus = false } = {}) {
    if (!["wallpaper", "bookmarks", "settings"].includes(name)) return;
    activeTab = name;
    if (name !== "bookmarks") hideInlineUndo();

    dom.tabs.forEach((tab) => {
      const selected = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });

    $$(".tab-panel", dom.customizeDialog).forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });

    dom.sheetScroll.scrollTop = 0;
    if (name === "bookmarks") renderManageList();
    if (name === "wallpaper") updateWallpaperControls();
    if (name === "settings") syncSettingsControls();
  }

  function openSheet(tab = "wallpaper") {
    setActiveTab(tab);
    openDialog(dom.customizeDialog);
    window.requestAnimationFrame(() => {
      $(`.tab[data-tab="${activeTab}"]`, dom.customizeDialog)?.focus({ preventScroll: true });
    });
  }

  dom.closeSheet.addEventListener("click", () => dom.customizeDialog.close());
  dom.customizeDialog.addEventListener("close", hideInlineUndo);

  $$("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => openSheet(button.dataset.openPanel));
  });

  dom.manageBookmarks.addEventListener("click", () => openSheet("bookmarks"));

  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });

  dom.tabList.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = dom.tabs;
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let nextIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      nextIndex = (index + direction + tabs.length) % tabs.length;
    }
    setActiveTab(tabs[nextIndex].dataset.tab, { focus: true });
  });

  dom.panelAddBookmark.addEventListener("click", () => openBookmarkDialog());

  /* ---------------------------------------------
     Global drop overlay
     --------------------------------------------- */

  let dragDepth = 0;

  const dragTypes = (event) => Array.from(event.dataTransfer?.types || []);

  const getDragKind = (event) => {
    const types = dragTypes(event);
    if (types.includes("application/x-qiyue-bookmark")) return "none";
    if (types.includes("application/x-qiyue-page-link")) return "none";
    if (draggingRow) return "none";
    if (types.includes("Files")) return "file";
    if (types.includes("text/uri-list") || types.includes("text/x-moz-url") || types.includes("text/plain")) {
      return "link";
    }
    return "none";
  };

  document.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("a") || !event.dataTransfer) return;
    try {
      event.dataTransfer.setData("application/x-qiyue-page-link", "1");
    } catch {
      /* noop */
    }
  }, true);

  const setDropOverlayMode = (kind) => {
    const isLink = kind === "link";
    dom.dropIcon.setAttribute("href", isLink ? "#i-bookmark" : "#i-image");
    dom.dropTitle.textContent = isLink ? "松开，添加书签" : "松开，设为壁纸";
    dom.dropHint.textContent = isLink
      ? "会自动识别网址并打开添加窗口"
      : "图片会自动压缩，并只保存在此设备";
    dom.dropOverlay.classList.toggle("is-link", isLink);
  };

  const hideDropOverlay = () => {
    dragDepth = 0;
    dom.dropOverlay.classList.remove("is-visible", "is-link");
  };

  window.addEventListener("dragenter", (event) => {
    const kind = getDragKind(event);
    if (kind === "none") return;
    event.preventDefault();
    if (document.querySelector("dialog[open]")) return;
    dragDepth += 1;
    setDropOverlayMode(kind);
    dom.dropOverlay.classList.add("is-visible");
  });

  window.addEventListener("dragover", (event) => {
    const kind = getDragKind(event);
    if (kind === "none") return;
    event.preventDefault();
    if (document.querySelector("dialog[open]")) return;
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    if (dragDepth === 0) dragDepth = 1;
    setDropOverlayMode(kind);
    dom.dropOverlay.classList.add("is-visible");
  });

  window.addEventListener("dragleave", () => {
    if (dragDepth === 0) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dom.dropOverlay.classList.remove("is-visible");
  });

  window.addEventListener("drop", (event) => {
    const kind = getDragKind(event);
    if (kind === "none") return;
    event.preventDefault();

    const file = event.dataTransfer?.files?.[0];
    const rawLink = [
      event.dataTransfer?.getData("text/uri-list") || "",
      event.dataTransfer?.getData("text/x-moz-url") || "",
      event.dataTransfer?.getData("text/plain") || ""
    ].filter(Boolean).join("\n");
    hideDropOverlay();

    if (document.querySelector("dialog[open]")) return;

    if (kind === "file") {
      if (file) handleWallpaperFile(file);
      return;
    }

    if (!openBookmarkFromExternalUrl(rawLink)) {
      showToast("没有从拖入内容中识别到有效网址");
    }
  });

  window.addEventListener("dragend", hideDropOverlay);
  window.addEventListener("blur", hideDropOverlay);

  /* ---------------------------------------------
     Clipboard detection
     --------------------------------------------- */

  const clipboardSupported = Boolean(
    navigator.clipboard && typeof navigator.clipboard.readText === "function"
  );

  const clipboardBlockedByUi = () => document.hidden || Boolean(document.querySelector("dialog[open]"));

  const clipboardReadAllowed = async () => {
    if (clipboardPermissionGranted) return true;
    if (!navigator.permissions || typeof navigator.permissions.query !== "function") {
      return false;
    }
    try {
      const status = await navigator.permissions.query({ name: "clipboard-read" });
      clipboardPermissionGranted = status.state === "granted";
      return clipboardPermissionGranted;
    } catch {
      return false;
    }
  };

  async function checkClipboard() {
    if (!clipboardSupported || clipboardReadInFlight) return;
    if (!document.hasFocus() || clipboardBlockedByUi()) return;

    clipboardReadInFlight = true;
    try {
      // Never call readText() while the permission is still "prompt":
      // that is what makes Chrome show the "查看剪贴板" dialog repeatedly.
      if (!(await clipboardReadAllowed())) return;
      if (clipboardBlockedByUi()) return;

      const text = await navigator.clipboard.readText();
      if (clipboardBlockedByUi()) return;

      const url = externalUrlFromText(text);
      if (!url) {
        clipboardPromptedUrl = "";
        return;
      }
      if (url === clipboardPromptedUrl) return;

      if (findExistingBookmark(url)) {
        clipboardPromptedUrl = url;
        return;
      }
      if (dom.toast.classList.contains("is-visible")) return;

      clipboardPromptedUrl = url;
      let host = "";
      try {
        host = new URL(url).hostname.replace(/^www\./i, "");
      } catch {
        /* noop */
      }

      showToast(host ? `剪贴板中有网址：${host}` : "剪贴板中检测到网址", {
        actionLabel: "添加书签",
        duration: 10000,
        onAction: () => openBookmarkFromExternalUrl(url)
      });
    } catch {
      // Permission may have been revoked; fall back to the explicit button/paste.
      clipboardPermissionGranted = false;
    } finally {
      clipboardReadInFlight = false;
    }
  }

  async function readClipboardExplicit() {
    if (!clipboardSupported) {
      showToast("此浏览器不支持读取剪贴板，请在页面空白处粘贴网址");
      return;
    }
    if (clipboardReadInFlight) return;

    clipboardReadInFlight = true;
    try {
      const text = await navigator.clipboard.readText();
      clipboardPermissionGranted = true;
      const url = externalUrlFromText(text);
      if (!url) {
        showToast("剪贴板中没有可识别的网址");
        return;
      }
      clipboardPromptedUrl = url;
      openBookmarkFromExternalUrl(text);
    } catch {
      clipboardPermissionGranted = false;
      showToast("无法读取剪贴板，请在页面空白处粘贴网址");
    } finally {
      clipboardReadInFlight = false;
    }
  }

  dom.clipboardBookmark.addEventListener("click", readClipboardExplicit);

  if (clipboardSupported) {
    window.setTimeout(checkClipboard, 1200);
    window.addEventListener("focus", checkClipboard);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkClipboard();
    });
  }

  document.addEventListener("paste", (event) => {
    if (document.querySelector("dialog[open]")) return;
    const target = event.target;
    const typing = target instanceof HTMLElement
      && (target.matches("input, textarea, select") || target.isContentEditable);
    if (typing) return;

    const text = event.clipboardData?.getData("text/plain") || "";
    const url = externalUrlFromText(text);
    if (!url) return;

    event.preventDefault();
    clipboardPromptedUrl = url;
    openBookmarkFromExternalUrl(text);
  });

  /* ---------------------------------------------
     Keyboard shortcuts
     --------------------------------------------- */

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const target = event.target;
    const typing = target instanceof HTMLElement
      && (target.matches("input, textarea, select") || target.isContentEditable);
    const dialogOpen = Boolean(document.querySelector("dialog[open]"));

    if (event.key === "Escape" && !dom.engineMenu.hidden && !dialogOpen) {
      event.preventDefault();
      closeEngineMenu({ returnFocus: true });
      return;
    }

    if (
      (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"))
      && !typing
      && !dialogOpen
    ) {
      event.preventDefault();
      dom.searchInput.focus();
      dom.searchInput.select();
      return;
    }

    if (
      (event.metaKey || event.ctrlKey)
      && event.key.toLowerCase() === "z"
      && !typing
    ) {
      if (lastToastShortcut && !dialogOpen) {
        event.preventDefault();
        const action = lastToastShortcut;
        hideToast();
        action();
        return;
      }
      if (
        inlineUndoAction
        && dom.customizeDialog.open
        && !dom.bookmarkDialog.open
        && !dom.confirmDialog.open
      ) {
        event.preventDefault();
        const action = inlineUndoAction;
        hideInlineUndo();
        action();
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderClock(true);
  });

  /* ---------------------------------------------
     Init
     --------------------------------------------- */

  async function hydrateCustomWallpaper() {
    const revisionAtStart = customWallpaperRevision;
    const restored = await readPersistedWallpaper();

    if (revisionAtStart !== customWallpaperRevision) {
      if (restored?.isObjectUrl) URL.revokeObjectURL(restored.url);
      return;
    }

    if (!restored) {
      if (state.wallpaper.type === "upload") {
        updateWallpaperControls();
        applyWallpaper();
        showToast("上次上传的壁纸无法读取，请重新上传");
      }
      return;
    }

    setCustomWallpaperUrl(restored.url, restored.isObjectUrl);
    renderPresetGrid();
    if (state.wallpaper.type === "upload") {
      applyWallpaper();
      updateWallpaperControls();
    }
  }

  function init() {
    const bookmarksMigrated = migrateLegacyPresetBookmarks();

    buildEngineMenu();
    renderEngine();
    renderClock(true);
    renderBookmarks();
    renderManageList();
    syncSettingsControls();
    renderPresetGrid();
    updateWallpaperControls();
    applyWallpaper();

    window.setInterval(() => renderClock(), 1000);

    if (!storageWritable) {
      window.setTimeout(() => showToast("浏览器存储不可写，改动可能无法保留"), 900);
    } else if (bookmarksMigrated) {
      window.setTimeout(() => showToast("常用书签已按浏览记录更新"), 700);
    }

    hydrateCustomWallpaper().catch((error) => {
      console.error(error);
      applyWallpaper();
      updateWallpaperControls();
    });
  }

  init();
})();

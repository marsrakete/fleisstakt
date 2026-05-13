const STORAGE_KEY = "fleisstakt-state-v1";
const APP_SHARE_URL = "https://marsrakete.github.io/fleisstakt/";
const DEFAULT_SYNC_BASE_URL = "https://schwoabamunzee.marsrakete.de/wp-json/fleisstakt-sync/v1";
const CURRENT_VERSION_INFO = Object.freeze(globalThis.APP_VERSION_INFO || {
  appVersion: "0.0.0",
  cacheVersion: "v0",
  label: "",
});

const navItems = [
  { id: "today", label: "Heute", icon: "♪" },
  { id: "log", label: "Eintragen", icon: "+" },
  { id: "cards", label: "Kärtchen", icon: "★" },
  { id: "history", label: "Verlauf", icon: "↺" },
  { id: "profile", label: "Profil", icon: "◌" },
];

const instruments = ["Klavier", "Violine", "Gitarre", "Cello"];
const defaultPracticeCategories = ["Technik", "Stück", "Tonleiter", "Freies Spiel"];
const cardRuleTypes = [
  "none",
  "streakAtLeast",
  "dayMinutesAtLeast",
  "weekMinutesAtLeast",
  "monthMinutesAtLeast",
  "notedEntriesAtLeast",
  "categoryUsed",
  "categoriesCountAtLeast",
  "morningEntryOnce",
  "entriesCountAtLeast",
  "weekEntriesAtLeast",
  "daysPracticedAtLeast",
];
const accentFallbacks = ["apricot", "gold", "sky", "mint"];
const standardCardDefinitions = [
  {
    id: "warm-gespielt",
    title: "Warm gespielt",
    description: "3 Tage in Folge geübt",
    accent: "apricot",
    symbol: "♬",
    rarity: "Bronze",
    source: "core",
    status: "active",
    rule: {
      type: "streakAtLeast",
      value: 3,
    },
  },
  {
    id: "taktsicher",
    title: "Taktsicher",
    description: "60 Minuten in einer Woche",
    accent: "gold",
    symbol: "✦",
    rarity: "Gold",
    source: "core",
    status: "active",
    rule: {
      type: "weekMinutesAtLeast",
      value: 60,
    },
  },
  {
    id: "morgenklang",
    title: "Morgenklang",
    description: "Vor 8 Uhr geübt",
    accent: "sky",
    symbol: "☀",
    rarity: "Silber",
    source: "core",
    status: "active",
    rule: {
      type: "morningEntryOnce",
      value: 1,
    },
  },
  {
    id: "buehnenmut",
    title: "Bühnenmut",
    description: "7 Einträge mit Notiz",
    accent: "mint",
    symbol: "✺",
    rarity: "Spezial",
    source: "core",
    status: "active",
    rule: {
      type: "notedEntriesAtLeast",
      value: 7,
    },
  },
];
const defaultEntries = [
  createEntry({
    date: daysAgo(4),
    instrument: "Klavier",
    minutes: 15,
    category: "Technik",
    note: "Rhythmus geklappt",
    savedAt: withTime(daysAgo(4), 16, 30),
  }),
  createEntry({
    date: daysAgo(3),
    instrument: "Klavier",
    minutes: 20,
    category: "Stück",
    note: "Frühlingslied sauberer",
    savedAt: withTime(daysAgo(3), 17, 10),
  }),
  createEntry({
    date: daysAgo(1),
    instrument: "Klavier",
    minutes: 25,
    category: "Freies Spiel",
    note: "Mit mehr Mut gespielt",
    savedAt: withTime(daysAgo(1), 7, 40),
  }),
];

const state = {
  activeScreen: "today",
  minutes: 20,
  instrument: instruments[0],
  category: defaultPracticeCategories[0],
  note: "",
  celebrate: false,
  celebrationText: "Neues Kärtchen vorbereitet. Weiter so!",
  profileName: "Mila",
  studentId: "",
  studentUuid: "",
  profileUuid: "",
  classId: "",
  profileLibrary: [],
  activeProfileId: "",
  entries: [],
  customCards: [],
  practiceCategories: [...defaultPracticeCategories],
  syncBaseUrl: DEFAULT_SYNC_BASE_URL,
  syncUploadToken: "",
  syncSiteLabel: "",
  syncStatusNote: "",
  syncState: "idle",
  syncLastSuccessAt: "",
  syncLastError: "",
  activeFeedbackRound: null,
  feedbackAnswers: {},
  feedbackStatus: "idle",
  feedbackError: "",
  profilePanel: "profil",
  goal: 15,
  installPrompt: null,
  installReady: false,
  prefersDesktopActions: window.matchMedia("(pointer:fine)").matches,
  reportRange: "week",
  settingsOpen: false,
  settingsFocusId: "",
  helpOpen: false,
  profileImportConfirmOpen: false,
  resetConfirmOpen: false,
  resetFinalConfirmOpen: false,
  pendingProfileImport: null,
  connectStudentIdDraft: "",
  connectCodeDraft: "",
  scannerOpen: false,
  scannerMessage: "",
  scannerState: "idle",
  syncStatusOpen: false,
  syncStatusTitle: "",
  syncStatusMessage: "",
  syncStatusState: "idle",
  syncStatusSteps: [],
  updateStatus: "Die App funktioniert auch offline. Für eine Update-Prüfung bitte kurz online gehen.",
  updateState: "idle",
  updateReady: false,
  versionInfo: CURRENT_VERSION_INFO,
};
let serviceWorkerRegistration = null;
let updateInProgress = false;
let reloadInProgress = false;
let controllerReloadHandled = false;
let qrScannerStream = null;
let qrScannerFrameHandle = 0;
let qrScanAbort = false;
let scannerRetryHandle = 0;
let activeSyncAutoCloseHandle = 0;
let studentSyncInProgress = false;
let studentAutoSyncPending = false;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  state.installReady = true;
  render();
});

window.addEventListener("appinstalled", () => {
  state.installPrompt = null;
  state.installReady = false;
  state.celebrationText = "FleißTakt wurde installiert.";
  state.celebrate = true;
  render();
  window.setTimeout(() => {
    state.celebrate = false;
    render();
  }, 2200);
});

const root = document.querySelector("#root");
hydrateState();
applyModalScrollLock();
applyReloadStatusFromUrl();
applyConnectionFromUrl();
registerServiceWorker();

function applyModalScrollLock() {
  const isLocked = state.settingsOpen
    || state.helpOpen
    || state.profileImportConfirmOpen
    || state.resetConfirmOpen
    || state.resetFinalConfirmOpen
    || state.scannerOpen
    || state.syncStatusOpen;
  document.documentElement.style.overflow = isLocked ? "hidden" : "";
  document.body.style.overflow = isLocked ? "hidden" : "";
  document.body.classList.toggle("is-modal-open", isLocked);
}

function scannerSupported() {
  return typeof window !== "undefined"
    && "BarcodeDetector" in window
    && Boolean(navigator.mediaDevices?.getUserMedia);
}

function connectionScannerText() {
  if (state.scannerState === "error" && state.scannerMessage) {
    return state.scannerMessage;
  }
  if (state.scannerState === "active") {
    return state.scannerMessage || "Halte den QR-Code ruhig in die Kamera.";
  }
  return state.scannerMessage || "Der QR-Code aus der Lehrkräfte-App kann direkt mit der Kamera oder über ein Bild erkannt werden.";
}

function formatStudentDateTime(value) {
  if (!value) {
    return "Noch nie";
  }

  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setStudentSyncState(syncState, note = "", options = {}) {
  state.syncState = syncState;
  state.syncStatusNote = note;
  state.syncLastError = syncState === "error" ? note : "";
  if (options.markSuccess) {
    state.syncLastSuccessAt = new Date().toISOString();
  }
}

function describeStudentSyncState() {
  if (!state.syncUploadToken) {
    return {
      tone: "idle",
      title: "Noch nicht mit einer Lehrkraft verbunden",
      text: "Verbinde dieses Gerät zuerst per QR-Code oder mit Lernenden-ID und Verbindungscode.",
    };
  }

  if (studentSyncInProgress) {
    return {
      tone: "running",
      title: "Server-Sync läuft gerade",
    text: state.syncStatusNote || "Bericht und zugewiesene Kärtchen werden gerade mit dem Server abgeglichen.",
    };
  }

  if (state.syncState === "error") {
    return {
      tone: "error",
      title: "Server-Sync braucht Aufmerksamkeit",
      text: state.syncStatusNote || "Der letzte Serverabgleich hat nicht vollständig geklappt.",
    };
  }

  if (state.syncState === "pending") {
    return {
      tone: "pending",
      title: "Lokale Änderungen warten auf den Server",
      text: state.syncStatusNote || "Der letzte Eintrag ist gespeichert, wurde aber noch nicht vollständig mit dem Server abgeglichen.",
    };
  }

  if (state.syncLastSuccessAt) {
    return {
      tone: "ok",
      title: "Serverstand aktuell",
      text: state.syncStatusNote || `Zuletzt synchronisiert am ${formatStudentDateTime(state.syncLastSuccessAt)}.`,
    };
  }

  return {
    tone: "idle",
    title: "Verbunden und bereit",
    text: state.syncStatusNote || "Der Unterricht ist verbunden. Der erste Eintrag kann jetzt mit dem Server abgeglichen werden.",
  };
}

function openSyncStatus(title, steps) {
  window.clearTimeout(activeSyncAutoCloseHandle);
  state.syncStatusOpen = true;
  state.syncStatusTitle = title;
  state.syncStatusMessage = "Bitte kurz warten...";
  state.syncStatusState = "running";
  state.syncStatusSteps = steps.map((step) => ({
    id: step.id,
    label: step.label,
    state: "pending",
  }));
  applyModalScrollLock();
  render();
}

function updateSyncStatus(stepId, nextState, message = "") {
  state.syncStatusSteps = state.syncStatusSteps.map((step) =>
    step.id === stepId ? { ...step, state: nextState } : step,
  );
  if (message) {
    state.syncStatusMessage = message;
  }
  render();
}

function finishSyncStatus(nextState, message, autoClose = false) {
  window.clearTimeout(activeSyncAutoCloseHandle);
  state.syncStatusState = nextState;
  state.syncStatusMessage = message;
  render();
  if (autoClose) {
    activeSyncAutoCloseHandle = window.setTimeout(() => {
      closeSyncStatusDialog();
    }, 1200);
  }
}

function closeSyncStatusDialog() {
  window.clearTimeout(activeSyncAutoCloseHandle);
  state.syncStatusOpen = false;
  state.syncStatusTitle = "";
  state.syncStatusMessage = "";
  state.syncStatusState = "idle";
  state.syncStatusSteps = [];
  applyModalScrollLock();
  render();
}

function normalizeVersionInfo(value = {}) {
  return {
    appVersion: String(value.appVersion || "").trim(),
    cacheVersion: String(value.cacheVersion || "").trim(),
    label: String(value.label || "").trim(),
  };
}

function versionSignature(value = {}) {
  const normalized = normalizeVersionInfo(value);
  return `${normalized.appVersion}|${normalized.cacheVersion}`;
}

function setUpdateStatus(message, options = {}) {
  const { showReload = false, error = false, stateName = "" } = options;
  state.updateReady = Boolean(showReload);
  state.updateStatus = message;
  state.updateState = stateName || (showReload ? "ready" : error ? "error" : message ? "ok" : "idle");
  render();
}

function applyReloadStatusFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("reload")) {
    return;
  }

  state.updateReady = false;
  state.updateState = "ok";
  state.updateStatus = "App wurde neu geladen. Die aktuelle Version ist jetzt aktiv.";
  url.searchParams.delete("reload");
  window.history.replaceState({}, "", url.toString());
}

async function fetchVersionInfo() {
  const response = await fetch(`./version.js?ts=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("version-nicht-verfuegbar");
  }

  const source = await response.text();
  const appVersion = source.match(/appVersion:\s*"([^"]+)"/)?.[1] || "";
  const cacheVersion = source.match(/cacheVersion:\s*"([^"]+)"/)?.[1] || "";
  const label = source.match(/label:\s*"([^"]*)"/)?.[1] || "";
  return normalizeVersionInfo({ appVersion, cacheVersion, label });
}

function watchServiceWorker(registration) {
  if (registration.waiting) {
    markUpdateReady();
  }

  registration.addEventListener("updatefound", () => {
    state.updateState = "checking";
    state.updateStatus = "Neue Version wird vorbereitet...";
    const worker = registration.installing;
    if (!worker) {
      render();
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed") {
        if (navigator.serviceWorker.controller) {
          markUpdateReady();
        } else {
          state.updateState = "ok";
          state.updateStatus = "App ist bereit und funktioniert auch offline.";
          render();
        }
      }
    });
    render();
  });
}

function markUpdateReady() {
  state.updateReady = true;
  state.updateState = "ready";
  state.updateStatus = "Update bereit. App bitte neu laden.";
  render();
}

async function performAppReload() {
  if (reloadInProgress) {
    return;
  }

  reloadInProgress = true;
  setUpdateStatus("Update wird angewendet...", { showReload: true, stateName: "ready" });

  try {
    await serviceWorkerRegistration?.update().catch(() => {});
    serviceWorkerRegistration?.waiting?.postMessage?.({ type: "SKIP_WAITING" });
  } catch {
    // fallback reload below
  }

  window.setTimeout(() => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("reload", String(Date.now()));
    window.location.replace(nextUrl.toString());
  }, 140);
}

async function checkForUpdates(options = {}) {
  const {
    showChecking = true,
    silentNoChange = false,
    silentError = false,
  } = options;

  if (updateInProgress) {
    return;
  }

  if (!serviceWorkerRegistration) {
    if (!silentError) {
      setUpdateStatus("Update-Prüfung auf diesem Gerät nicht verfügbar.", { error: true });
    }
    return;
  }

  if (!navigator.onLine) {
    if (!silentError) {
      setUpdateStatus("Du musst bitte eine Internet-Verbindung aufbauen, um ein Update zu starten.", {
        error: true,
      });
    }
    return;
  }

  updateInProgress = true;
  if (showChecking) {
    state.updateState = "checking";
    state.updateStatus = "Suche nach Updates...";
    render();
  }

  try {
    await serviceWorkerRegistration.update();
    const remoteVersion = await fetchVersionInfo();

    if (!remoteVersion.appVersion || !remoteVersion.cacheVersion) {
      if (!silentError) {
        setUpdateStatus("Versionsinformationen sind unvollständig. Bitte später erneut versuchen.", {
          error: true,
        });
      }
      return;
    }

    if (versionSignature(remoteVersion) === versionSignature(CURRENT_VERSION_INFO)) {
      if (!silentNoChange) {
        setUpdateStatus("Die App ist auf dem aktuellen Stand.", { stateName: "ok" });
      }
      return;
    }

    const remoteLabel = remoteVersion.label ? ` · ${remoteVersion.label}` : "";
    setUpdateStatus(
      `Neue Version gefunden: ${remoteVersion.appVersion} · ${remoteVersion.cacheVersion}${remoteLabel}. Bitte jetzt neu laden.`,
      { showReload: true, stateName: "ready" },
    );
  } catch {
    if (!silentError) {
      setUpdateStatus(
        "Update-Prüfung gerade nicht möglich. Bitte verbinde das Gerät kurz mit dem Internet und versuche es dann erneut.",
        { error: true },
      );
    }
  } finally {
    updateInProgress = false;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    state.updateStatus = "Update-Prüfung auf diesem Gerät nicht verfügbar.";
    state.updateState = "error";
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (controllerReloadHandled) {
      return;
    }

    controllerReloadHandled = true;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("reload", String(Date.now()));
    window.location.replace(nextUrl.toString());
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      serviceWorkerRegistration = registration;
      watchServiceWorker(registration);
      await navigator.serviceWorker.ready.catch(() => registration);

      if (navigator.onLine) {
        void checkForUpdates({
          showChecking: false,
          silentNoChange: true,
          silentError: true,
        });
      }
    } catch {
      state.updateStatus = "Update-Prüfung auf diesem Gerät nicht verfügbar.";
      state.updateState = "error";
      render();
    }
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(amount) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - amount);
  return formatDateKey(date);
}

function withTime(dateKey, hours, minutes) {
  return `${dateKey}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function createEntry({ date, instrument, minutes, category, note, savedAt }) {
  return {
    id: `${savedAt}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    instrument,
    minutes,
    category,
    note,
    savedAt,
  };
}

function createStudentId() {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `ft-${stamp}-${random}`;
}

function normalizePracticeCategories(list) {
  const values = Array.isArray(list)
    ? list
    : `${list || ""}`.split(/\r?\n|,/).map((item) => item.trim());

  const unique = [...new Set(values.map((item) => `${item || ""}`.trim()).filter(Boolean))];
  return unique.length ? unique.slice(0, 12) : [...defaultPracticeCategories];
}

function getPracticeCategories() {
  const categories = normalizePracticeCategories(state.practiceCategories);
  if (state.category && !categories.includes(state.category)) {
    return [...categories, state.category];
  }
  return categories;
}

function normalizeCardRule(rule) {
  const nextType = cardRuleTypes.includes(rule?.type) ? rule.type : "entriesCountAtLeast";
  const nextValue = nextType === "none"
    ? 0
    : nextType === "morningEntryOnce"
      ? 1
      : Math.max(1, Number(rule?.value) || 1);
  const category = nextType === "categoryUsed"
    ? `${rule?.category || defaultPracticeCategories[0] || ""}`.trim()
    : "";
  return {
    type: nextType,
    value: nextValue,
    category,
  };
}

function normalizeCardDefinition(card, source = "teacher") {
  const rule = normalizeCardRule(card?.rule);
  const assignment = {
    type: ["all", "class", "student"].includes(card?.assignment?.type) ? card.assignment.type : "all",
    targetId: `${card?.assignment?.targetId || ""}`.trim(),
  };
  const award = card?.award && card.award.mode === "manual"
    ? {
        mode: "manual",
        awardId: Number(card.award.awardId) || 0,
        note: `${card.award.note || ""}`.trim(),
        awardedAt: `${card.award.awardedAt || ""}`.trim(),
        awardedBy: `${card.award.awardedBy || ""}`.trim(),
      }
    : null;
  return {
    id: `${card?.id || createStudentId()}`,
    title: `${card?.title || "Neues Kärtchen"}`.trim() || "Neues Kärtchen",
    description: `${card?.description || describeRule(rule)}`.trim() || describeRule(rule),
    accent: accentFallbacks.includes(card?.accent) ? card.accent : accentFallbacks[0],
    symbol: `${card?.symbol || "♪"}`.trim().slice(0, 2) || "♪",
    rarity: `${card?.rarity || "Basis"}`.trim() || "Basis",
    source: source === "core" ? "core" : "teacher",
    status: card?.status === "inactive" ? "inactive" : "active",
    assignment,
    rule,
    award,
  };
}

function normalizeSyncBaseUrl(value) {
  const normalized = `${value || ""}`.trim();
  return normalized.replace(/\/+$/, "") || DEFAULT_SYNC_BASE_URL;
}

function normalizeFeedbackRound(round) {
  if (!round || !Array.isArray(round.questions) || !round.questions.length) {
    return null;
  }

  const questions = round.questions
    .filter((question) => question?.id && question?.label)
    .map((question) => ({
      id: Number(question.id) || 0,
      key: `${question.key || ""}`.trim(),
      label: `${question.label || ""}`.trim(),
      type: question.type === "scale5" ? "scale5" : "scale5",
      required: question.required !== false,
    }))
    .filter((question) => question.id && question.label);

  if (!questions.length) {
    return null;
  }

  return {
    roundId: Number(round.roundId) || 0,
    title: `${round.title || "Rückmeldung zum Unterricht"}`.trim(),
    introText: `${round.introText || "Deine Antworten sind anonym."}`.trim(),
    alreadyAnswered: Boolean(round.alreadyAnswered),
    ballotToken: `${round.ballotToken || ""}`.trim(),
    questions,
  };
}

function getProfileStorageId(profile = {}) {
  return `${profile.storageId || profile.profileUuid || profile.studentId || createStudentId()}`.trim();
}

function normalizeStoredProfile(profile = {}) {
  return {
    storageId: getProfileStorageId(profile),
    profileName: profile.profileName || profile.displayName || "Mila",
    profileLabel: profile.profileLabel || profile.instrument || "Profil",
    instrument: profile.instrument || instruments[0],
    goal: Number(profile.goal) || 15,
    studentId: profile.studentId || profile.appStudentId || createStudentId(),
    studentUuid: profile.studentUuid || "",
    profileUuid: profile.profileUuid || "",
    classId: profile.classId || "",
    entries: Array.isArray(profile.entries) ? profile.entries : [],
    customCards: Array.isArray(profile.customCards)
      ? profile.customCards.map((card) => normalizeCardDefinition(card, "teacher"))
      : [],
    practiceCategories: normalizePracticeCategories(profile.practiceCategories || defaultPracticeCategories),
    syncBaseUrl: normalizeSyncBaseUrl(profile.syncBaseUrl || DEFAULT_SYNC_BASE_URL),
    syncUploadToken: profile.syncUploadToken || profile.uploadToken || "",
    syncSiteLabel: profile.syncSiteLabel || profile.siteLabel || "",
    syncStatusNote: profile.syncStatusNote || "",
    syncState: ["idle", "pending", "running", "ok", "error"].includes(profile.syncState) ? profile.syncState : "idle",
    syncLastSuccessAt: profile.syncLastSuccessAt || "",
    syncLastError: profile.syncLastError || "",
    activeFeedbackRound: normalizeFeedbackRound(profile.activeFeedbackRound),
    feedbackAnswers: profile.feedbackAnswers && typeof profile.feedbackAnswers === "object" ? profile.feedbackAnswers : {},
    feedbackStatus: ["idle", "ready", "answered", "sending", "success", "error"].includes(profile.feedbackStatus) ? profile.feedbackStatus : "idle",
    feedbackError: profile.feedbackError || "",
  };
}

function currentProfileSnapshot(overrides = {}) {
  return normalizeStoredProfile({
    storageId: state.activeProfileId || state.profileUuid || state.studentId,
    profileName: state.profileName,
    profileLabel: overrides.profileLabel || state.instrument || "Profil",
    instrument: state.instrument,
    goal: state.goal,
    studentId: state.studentId,
    studentUuid: state.studentUuid,
    profileUuid: state.profileUuid,
    classId: state.classId,
    entries: state.entries,
    customCards: state.customCards,
    practiceCategories: state.practiceCategories,
    syncBaseUrl: state.syncBaseUrl,
    syncUploadToken: state.syncUploadToken,
    syncSiteLabel: state.syncSiteLabel,
    syncStatusNote: state.syncStatusNote,
    syncState: state.syncState,
    syncLastSuccessAt: state.syncLastSuccessAt,
    syncLastError: state.syncLastError,
    activeFeedbackRound: state.activeFeedbackRound,
    feedbackAnswers: state.feedbackAnswers,
    feedbackStatus: state.feedbackStatus,
    feedbackError: state.feedbackError,
    ...overrides,
  });
}

function syncCurrentStateIntoProfileLibrary() {
  const snapshot = currentProfileSnapshot();
  if (!snapshot.studentId && !snapshot.profileUuid && !snapshot.syncUploadToken) {
    return;
  }

  const nextId = snapshot.storageId;
  const nextLibrary = [...state.profileLibrary];
  const index = nextLibrary.findIndex((profile) => profile.storageId === nextId);
  if (index >= 0) {
    nextLibrary[index] = snapshot;
  } else {
    nextLibrary.push(snapshot);
  }

  state.profileLibrary = nextLibrary.sort((a, b) => {
    const left = `${a.profileName} ${a.profileLabel}`.trim();
    const right = `${b.profileName} ${b.profileLabel}`.trim();
    return left.localeCompare(right, "de");
  });
  state.activeProfileId = nextId;
}

function applyStoredProfile(profile) {
  const normalized = normalizeStoredProfile(profile);
  state.activeProfileId = normalized.storageId;
  state.profileName = normalized.profileName;
  state.instrument = normalized.instrument;
  state.goal = normalized.goal;
  state.studentId = normalized.studentId;
  state.studentUuid = normalized.studentUuid;
  state.profileUuid = normalized.profileUuid;
  state.classId = normalized.classId;
  state.entries = [...normalized.entries];
  state.customCards = normalized.customCards.map((card) => normalizeCardDefinition(card, "teacher"));
  state.practiceCategories = normalized.practiceCategories;
  state.syncBaseUrl = normalized.syncBaseUrl;
  state.syncUploadToken = normalized.syncUploadToken;
  state.syncSiteLabel = normalized.syncSiteLabel;
  state.syncStatusNote = normalized.syncStatusNote;
  state.syncState = normalized.syncState;
  state.syncLastSuccessAt = normalized.syncLastSuccessAt;
  state.syncLastError = normalized.syncLastError;
  state.activeFeedbackRound = normalized.activeFeedbackRound;
  state.feedbackAnswers = normalized.feedbackAnswers;
  state.feedbackStatus = normalized.feedbackStatus;
  state.feedbackError = normalized.feedbackError;
}

function isSameStoredProfile(left = {}, right = {}) {
  const leftStorageId = `${left.storageId || ""}`.trim();
  const rightStorageId = `${right.storageId || ""}`.trim();
  const leftProfileUuid = `${left.profileUuid || ""}`.trim();
  const rightProfileUuid = `${right.profileUuid || ""}`.trim();
  const leftStudentId = `${left.studentId || left.appStudentId || ""}`.trim();
  const rightStudentId = `${right.studentId || right.appStudentId || ""}`.trim();

  return Boolean(
    (leftStorageId && rightStorageId && leftStorageId === rightStorageId)
    || (leftProfileUuid && rightProfileUuid && leftProfileUuid === rightProfileUuid)
    || (leftStudentId && rightStudentId && leftStudentId === rightStudentId),
  );
}

function activateStoredProfile(profileId) {
  syncCurrentStateIntoProfileLibrary();
  const nextProfile = state.profileLibrary.find((profile) => profile.storageId === profileId);
  if (!nextProfile) {
    return;
  }

  applyStoredProfile(nextProfile);
  persistState();
}

function profileSwitcherOptions() {
  syncCurrentStateIntoProfileLibrary();
  return state.profileLibrary;
}

function hydrateState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.entries = [...defaultEntries];
      state.studentId = createStudentId();
      state.activeProfileId = state.studentId;
      syncCurrentStateIntoProfileLibrary();
      persistState();
      return;
    }

    const parsed = JSON.parse(raw);
    const legacyProfile = normalizeStoredProfile({
      profileName: parsed.profileName || "Mila",
      instrument: parsed.instrument || instruments[0],
      goal: Number(parsed.goal) || 15,
      studentId: parsed.studentId || createStudentId(),
      studentUuid: parsed.studentUuid || "",
      profileUuid: parsed.profileUuid || "",
      classId: parsed.classId || "",
      entries: Array.isArray(parsed.entries) ? parsed.entries : [...defaultEntries],
      customCards: Array.isArray(parsed.customCards) ? parsed.customCards : [],
      syncBaseUrl: parsed.syncBaseUrl || DEFAULT_SYNC_BASE_URL,
      syncUploadToken: parsed.syncUploadToken || "",
      syncSiteLabel: parsed.syncSiteLabel || "",
      syncStatusNote: parsed.syncStatusNote || "",
      syncState: parsed.syncState || "idle",
      syncLastSuccessAt: parsed.syncLastSuccessAt || "",
      syncLastError: parsed.syncLastError || "",
      practiceCategories: normalizePracticeCategories(parsed.practiceCategories || defaultPracticeCategories),
    });
    state.profileLibrary = Array.isArray(parsed.profileLibrary) && parsed.profileLibrary.length
      ? parsed.profileLibrary.map(normalizeStoredProfile)
      : [legacyProfile];
    state.activeProfileId = parsed.activeProfileId || legacyProfile.storageId;
    applyStoredProfile(
      state.profileLibrary.find((profile) => profile.storageId === state.activeProfileId)
      || state.profileLibrary[0]
      || legacyProfile,
    );
  } catch {
    state.entries = [...defaultEntries];
    state.studentId = createStudentId();
    state.customCards = [];
    state.activeProfileId = state.studentId;
    state.profileLibrary = [currentProfileSnapshot()];
  }
}

function persistState() {
  syncCurrentStateIntoProfileLibrary();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      entries: state.entries,
      instrument: state.instrument,
      profileName: state.profileName,
      studentId: state.studentId,
      studentUuid: state.studentUuid,
      profileUuid: state.profileUuid,
      classId: state.classId,
      goal: state.goal,
      practiceCategories: state.practiceCategories,
      syncBaseUrl: state.syncBaseUrl,
      syncUploadToken: state.syncUploadToken,
      syncSiteLabel: state.syncSiteLabel,
      syncStatusNote: state.syncStatusNote,
      syncState: state.syncState,
      syncLastSuccessAt: state.syncLastSuccessAt,
      syncLastError: state.syncLastError,
      customCards: state.customCards,
      profileLibrary: state.profileLibrary,
      activeProfileId: state.activeProfileId,
    }),
  );
}

function exportBackupPayload() {
  syncCurrentStateIntoProfileLibrary();
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "FleißTakt",
    version: state.versionInfo.appVersion,
    data: {
      entries: state.entries,
      instrument: state.instrument,
      profileName: state.profileName,
      studentId: state.studentId,
      studentUuid: state.studentUuid,
      profileUuid: state.profileUuid,
      classId: state.classId,
      goal: state.goal,
      reportRange: state.reportRange,
      practiceCategories: state.practiceCategories,
      syncBaseUrl: state.syncBaseUrl,
      syncUploadToken: state.syncUploadToken,
      syncSiteLabel: state.syncSiteLabel,
      syncStatusNote: state.syncStatusNote,
      syncState: state.syncState,
      syncLastSuccessAt: state.syncLastSuccessAt,
      syncLastError: state.syncLastError,
      customCards: state.customCards,
      profileLibrary: state.profileLibrary,
      activeProfileId: state.activeProfileId,
    },
  };

  return {
    ...payload,
    checksum: createBackupChecksum(payload),
  };
}

function createBackupFileName() {
  return `fleisstakt-backup-${createDateStamp()}.json`;
}

function createBackupFileContent() {
  return JSON.stringify(exportBackupPayload(), null, 2);
}

async function shareDeviceMoveBackup() {
  const filename = createBackupFileName();
  const content = createBackupFileContent();
  const file = new File([content], filename, { type: "application/json" });

  if (!navigator.share) {
    throw new Error("teilen-nicht-verfuegbar");
  }

  if (navigator.canShare && !navigator.canShare({ files: [file] })) {
    throw new Error("datei-teilen-nicht-verfuegbar");
  }

  await navigator.share({
    title: "FleißTakt Gerätewechsel",
    text: "Diese Datei auf dem neuen Gerät in FleißTakt importieren, damit Lernenden-ID und Verlauf erhalten bleiben.",
    files: [file],
  });
}

async function importBackupFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const checksum = parsed?.checksum;
  const payload = parsed?.data ? { exportedAt: parsed.exportedAt, app: parsed.app, version: parsed.version, data: parsed.data } : null;

  if (!payload || !checksum || createBackupChecksum(payload) !== checksum) {
    throw new Error("ungueltige-pruefsumme");
  }

  const backup = payload.data;

  if (!Array.isArray(backup.entries)) {
    throw new Error("ungueltiges-backup");
  }

  state.entries = backup.entries;
  state.instrument = backup.instrument || instruments[0];
  state.profileName = backup.profileName || "Mila";
  state.studentId = backup.studentId || state.studentId || createStudentId();
  state.studentUuid = backup.studentUuid || "";
  state.profileUuid = backup.profileUuid || "";
  state.classId = backup.classId || "";
  state.goal = Number(backup.goal) || 15;
  state.reportRange = backup.reportRange || "week";
  state.profileLibrary = Array.isArray(backup.profileLibrary) && backup.profileLibrary.length
    ? backup.profileLibrary.map(normalizeStoredProfile)
    : [normalizeStoredProfile({
        profileName: backup.profileName || "Mila",
      instrument: backup.instrument || instruments[0],
      goal: Number(backup.goal) || 15,
        studentId: backup.studentId || state.studentId || createStudentId(),
        studentUuid: backup.studentUuid || "",
        profileUuid: backup.profileUuid || "",
        classId: backup.classId || "",
        entries: backup.entries,
        customCards: backup.customCards,
      syncBaseUrl: backup.syncBaseUrl || DEFAULT_SYNC_BASE_URL,
      syncUploadToken: backup.syncUploadToken || "",
      syncSiteLabel: backup.syncSiteLabel || "",
      syncStatusNote: backup.syncStatusNote || "",
      syncState: backup.syncState || "idle",
      syncLastSuccessAt: backup.syncLastSuccessAt || "",
      syncLastError: backup.syncLastError || "",
      practiceCategories: normalizePracticeCategories(backup.practiceCategories || defaultPracticeCategories),
      })];
  state.activeProfileId = backup.activeProfileId || state.profileLibrary[0]?.storageId || "";
  applyStoredProfile(
    state.profileLibrary.find((profile) => profile.storageId === state.activeProfileId)
    || state.profileLibrary[0],
  );
  persistState();
}

function parseCardPackage(text) {
  const parsed = JSON.parse(text);
  const checksum = parsed?.checksum;
  const payload = parsed?.kind
    ? {
        kind: parsed.kind,
        exportedAt: parsed.exportedAt,
        appVersion: parsed.appVersion,
        targetStudentIds: parsed.targetStudentIds,
        cards: parsed.cards,
      }
    : null;

  if (!payload || payload.kind !== "fleisstakt-kartenpaket") {
    throw new Error("ungueltiges-kartenpaket");
  }

  if (!checksum || createBackupChecksum(payload) !== checksum) {
    throw new Error("ungueltige-pruefsumme");
  }

  if (!Array.isArray(payload.cards)) {
    throw new Error("ungueltiges-kartenpaket");
  }

  if (
    Array.isArray(payload.targetStudentIds) &&
    payload.targetStudentIds.length &&
    !payload.targetStudentIds.includes(state.studentId)
  ) {
    throw new Error("falsche-lernenden-id");
  }

  return payload;
}

async function importCardPackage(file) {
  const payload = parseCardPackage(await file.text());
  const cardMap = new Map(state.customCards.map((card) => [card.id, card]));

  payload.cards.forEach((card) => {
    const normalized = normalizeCardDefinition(card, "teacher");
    cardMap.set(normalized.id, normalized);
  });

  state.customCards = [...cardMap.values()].sort((a, b) => a.title.localeCompare(b.title, "de"));
  persistState();
}

function parseProfilePackage(text) {
  const parsed = JSON.parse(text);
  const checksum = parsed?.checksum;
  const payload = parsed?.kind
    ? {
        kind: parsed.kind,
        issuedAt: parsed.issuedAt,
        siteLabel: parsed.siteLabel,
        syncBaseUrl: parsed.syncBaseUrl,
        studentUuid: parsed.studentUuid,
        profileUuid: parsed.profileUuid,
        appStudentId: parsed.appStudentId,
        uploadToken: parsed.uploadToken,
        connectCode: parsed.connectCode,
        displayName: parsed.displayName,
        instrument: parsed.instrument,
        goal: parsed.goal,
        profileLabel: parsed.profileLabel,
        classId: parsed.classId,
        className: parsed.className,
      }
    : null;

  if (!payload || payload.kind !== "fleisstakt-profile-paket") {
    throw new Error("ungueltiges-profilpaket");
  }

  if (!checksum || createBackupChecksum(payload) !== checksum) {
    throw new Error("ungueltige-pruefsumme");
  }

  if (!payload.appStudentId || !payload.uploadToken || !payload.syncBaseUrl) {
    throw new Error("ungueltiges-profilpaket");
  }

  return payload;
}

function applyProfilePackagePayload(payload, options = {}) {
  const {
    activateProfileScreen = true,
    closeSettings = true,
  } = options;
  syncCurrentStateIntoProfileLibrary();
  const nextProfile = normalizeStoredProfile({
    storageId: payload.profileUuid || payload.appStudentId,
    profileName: payload.displayName || "Mila",
    profileLabel: payload.profileLabel || payload.instrument || "Profil",
    instrument: payload.instrument || instruments[0],
    goal: Number(payload.goal) || 15,
    studentId: payload.appStudentId,
    studentUuid: payload.studentUuid || "",
    profileUuid: payload.profileUuid || "",
    classId: payload.classId || "",
    entries: [],
    customCards: [],
    syncBaseUrl: payload.syncBaseUrl,
    syncUploadToken: payload.uploadToken,
    syncSiteLabel: payload.siteLabel || "",
  });
  const existingIndex = state.profileLibrary.findIndex((profile) => isSameStoredProfile(profile, nextProfile));
  const existingProfile = existingIndex >= 0
    ? state.profileLibrary[existingIndex]
    : isSameStoredProfile(currentProfileSnapshot(), nextProfile)
      ? currentProfileSnapshot()
      : null;

  const mergedProfile = existingProfile
    ? normalizeStoredProfile({
        ...existingProfile,
        ...nextProfile,
        storageId: nextProfile.storageId || existingProfile.storageId,
        entries: Array.isArray(existingProfile.entries) ? existingProfile.entries : [],
        customCards: Array.isArray(existingProfile.customCards) ? existingProfile.customCards : [],
        practiceCategories: Array.isArray(existingProfile.practiceCategories) && existingProfile.practiceCategories.length
          ? existingProfile.practiceCategories
          : nextProfile.practiceCategories,
        activeFeedbackRound: existingProfile.activeFeedbackRound || nextProfile.activeFeedbackRound,
        feedbackAnswers: existingProfile.feedbackAnswers || nextProfile.feedbackAnswers,
        feedbackStatus: existingProfile.feedbackStatus || nextProfile.feedbackStatus,
        feedbackError: existingProfile.feedbackError || nextProfile.feedbackError,
      })
    : nextProfile;

  if (existingIndex >= 0) {
    state.profileLibrary[existingIndex] = mergedProfile;
  } else {
    state.profileLibrary = [...state.profileLibrary, mergedProfile];
  }

  applyStoredProfile(mergedProfile);
  if (activateProfileScreen) {
    state.activeScreen = "profile";
    state.profilePanel = "profil";
  }
  if (closeSettings) {
    state.settingsOpen = false;
    state.settingsFocusId = "";
  }
  state.profileImportConfirmOpen = false;
  state.pendingProfileImport = null;
  applyModalScrollLock();
  persistState();
}

async function importProfilePackage(file) {
  const payload = parseProfilePackage(await file.text());
  applyProfilePackagePayload(payload);
  return "imported";
}

async function uploadCurrentReportPackage() {
  if (!state.syncUploadToken) {
    throw new Error("fehlendes-upload-token");
  }

  const payload = exportReportPackagePayload();
  const response = await fetch(`${state.syncBaseUrl}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-FleissTakt-Upload-Token": state.syncUploadToken,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "upload-fehlgeschlagen");
  }
  return data;
}

async function connectProfileWithServer(appStudentId, connectCode) {
  const normalizedStudentId = `${appStudentId || ""}`.trim();
  const normalizedConnectCode = `${connectCode || ""}`.replace(/\D+/g, "").slice(0, 8);
  if (!normalizedStudentId || !normalizedConnectCode) {
    throw new Error("Bitte Lernenden-ID und Verbindungscode eingeben.");
  }

  const response = await fetch(`${state.syncBaseUrl}/connect-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appStudentId: normalizedStudentId,
      connectCode: normalizedConnectCode,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.snapshot) {
    throw new Error(data?.message || "kopplung-fehlgeschlagen");
  }
  return data.snapshot;
}

async function fetchStudentSyncSnapshot() {
  if (!state.syncUploadToken) {
    throw new Error("fehlendes-upload-token");
  }

  const response = await fetch(`${state.syncBaseUrl}/student-sync`, {
    method: "GET",
    headers: {
      "X-FleissTakt-Upload-Token": state.syncUploadToken,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.snapshot) {
    throw new Error(data?.message || "sync-fehlgeschlagen");
  }
  return data.snapshot;
}

async function syncStudentAppWithServer() {
  const uploadResult = await uploadCurrentReportPackage();
  const snapshot = await fetchStudentSyncSnapshot();
  importStudentSyncSnapshot(snapshot);
  return {
    uploadResult,
    snapshot,
  };
}

function importStudentSyncSnapshot(snapshot) {
  if (snapshot?.profile) {
    applyProfilePackagePayload(snapshot.profile, {
      activateProfileScreen: false,
      closeSettings: false,
    });
  }

  if (Array.isArray(snapshot?.categories)) {
    state.practiceCategories = normalizePracticeCategories(snapshot.categories);
    if (!state.practiceCategories.includes(state.category)) {
      state.category = state.practiceCategories[0] || state.category;
    }
  }

  state.customCards = Array.isArray(snapshot?.cards)
    ? snapshot.cards
        .map((card) => normalizeCardDefinition(card, "teacher"))
        .sort((a, b) => a.title.localeCompare(b.title, "de"))
    : [];

  state.activeFeedbackRound = normalizeFeedbackRound(snapshot?.activeFeedbackRound);
  if (!state.activeFeedbackRound) {
    state.feedbackStatus = "idle";
    state.feedbackAnswers = {};
    state.feedbackError = "";
  } else if (state.activeFeedbackRound.alreadyAnswered) {
    state.feedbackStatus = "answered";
    state.feedbackAnswers = {};
    state.feedbackError = "";
  } else {
    const allowedIds = new Set(state.activeFeedbackRound.questions.map((question) => String(question.id)));
    state.feedbackAnswers = Object.fromEntries(
      Object.entries(state.feedbackAnswers || {}).filter(([key]) => allowedIds.has(String(key))),
    );
    state.feedbackStatus = Object.keys(state.feedbackAnswers).length ? "ready" : "idle";
    state.feedbackError = "";
  }

    setStudentSyncState("ok", "Profil, Kärtchen und Serverdaten sind aktuell.", { markSuccess: true });

  persistState();
}

function feedbackCompletionCount() {
  return state.activeFeedbackRound?.questions.filter((question) => state.feedbackAnswers?.[question.id]).length || 0;
}

function feedbackReadyToSubmit() {
  const round = state.activeFeedbackRound;
  if (!round || round.alreadyAnswered) {
    return false;
  }
  return round.questions.every((question) => Number(state.feedbackAnswers?.[question.id]) >= 1);
}

async function submitFeedbackResponse() {
  const round = state.activeFeedbackRound;
  if (!round || round.alreadyAnswered || !round.ballotToken) {
    throw new Error("feedback-nicht-verfuegbar");
  }
  if (!feedbackReadyToSubmit()) {
    throw new Error("feedback-unvollstaendig");
  }

  const response = await fetch(`${state.syncBaseUrl}/feedback-response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roundId: round.roundId,
      ballotToken: round.ballotToken,
      answers: round.questions.map((question) => ({
        questionId: question.id,
        value: Number(state.feedbackAnswers?.[question.id]) || 0,
      })),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "feedback-fehlgeschlagen");
  }
  return data;
}

async function runBackgroundStudentSync() {
  if (!state.syncUploadToken) {
    return;
  }

  if (studentSyncInProgress) {
    studentAutoSyncPending = true;
    return;
  }

  studentSyncInProgress = true;
  setStudentSyncState("running", "Änderungen gespeichert. Server-Sync läuft im Hintergrund...");
  persistState();
  render();

  try {
    do {
      studentAutoSyncPending = false;
      await syncStudentAppWithServer();
    } while (studentAutoSyncPending);
  } catch {
    setStudentSyncState("error", "Änderungen gespeichert. Server-Sync ausstehend.");
    persistState();
    render();
  } finally {
    studentSyncInProgress = false;
  }
}

function parseConnectionPayload(value) {
  const raw = `${value || ""}`.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const studentId = `${parsed?.studentId || parsed?.appStudentId || ""}`.trim();
    const connectCode = `${parsed?.connectCode || parsed?.code || ""}`.replace(/\D+/g, "").slice(0, 8);
    const syncBaseUrl = `${parsed?.syncBaseUrl || parsed?.server || ""}`.trim();
    if (studentId && connectCode) {
      return {
        studentId,
        connectCode,
        syncBaseUrl: syncBaseUrl ? normalizeSyncBaseUrl(syncBaseUrl) : "",
      };
    }
  } catch {}

  try {
    const url = new URL(raw);
    const studentId = `${url.searchParams.get("studentId") || url.searchParams.get("appStudentId") || ""}`.trim();
    const connectCode = `${url.searchParams.get("code") || url.searchParams.get("connectCode") || ""}`.replace(/\D+/g, "").slice(0, 8);
    const syncBaseUrl = `${url.searchParams.get("server") || url.searchParams.get("syncBaseUrl") || ""}`.trim();
    if (studentId && connectCode) {
      return {
        studentId,
        connectCode,
        syncBaseUrl: syncBaseUrl ? normalizeSyncBaseUrl(syncBaseUrl) : "",
      };
    }
  } catch {}

  const studentMatch = raw.match(/Lernenden-ID:\s*([^\n\r]+)/i);
  const codeMatch = raw.match(/Verbindungscode:\s*([0-9]{4,8})/i);
  const serverMatch = raw.match(/Server:\s*(https?:\/\/[^\s]+)/i);
  if (studentMatch?.[1] && codeMatch?.[1]) {
    return {
      studentId: studentMatch[1].trim(),
      connectCode: codeMatch[1].trim(),
      syncBaseUrl: serverMatch?.[1] ? normalizeSyncBaseUrl(serverMatch[1].trim()) : "",
    };
  }

  return null;
}

function applyConnectionCandidate(candidate) {
  if (!candidate) {
    throw new Error("QR-Code oder Freigabe konnte nicht als Kopplung erkannt werden.");
  }

  if (candidate.syncBaseUrl) {
    state.syncBaseUrl = normalizeSyncBaseUrl(candidate.syncBaseUrl);
  }
  state.connectStudentIdDraft = candidate.studentId;
  state.connectCodeDraft = candidate.connectCode;

  const studentIdField = document.querySelector("#connect-student-id");
  const codeField = document.querySelector("#connect-code");
  if (studentIdField) {
    studentIdField.value = candidate.studentId;
  }
  if (codeField) {
    codeField.value = candidate.connectCode;
  }

  return {
    studentId: candidate.studentId,
    connectCode: candidate.connectCode,
  };
}

function stopQrScanner() {
  qrScanAbort = true;
  window.cancelAnimationFrame(qrScannerFrameHandle);
  window.clearTimeout(scannerRetryHandle);
  qrScannerFrameHandle = 0;
  scannerRetryHandle = 0;
  if (qrScannerStream) {
    qrScannerStream.getTracks().forEach((track) => track.stop());
    qrScannerStream = null;
  }
}

function closeScannerDialog() {
  stopQrScanner();
  state.scannerOpen = false;
  state.scannerMessage = "";
  state.scannerState = "idle";
  state.settingsOpen = true;
  state.settingsFocusId = "connect-profile-button";
  applyModalScrollLock();
  render();
}

async function handleScannedConnectionPayload(rawValue) {
  const candidate = parseConnectionPayload(rawValue);
  const connection = applyConnectionCandidate(candidate);
  closeScannerDialog();
  return connectProfileFlow(connection.studentId, connection.connectCode);
}

async function scanConnectionImageFile(file) {
  if (!("BarcodeDetector" in window)) {
    throw new Error("QR-Erkennung aus Bildern wird auf diesem Gerät gerade nicht unterstützt.");
  }
  const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  const bitmap = await createImageBitmap(file);
  try {
    const codes = await detector.detect(bitmap);
    const rawValue = `${codes?.[0]?.rawValue || ""}`.trim();
    if (!rawValue) {
      throw new Error("Kein QR-Code im ausgewählten Bild gefunden.");
    }
    await handleScannedConnectionPayload(rawValue);
  } finally {
    bitmap.close?.();
  }
}

async function startQrScanner() {
  if (!scannerSupported()) {
    state.scannerState = "error";
    state.scannerMessage = "Die Kamera-QR-Erkennung wird auf diesem Gerät gerade nicht unterstützt. Du kannst stattdessen ID und Code eintippen oder ein Bild mit QR-Code auswählen.";
    render();
    return;
  }

  stopQrScanner();
  qrScanAbort = false;
  state.scannerState = "active";
  state.scannerMessage = "Kamera wird gestartet...";
  render();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: "environment" },
    },
  });
  qrScannerStream = stream;
  render();

  const video = document.querySelector("#connect-qr-video");
  if (!video) {
    return;
  }

  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  await video.play().catch(() => {});
  state.scannerState = "active";
  state.scannerMessage = "Halte den QR-Code aus der Lehrkräfte-App in den markierten Bereich.";
  render();

  const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  const tick = async () => {
    if (qrScanAbort || !state.scannerOpen) {
      return;
    }

    try {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const codes = await detector.detect(video);
        const rawValue = `${codes?.[0]?.rawValue || ""}`.trim();
        if (rawValue) {
          await handleScannedConnectionPayload(rawValue);
          return;
        }
      }
    } catch {
      state.scannerState = "error";
      state.scannerMessage = "Die Kamera läuft, aber der QR-Code konnte gerade nicht gelesen werden.";
      render();
    }

    qrScannerFrameHandle = window.requestAnimationFrame(tick);
  };

  qrScannerFrameHandle = window.requestAnimationFrame(tick);
}

function openScannerDialog() {
  state.settingsOpen = false;
  state.settingsFocusId = "";
  state.scannerOpen = true;
  state.scannerState = "idle";
  state.scannerMessage = scannerSupported()
    ? "Kamera wird vorbereitet..."
    : "Dieses Gerät unterstützt die direkte Kameraerkennung gerade nicht vollständig.";
  applyModalScrollLock();
  render();
}

function applyConnectionFromUrl() {
  const candidate = parseConnectionPayload(window.location.href);
  if (!candidate) {
    return;
  }

  if (candidate.syncBaseUrl) {
    state.syncBaseUrl = normalizeSyncBaseUrl(candidate.syncBaseUrl);
  }
  state.connectStudentIdDraft = candidate.studentId;
  state.connectCodeDraft = candidate.connectCode;

  state.settingsOpen = true;
  state.settingsFocusId = "connect-profile-button";
  state.celebrationText = "Kopplungsdaten aus Link oder QR übernommen. Bitte jetzt verbinden.";
  state.celebrate = true;

  const url = new URL(window.location.href);
  url.searchParams.delete("connect");
  url.searchParams.delete("studentId");
  url.searchParams.delete("appStudentId");
  url.searchParams.delete("code");
  url.searchParams.delete("connectCode");
  url.searchParams.delete("server");
  url.searchParams.delete("syncBaseUrl");
  window.history.replaceState({}, "", url.toString());
}

function resetStudentAppForTesting() {
  const nextStudentId = createStudentId();
  state.activeScreen = "profile";
  state.minutes = 20;
  state.instrument = instruments[0];
  state.practiceCategories = [...defaultPracticeCategories];
  state.category = state.practiceCategories[0];
  state.note = "";
  state.profileName = "Neustart";
  state.studentId = nextStudentId;
  state.studentUuid = "";
  state.profileUuid = "";
  state.classId = "";
  state.entries = [];
  state.customCards = [];
  state.syncBaseUrl = DEFAULT_SYNC_BASE_URL;
  state.syncUploadToken = "";
  state.syncSiteLabel = "";
  state.syncStatusNote = "";
  state.syncState = "idle";
  state.syncLastSuccessAt = "";
  state.syncLastError = "";
  state.activeFeedbackRound = null;
  state.feedbackAnswers = {};
  state.feedbackStatus = "idle";
  state.feedbackError = "";
  state.profilePanel = "profil";
  state.goal = 15;
  state.reportRange = "week";
  state.connectStudentIdDraft = "";
  state.connectCodeDraft = "";
  state.activeProfileId = nextStudentId;
  state.profileLibrary = [
    normalizeStoredProfile({
      storageId: nextStudentId,
      profileName: state.profileName,
      profileLabel: "Profil",
      instrument: state.instrument,
      goal: state.goal,
      studentId: nextStudentId,
      entries: [],
      customCards: [],
      syncBaseUrl: state.syncBaseUrl,
      syncUploadToken: "",
      syncSiteLabel: "",
    }),
  ];
  state.settingsOpen = false;
  state.settingsFocusId = "";
  state.helpOpen = false;
  state.profileImportConfirmOpen = false;
  state.resetConfirmOpen = false;
  state.resetFinalConfirmOpen = false;
  state.pendingProfileImport = null;
  window.localStorage.removeItem(STORAGE_KEY);
  persistState();
}

async function connectProfileFlow(studentId, connectCode) {
  openSyncStatus("Mit Lehrkraft verbinden", [
    { id: "connect", label: "Profil über Lernenden-ID und Verbindungscode anfragen" },
    { id: "apply", label: "Profil, Ziele und Server-Kontext übernehmen" },
  ]);

  try {
    updateSyncStatus("connect", "running", "Verbindung zum FleißTakt-Server wird aufgebaut...");
    const snapshot = await connectProfileWithServer(studentId, connectCode);
    updateSyncStatus("connect", "done", "Profil wurde gefunden. Daten werden jetzt übernommen...");

    updateSyncStatus("apply", "running", "Profil und Kärtchen werden auf dem Gerät gespeichert...");
    importStudentSyncSnapshot(snapshot);
    state.settingsOpen = false;
    state.settingsFocusId = "";
    state.connectStudentIdDraft = state.studentId;
    state.connectCodeDraft = "";
    setStudentSyncState("ok", "Unterricht verbunden. Der nächste Eintrag wird automatisch mit dem Server abgeglichen.", { markSuccess: true });
    state.activeScreen = "profile";
    state.profilePanel = "profil";
    applyModalScrollLock();
    updateSyncStatus("apply", "done", "Der Unterricht ist jetzt verbunden.");
    finishSyncStatus("success", `Unterricht ${state.profileName} wurde erfolgreich verbunden.`, true);
    state.celebrationText = `Profil ${state.profileName} verbunden.`;
  } catch (error) {
    const runningStep = state.syncStatusSteps.find((step) => step.state === "running");
    if (runningStep) {
      updateSyncStatus(runningStep.id, "error");
    }
    setStudentSyncState("error", error?.message || "Verbindung zur Lehrkraft gerade nicht möglich.");
    finishSyncStatus("error", error?.message || "Verbindung zur Lehrkraft gerade nicht möglich.");
    state.celebrationText = error?.message || "Verbindung zur Lehrkraft gerade nicht möglich.";
  }

  state.celebrate = true;
  render();
  window.setTimeout(() => {
    state.celebrate = false;
    render();
  }, 2200);
}

function createBackupChecksum(payload) {
  const normalized = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(normalized);
  let hash = 2166136261;

  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 16777619);
  }

  return `ft-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function exportReportPackagePayload() {
  const report = getReportData(state.reportRange);
  const reportUuid = `report-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    kind: "fleisstakt-berichtspaket",
    reportUuid,
    exportedAt: new Date().toISOString(),
    appVersion: state.versionInfo.appVersion,
    student: {
      studentId: state.studentId,
      displayName: state.profileName,
      instrument: state.instrument,
      goal: state.goal,
    },
    report: {
      range: report.range,
      label: report.label,
      minutes: report.minutes,
      uniqueDaysCount: report.uniqueDaysCount,
      notedCount: report.notedCount,
      streak: report.stats.streak,
      unlockedCards: report.unlockedCards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        source: card.source,
      })),
      entries: report.entries.map((entry) => ({ ...entry })),
    },
  };

  return {
    ...payload,
    checksum: createBackupChecksum(payload),
  };
}

function createReportPackageFileName() {
  const safeName = state.profileName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "") || "lernende";
  return `fleisstakt-berichtspaket-${safeName}-${createDateStamp()}.json`;
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function describeRule(rule) {
  if (rule.type === "none") {
    return "Keine Zielbedingung";
  }
  if (rule.type === "streakAtLeast") {
    return `${rule.value} Tage in Folge geübt`;
  }
  if (rule.type === "dayMinutesAtLeast") {
    return `${rule.value} Minuten an einem Tag`;
  }

  if (rule.type === "weekMinutesAtLeast") {
    return `${rule.value} Minuten in einer Woche`;
  }

  if (rule.type === "monthMinutesAtLeast") {
    return `${rule.value} Minuten in einem Monat`;
  }

  if (rule.type === "notedEntriesAtLeast") {
    return `${rule.value} Einträge mit Notiz`;
  }

  if (rule.type === "categoryUsed") {
    return `${rule.value} Einträge in ${rule.category || "einer Kategorie"}`;
  }

  if (rule.type === "categoriesCountAtLeast") {
    return `${rule.value} verschiedene Kategorien genutzt`;
  }

  if (rule.type === "morningEntryOnce") {
    return "Vor 8 Uhr geübt";
  }

  if (rule.type === "entriesCountAtLeast") {
    return `${rule.value} Einträge gespeichert`;
  }

  if (rule.type === "weekEntriesAtLeast") {
    return `${rule.value} Einträge in einer Woche`;
  }

  if (rule.type === "daysPracticedAtLeast") {
    return `${rule.value} Übetage gesammelt`;
  }

  return "Neue Gewohnheit freischalten";
}

function getActiveCardDefinitions() {
  const teacherCards = state.customCards
    .map((card) => normalizeCardDefinition(card, "teacher"))
    .filter((card) => card.status === "active")
    .filter((card) => isCardAssignedToCurrentProfile(card));

  if (state.syncUploadToken) {
    return teacherCards;
  }

  return [
    ...standardCardDefinitions.map((card) => normalizeCardDefinition(card, "core")),
    ...teacherCards,
  ];
}

function isCardAssignedToCurrentProfile(card) {
  if (card.source === "core") {
    return true;
  }

  if (card.assignment?.type === "class") {
    return Boolean(state.classId) && card.assignment.targetId === state.classId;
  }

  if (card.assignment?.type === "student") {
    return card.assignment.targetId === state.studentId;
  }

  return true;
}

function getRuleMetric(rule, stats) {
  if (rule.type === "none") {
    return 0;
  }
  if (rule.type === "streakAtLeast") {
    return stats.streak;
  }

  if (rule.type === "dayMinutesAtLeast") {
    return stats.todayMinutes;
  }

  if (rule.type === "weekMinutesAtLeast") {
    return stats.weekMinutes;
  }

  if (rule.type === "monthMinutesAtLeast") {
    return stats.monthMinutes;
  }

  if (rule.type === "notedEntriesAtLeast") {
    return stats.notedEntryCount;
  }

  if (rule.type === "categoryUsed") {
    return Number(stats.categoryCounts?.[rule.category] || 0);
  }

  if (rule.type === "categoriesCountAtLeast") {
    return stats.usedCategoriesCount;
  }

  if (rule.type === "morningEntryOnce") {
    return stats.hasMorningEntry ? 1 : 0;
  }

  if (rule.type === "entriesCountAtLeast") {
    return stats.entryCount;
  }

  if (rule.type === "weekEntriesAtLeast") {
    return stats.weekEntryCount;
  }

  if (rule.type === "daysPracticedAtLeast") {
    return stats.practicedDaysCount;
  }

  return 0;
}

function isCardUnlocked(card, stats) {
  if (card.rule.type === "none") {
    return false;
  }
  const metric = getRuleMetric(card.rule, stats);
  return metric >= card.rule.value;
}

function cardProgressPercent(card, stats) {
  if (card.rule.type === "none") {
    return 0;
  }
  const metric = getRuleMetric(card.rule, stats);
  return Math.min(100, Math.round((metric / card.rule.value) * 100));
}

function cardProgressText(card, stats) {
  if (card.rule.type === "none") {
    return "Dieses Kärtchen wird direkt von der Lehrkraft verliehen.";
  }
  const metric = getRuleMetric(card.rule, stats);
  const value = Math.min(metric, card.rule.value);

  if (card.rule.type === "streakAtLeast") {
    return `${value}/${card.rule.value} Tage Serie`;
  }

  if (card.rule.type === "dayMinutesAtLeast") {
    return `${value}/${card.rule.value} Minuten heute`;
  }

  if (card.rule.type === "weekMinutesAtLeast") {
    return `${value}/${card.rule.value} Minuten diese Woche`;
  }

  if (card.rule.type === "monthMinutesAtLeast") {
    return `${value}/${card.rule.value} Minuten in diesem Monat`;
  }

  if (card.rule.type === "notedEntriesAtLeast") {
    return `${value}/${card.rule.value} Einträge mit Notiz`;
  }

  if (card.rule.type === "categoryUsed") {
    return `${value}/${card.rule.value} Einträge in ${card.rule.category || "dieser Kategorie"}`;
  }

  if (card.rule.type === "categoriesCountAtLeast") {
    return `${value}/${card.rule.value} Kategorien genutzt`;
  }

  if (card.rule.type === "morningEntryOnce") {
    return metric ? "Vor 8 Uhr geschafft" : "Ein Morgen-Eintrag fehlt noch";
  }

  if (card.rule.type === "entriesCountAtLeast") {
    return `${value}/${card.rule.value} Einträge gespeichert`;
  }

  if (card.rule.type === "weekEntriesAtLeast") {
    return `${value}/${card.rule.value} Einträge diese Woche`;
  }

  if (card.rule.type === "daysPracticedAtLeast") {
    return `${value}/${card.rule.value} Übetage gesammelt`;
  }

  return describeRule(card.rule);
}

function getStats() {
  const entries = [...state.entries].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const today = getTodayKey();
  const last7Days = new Set();
  const weekTimeline = [];

  for (let offset = 4; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = formatDateKey(date);
    last7Days.add(key);
    weekTimeline.push({
      key,
      day: date.toLocaleDateString("de-DE", { weekday: "short" }).slice(0, 2),
      minutes: 0,
      task: "Pause",
    });
  }

  const weeklyEntries = entries.filter((entry) => {
    const diff = Math.floor((new Date(`${today}T12:00:00`) - new Date(`${entry.date}T12:00:00`)) / 86400000);
    return diff >= 0 && diff < 7;
  });

  weekTimeline.forEach((day) => {
    const dayEntries = entries.filter((entry) => entry.date === day.key);
    const totalMinutes = dayEntries.reduce((sum, entry) => sum + entry.minutes, 0);
    const latestEntry = dayEntries[0];
    day.minutes = totalMinutes;
    day.task = latestEntry ? latestEntry.category : "Pause";
  });

  const practicedDays = [...new Set(entries.map((entry) => entry.date))].sort().reverse();
  let streak = 0;
  let cursor = new Date(`${today}T12:00:00`);

  while (practicedDays.includes(formatDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const todayMinutes = entries
    .filter((entry) => entry.date === today)
    .reduce((sum, entry) => sum + entry.minutes, 0);

  const weekMinutes = weeklyEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const monthStart = new Date(new Date(`${today}T12:00:00`).getFullYear(), new Date(`${today}T12:00:00`).getMonth(), 1, 12, 0, 0, 0);
  const monthlyEntries = entries.filter((entry) => new Date(`${entry.date}T12:00:00`) >= monthStart);
  const monthMinutes = monthlyEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const notedEntryCount = entries.filter((entry) => entry.note.trim()).length;
  const hasMorningEntry = entries.some((entry) => new Date(entry.savedAt).getHours() < 8);
  const practicedDaysCount = new Set(entries.map((entry) => entry.date)).size;
  const categoryCounts = entries.reduce((map, entry) => {
    map[entry.category] = (map[entry.category] || 0) + 1;
    return map;
  }, {});
  const usedCategoriesCount = Object.keys(categoryCounts).length;

  return {
    entries,
    weekTimeline,
    streak,
    todayMinutes,
    weekMinutes,
    monthMinutes,
    notedEntryCount,
    hasMorningEntry,
    entryCount: entries.length,
    practicedDaysCount,
    weekEntryCount: weeklyEntries.length,
    categoryCounts,
    usedCategoriesCount,
  };
}

function getReportRangeOptions() {
  return [
    { id: "week", label: "Woche" },
    { id: "month", label: "Monat" },
    { id: "all", label: "Gesamt" },
  ];
}

function getReportData(range) {
  const stats = getStats();
  const today = new Date(`${getTodayKey()}T12:00:00`);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);

  let filteredEntries = stats.entries;
  let label = "Gesamtübersicht";

  if (range === "week") {
    filteredEntries = stats.entries.filter((entry) => {
      const diff = Math.floor((today - new Date(`${entry.date}T12:00:00`)) / 86400000);
      return diff >= 0 && diff < 7;
    });
    label = "Wochenbericht";
  }

  if (range === "month") {
    filteredEntries = stats.entries.filter(
      (entry) => new Date(`${entry.date}T12:00:00`) >= startOfMonth,
    );
    label = "Monatsbericht";
  }

  const minutes = filteredEntries.reduce((sum, entry) => sum + entry.minutes, 0);
  const notedCount = filteredEntries.filter((entry) => entry.note.trim()).length;
  const hasMorningEntry = filteredEntries.some((entry) => new Date(entry.savedAt).getHours() < 8);
  const uniqueDays = [...new Set(filteredEntries.map((entry) => entry.date))];
  const unlockedCards = getCards(stats).filter((card) => card.unlocked);

  return {
    range,
    label,
    entries: filteredEntries,
    minutes,
    notedCount,
    uniqueDaysCount: uniqueDays.length,
    hasMorningEntry,
    unlockedCards,
    stats,
  };
}

function getReportActionLabel() {
  return state.reportRange === "all" ? "Gesamtbericht" : getReportData(state.reportRange).label;
}

function getCards(stats) {
  return getActiveCardDefinitions().map((card) => {
    const manuallyAwarded = card.award?.mode === "manual";
    const unlocked = manuallyAwarded || isCardUnlocked(card, stats);
    const noConditionReward = card.rule.type === "none";
    return {
      ...card,
      manuallyAwarded,
      unlocked,
      statusLabel: manuallyAwarded ? "Verliehen" : unlocked ? "Ge&shy;sam&shy;melt" : noConditionReward ? "Direkt verliehen" : "Bald frei",
      progressPercent: manuallyAwarded ? 100 : cardProgressPercent(card, stats),
      progressText: manuallyAwarded ? "Direkt von der Lehrkraft verliehen" : cardProgressText(card, stats),
    };
  });
}

function nextCardProgress(cards) {
  const lockedCards = cards.filter((card) => !card.unlocked);
  if (!lockedCards.length) {
    return 100;
  }

  return Math.max(...lockedCards.map((card) => card.progressPercent));
}

function nextCardName(cards) {
  const lockedCard = cards.find((card) => !card.unlocked);
  return lockedCard ? lockedCard.title : "Alle Kärtchen gesammelt";
}

function todayScreen() {
  const stats = getStats();
  const cards = getCards(stats);
  const progress = nextCardProgress(cards);
  const unlockedCount = cards.filter((card) => card.unlocked).length;
  const hasManagedProfile = Boolean(state.syncUploadToken);
  const heroTitle = hasManagedProfile
    ? "Üben und Kärtchen im Blick."
    : "Jeder Eintrag bringt ein neues Kärtchen näher.";
  const heroCopy = hasManagedProfile
    ? "Kurz festhalten, was heute gut geklappt hat."
    : "Schnell protokollieren, Serie halten und kleine Erfolgsmomente sammeln.";
  const nextLabel = "Nächstes Kärtchen";

  return `
    <section class="screen screen-today">
      <div class="hero-panel">
        <p class="hero-kicker">Heute im Takt bleiben</p>
        <h2>${heroTitle}</h2>
        <p class="hero-copy">${heroCopy}</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-nav="log">Übung eintragen</button>
          <button class="secondary-button" type="button" data-nav="cards">Kärtchen ansehen</button>
        </div>
      </div>

      <section class="stats-strip stats-strip-primary">
        <div class="stat-pill">
          <p class="label">Heutiges Ziel</p>
          <strong>${state.goal} Minuten</strong>
        </div>
        <div class="stat-pill">
          <p class="label">Serie</p>
          <strong>${stats.streak} Tage</strong>
        </div>
        <div class="stat-pill">
          <p class="label">Diese Woche</p>
          <strong>${stats.weekMinutes} Minuten</strong>
        </div>
      </section>

      <section class="stats-strip stats-strip-secondary">
        <div class="stat-line">
          <p class="label">Heute gespielt</p>
          <strong>${stats.todayMinutes} Minuten</strong>
        </div>
        <div class="stat-line">
          <p class="label">Einträge</p>
          <strong>${stats.entries.length}</strong>
        </div>
        <div class="stat-line">
          <p class="label">Notizen</p>
          <strong>${stats.notedEntryCount}</strong>
        </div>
        <div class="stat-line">
          <p class="label">Kärtchen</p>
          <strong>${unlockedCount}/${cards.length}</strong>
        </div>
      </section>

      <section class="progress-band">
        <div class="progress-copy">
          <p class="label">${nextLabel}</p>
          <strong>${nextCardName(cards)}</strong>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span style="width: ${progress}%"></span>
        </div>
        <p class="progress-note">${progress}% erreicht</p>
      </section>

      <section class="mini-timeline">
        <div class="section-head">
          <h3>Deine Woche</h3>
          <button class="text-button" type="button" data-nav="history">Mehr</button>
        </div>
        <div class="timeline-bars">
          ${stats.weekTimeline
            .map(
              (entry) => `
                <div class="bar-column">
                  <span class="bar-fill" style="height: ${Math.max(entry.minutes * 2.4, 10)}px"></span>
                  <strong>${entry.day}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function logScreen() {
  const categories = getPracticeCategories();
  const hasManagedProfile = Boolean(state.syncUploadToken);
  return `
    <section class="screen screen-log">
      <div class="section-head">
        <h2>Übung eintragen</h2>
        <p>In zwei Schritten erledigt.</p>
      </div>

      <label class="field">
        <span>Instrument</span>
        ${
          hasManagedProfile
            ? `<div class="field-static">${escapeHtml(state.instrument)}</div>
               <small class="field-hint">Dieses Instrument kommt aus dem verbundenen Unterricht.</small>`
            : `<select id="instrument-select">
                ${instruments
                  .map(
                    (item) => `
                      <option value="${item}" ${state.instrument === item ? "selected" : ""}>${item}</option>
                    `,
                  )
                  .join("")}
              </select>`
        }
      </label>

      <label class="field">
        <span>Dauer</span>
        <input id="minutes-range" type="range" min="5" max="60" step="5" value="${state.minutes}" />
        <strong class="range-value" id="minutes-value">${state.minutes} Minuten</strong>
      </label>

      <label class="field">
        <span>Bereich</span>
        <div class="pill-row">
          ${categories
            .map(
              (item) => `
                <button class="pill ${state.category === item ? "is-active" : ""}" type="button" data-category="${item}">
                  ${item}
                </button>
              `,
            )
            .join("")}
        </div>
      </label>

      <label class="field">
        <span>Notiz</span>
        <textarea id="note-input" rows="4" placeholder="Was lief heute besonders gut?">${escapeHtml(state.note)}</textarea>
      </label>

      <button class="primary-button save-button" id="save-entry" type="button">Eintrag speichern</button>
    </section>
  `;
}

function cardsScreen() {
  const stats = getStats();
  const cards = getCards(stats);
  const unlockedCount = cards.filter((card) => card.unlocked).length;
  const hasManagedProfile = Boolean(state.syncUploadToken);
  const heading = "Kärtchen";
  const intro = hasManagedProfile
    ? "Diese Ziele wurden über das Profil der Lehrkräfte-App zugewiesen und beim Server-Sync aktualisiert."
    : "Sammle kleine Etappensiege statt trockener Statistiken.";
  const kicker = hasManagedProfile ? "Zugewiesene Ziele" : "Sammelstand";
  const summary = hasManagedProfile
    ? `${unlockedCount} von ${cards.length} Zielen erreicht`
    : `${unlockedCount} von ${cards.length} gesammelt`;
  const statsLine = hasManagedProfile
    ? `Serie ${stats.streak} Tage · ${stats.weekMinutes} Minuten in dieser Woche`
    : `Serie ${stats.streak} Tage · ${stats.weekMinutes} Minuten in dieser Woche`;
  const emptyState = hasManagedProfile
    ? `
      <article class="reward-card accent-sky is-locked">
        <div class="reward-topline">
          <p class="reward-state">Noch nichts zugewiesen</p>
          <span class="reward-rarity">Sync</span>
        </div>
        <div class="reward-symbol">◎</div>
        <div class="reward-copy">
          <h3>Noch keine Kärtchen</h3>
          <p>Bitte die App mit dem Server synchronisieren oder in der Lehrkräfte-App neue Ziele zuweisen lassen.</p>
          <p class="reward-progress">Sobald Ziele zugewiesen sind, erscheinen sie hier automatisch.</p>
        </div>
      </article>
    `
    : "";

  return `
    <section class="screen screen-cards">
      <div class="section-head">
        <h2>${heading}</h2>
        <p>${intro}</p>
      </div>
      <section class="cards-hero">
        <div class="cards-hero-copy">
          <p class="label">${kicker}</p>
          <h3>${summary}</h3>
          <p>${statsLine}</p>
        </div>
        <div class="album-strip">
          ${cards
            .map(
              (card) => `
                <div class="album-chip ${card.unlocked ? "is-unlocked" : "is-locked"} accent-${card.accent}">
                  <span>${card.symbol}</span>
                  <strong>${card.title}</strong>
                </div>
            `,
          )
          .join("") || (hasManagedProfile ? `<div class="album-chip is-locked accent-sky"><span>◎</span><strong>Warten auf Sync</strong></div>` : "")}
        </div>
      </section>
      <div class="card-grid">
        ${cards.length
          ? cards
          .map(
            (card) => `
              <article class="reward-card accent-${card.accent} ${card.unlocked ? "is-unlocked" : "is-locked"}">
                <div class="reward-topline">
                  <p class="reward-state">${card.statusLabel}</p>
                  <span class="reward-rarity">${card.rarity}</span>
                </div>
                <div class="reward-symbol">${card.symbol}</div>
                <div class="reward-copy">
                  <h3>${card.title}</h3>
                  <p>${card.description}</p>
                  <p class="reward-progress">${card.progressText}</p>
                  ${
                    card.manuallyAwarded
                      ? `
                        <div class="reward-award-note">
                          <span>Direkt verliehen</span>
                          <strong>${card.award?.awardedBy ? `Von ${escapeHtml(card.award.awardedBy)}` : "Von deiner Lehrkraft"}${card.award?.awardedAt ? ` · ${escapeHtml(new Date(card.award.awardedAt).toLocaleDateString("de-DE"))}` : ""}</strong>
                          ${card.award?.note ? `<p>„${escapeHtml(card.award.note)}“</p>` : `<p>Dieses Kärtchen wurde dir persönlich verliehen.</p>`}
                        </div>
                      `
                      : ""
                  }
                </div>
              </article>
            `,
          )
          .join("")
          : emptyState}
      </div>
    </section>
  `;
}

function historyScreen() {
  const stats = getStats();

  return `
    <section class="screen screen-history">
      <div class="section-head">
        <h2>Verlauf</h2>
        <p>Eine ruhige Wochenansicht statt komplizierter Auswertung.</p>
      </div>
      <div class="history-list">
        ${
          stats.entries.length
            ? stats.entries
                .slice(0, 10)
                .map(
                  (entry) => `
              <article class="history-row">
                <div>
                  <strong>${new Date(`${entry.date}T12:00:00`).toLocaleDateString("de-DE", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                  })}</strong>
                  <p>${entry.instrument} · ${entry.category}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</p>
                </div>
                <span>${entry.minutes} min</span>
              </article>
            `,
                )
                .join("")
            : `
              <article class="history-row">
                <div>
                  <strong>Noch leer</strong>
                  <p>Der erste Eintrag taucht hier sofort auf.</p>
                </div>
                <span>0 min</span>
              </article>
            `
        }
      </div>
    </section>
  `;
}

function profileScreen() {
  const stats = getStats();
  const lastEntries = stats.entries.slice(0, 3);
  const reportData = getReportData(state.reportRange);
  const hasManagedProfile = Boolean(state.syncUploadToken);
  const activeTeacherCards = state.customCards.filter((card) => card.status === "active").length;
  const profiles = profileSwitcherOptions();
  const activeProfileLabel = profiles.find((profile) => profile.storageId === state.activeProfileId)?.profileLabel || state.instrument || "Profil";
  const syncSummary = describeStudentSyncState();

  return `
    <section class="screen screen-profile">
      <div class="section-head">
        <h2>Profil</h2>
        <p>Profil für Lernende und eine ruhige Sicht für Eltern oder Lehrkraft.</p>
      </div>
      <div class="pill-row">
        <button class="pill ${state.profilePanel === "profil" ? "is-active" : ""}" type="button" data-panel="profil">
          Profil
        </button>
        <button class="pill ${state.profilePanel === "begleitung" ? "is-active" : ""}" type="button" data-panel="begleitung">
          Begleitung
        </button>
        <button class="pill ${state.profilePanel === "feedback" ? "is-active" : ""}" type="button" data-panel="feedback">
          Feedback
        </button>
      </div>
      ${
        state.profilePanel === "profil"
          ? `
      <form class="settings-form" id="profile-form">
        <div class="profile-connection-card">
          <strong>Aktiver Unterricht</strong>
          <p>${escapeHtml(state.profileName || "Unbekannt")} · ${escapeHtml(activeProfileLabel)} · Ziel ${state.goal} Minuten</p>
          <small>${state.syncUploadToken ? `Verbunden mit ${escapeHtml(state.syncSiteLabel || state.syncBaseUrl)}` : "Noch kein Unterricht mit dem Server verbunden."}</small>
        </div>
        <article class="profile-sync-card tone-${escapeHtml(syncSummary.tone)}">
          <strong>${escapeHtml(syncSummary.title)}</strong>
          <p>${escapeHtml(syncSummary.text)}</p>
          <small>${state.syncLastSuccessAt ? `Letzter erfolgreicher Server-Sync: ${escapeHtml(formatStudentDateTime(state.syncLastSuccessAt))}.` : "Sobald der Unterricht verbunden ist, erscheint hier auch der letzte erfolgreiche Server-Sync."}</small>
        </article>
        <label class="field">
          <span>Unterricht umschalten</span>
          <select id="active-profile-select">
            ${profiles
              .map(
                (profile) => `
                  <option value="${escapeHtml(profile.storageId)}" ${profile.storageId === state.activeProfileId ? "selected" : ""}>
                    ${escapeHtml(`${profile.profileName} · ${profile.profileLabel || profile.instrument || "Unterricht"}`)}
                  </option>
                `,
              )
              .join("")}
          </select>
          <small class="field-hint">Jeder Unterricht steht für einen eigenen Lernweg mit eigener Lehrkraft-Anbindung.</small>
        </label>
        <label class="field">
          <span>Lernenden-ID</span>
          <input type="text" value="${escapeHtml(state.studentId)}" readonly />
          <small class="field-hint">Wichtig bei Gerätewechsel: Backup speichern oder über "Auf neues Gerät umziehen" teilen und auf dem neuen Gerät importieren, damit diese ID erhalten bleibt.</small>
        </label>
        <label class="field">
          <span>Name</span>
          <input id="profile-name" type="text" value="${escapeHtml(state.profileName)}" maxlength="24" ${hasManagedProfile ? "readonly" : ""} />
          ${hasManagedProfile ? '<small class="field-hint">Der Name kommt aus dem Profil der Lehrkräfte-App und wird hier nicht lokal überschrieben.</small>' : ""}
        </label>
        <label class="field">
          <span>Hauptinstrument</span>
          ${
            hasManagedProfile
              ? `<div class="field-static">${escapeHtml(state.instrument)}</div>
                 <small class="field-hint">Dieses Instrument kommt aus dem Profil der Lehrkräfte-App und kann hier nicht geändert werden.</small>`
              : `<select id="profile-instrument">
                  ${instruments
                    .map(
                      (item) => `
                        <option value="${item}" ${state.instrument === item ? "selected" : ""}>${item}</option>
                      `,
                    )
                    .join("")}
                </select>`
          }
        </label>
        <label class="field">
          <span>Tagesziel in Minuten</span>
          <input id="profile-goal" type="range" min="5" max="60" step="5" value="${state.goal}" ${hasManagedProfile ? "disabled" : ""} />
          <strong class="range-value" id="goal-value">${state.goal} Minuten</strong>
          ${hasManagedProfile ? '<small class="field-hint">Das Ziel wird mit dem Profil der Lehrkräfte-App synchronisiert und nicht direkt auf dem Gerät geändert.</small>' : ""}
        </label>
        ${
          hasManagedProfile
            ? `<button class="primary-button sync-action" id="profile-sync-button" type="button">Mit Server synchronisieren</button>`
            : `<button class="primary-button" id="save-profile" type="submit">Unterricht speichern</button>`
        }
        <p class="profile-note">${state.syncUploadToken ? `Server verbunden: ${escapeHtml(state.syncSiteLabel || state.syncBaseUrl)}. Der Sync sendet den aktuellen Bericht und lädt zugewiesene Kärtchen neu.` : "Noch keine Server-Kopplung aktiv. Verbinde dieses Gerät in den Einstellungen mit Lernenden-ID und Verbindungscode."}</p>
        ${state.syncUploadToken ? `<p class="profile-note">${escapeHtml(state.syncStatusNote || "Nach dem nächsten Eintrag oder einem manuellen Sync wird der Serverstand aktualisiert.")}</p>` : ""}
        <p class="profile-note">Für ein neues Gerät zuerst ein Backup speichern oder teilen. Nur so bleiben Lernenden-ID und Verlauf zusammen.</p>
      </form>
      <div class="profile-stack">
        <article class="profile-line">
          <span>Wochenzeit</span>
          <strong>${stats.weekMinutes} Minuten</strong>
        </article>
        <article class="profile-line">
          <span>Aktuelle Serie</span>
          <strong>${stats.streak} Tage</strong>
        </article>
        <article class="profile-line">
          <span>Freigeschaltete Kärtchen</span>
          <strong>${getCards(stats).filter((card) => card.unlocked).length}</strong>
        </article>
        <article class="profile-line">
          <span>Lehrkräfte-Kärtchen aktiv</span>
          <strong>${activeTeacherCards}</strong>
        </article>
      </div>
      `
          : state.profilePanel === "begleitung"
            ? `
      <div class="profile-stack">
        <article class="profile-line">
          <span>Diese Woche</span>
          <strong>${stats.weekMinutes} Minuten</strong>
        </article>
        <article class="profile-line">
          <span>Regelmäßigkeit</span>
          <strong>${stats.streak} Tage Serie</strong>
        </article>
        <article class="profile-line">
          <span>Freigeschaltete Kärtchen</span>
          <strong>${getCards(stats).filter((card) => card.unlocked).length}</strong>
        </article>
        <article class="profile-line">
          <span>Lehrkräfte-Kärtchen aktiv</span>
          <strong>${activeTeacherCards}</strong>
        </article>
        <article class="profile-line">
          <span>Letzte Einträge</span>
          <strong>${lastEntries.length}</strong>
        </article>
      </div>
      <section class="mentor-panel">
        <div class="section-head">
          <h3>Eltern- und Lehrkraftblick</h3>
          <p>Kurz, positiv und ohne Leistungsdruck.</p>
        </div>
        <div class="pill-row">
          ${getReportRangeOptions()
            .map(
              (option) => `
                <button class="pill ${state.reportRange === option.id ? "is-active" : ""}" type="button" data-report-range="${option.id}">
                  ${option.label}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="mentor-notes">
          <article class="mentor-card">
            <strong>${reportData.label}</strong>
            <p>${reportData.minutes} Minuten im gewählten Zeitraum.</p>
          </article>
          <article class="mentor-card">
            <strong>Motivation</strong>
            <p>${stats.streak >= 3 ? "Die Übungsroutine wirkt gerade stabil." : "Eine kleine Erinnerung könnte heute helfen."}</p>
          </article>
          <article class="mentor-card">
            <strong>Fokus</strong>
            <p>${reportData.entries[0] ? `${reportData.entries[0].category} war zuletzt der Schwerpunkt.` : "Noch keine Einträge im gewählten Zeitraum vorhanden."}</p>
          </article>
        </div>
        <div class="history-list">
          ${reportData.entries
            .slice(0, 7)
            .map(
              (entry) => `
                <article class="history-row">
                  <div>
                    <strong>${new Date(`${entry.date}T12:00:00`).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}</strong>
                    <p>${entry.instrument} · ${entry.category}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</p>
                  </div>
                  <span>${entry.minutes} min</span>
                </article>
              `,
            )
            .join("") || `
              <article class="history-row">
                <div>
                  <strong>Noch leer</strong>
                  <p>In diesem Zeitraum wurden noch keine Einträge gespeichert.</p>
                </div>
                <span>0 min</span>
              </article>
            `}
        </div>
        <div class="mentor-actions">
          ${
            state.prefersDesktopActions
              ? `<button class="secondary-action" type="button" id="open-html-report">${getReportActionLabel()} ansehen</button>`
              : `<button class="secondary-action" type="button" id="open-html-report">${getReportActionLabel()} ansehen</button>`
          }
          <button class="secondary-action" type="button" id="share-summary">${getReportActionLabel()} teilen</button>
          <button class="secondary-action" type="button" id="copy-summary">Berichtstext kopieren</button>
          <button class="secondary-action" type="button" id="mail-summary">Bericht per Mail vorbereiten</button>
          ${
            state.prefersDesktopActions
              ? `<button class="secondary-action" type="button" id="download-html-report">HTML-Bericht herunterladen</button>`
              : `<button class="secondary-action" type="button" id="download-html-report">HTML-Bericht herunterladen</button>`
          }
          ${
            state.prefersDesktopActions
              ? `<button class="secondary-action" type="button" id="download-text-report">Textbericht herunterladen</button>`
              : `<button class="secondary-action" type="button" id="download-text-report">Textbericht herunterladen</button>`
          }
          <button class="secondary-action" type="button" id="print-report">Bericht drucken / PDF</button>
        </div>
      </section>
      `
            : `
      <section class="mentor-panel feedback-panel">
        <div class="section-head">
          <h3>Rückmeldung zum Unterricht</h3>
          <p>Anonym, einmalig und ohne Sicht auf Einzelantworten.</p>
        </div>
        ${
          !state.syncUploadToken
            ? `
              <article class="mentor-card">
                <strong>Noch keine Rückmeldung verfügbar</strong>
                <p>Verbinde zuerst einen Unterricht mit einer Lehrkraft. Danach kann hier eine anonyme Rückmeldung auftauchen.</p>
              </article>
            `
            : !state.activeFeedbackRound
              ? `
                <article class="mentor-card">
                  <strong>Gerade ist keine Runde offen</strong>
                  <p>Sobald eine Rückmeldung freigeschaltet ist, kannst du sie hier direkt beantworten.</p>
                </article>
              `
              : state.activeFeedbackRound.alreadyAnswered || state.feedbackStatus === "answered" || state.feedbackStatus === "success"
                ? `
                  <article class="mentor-card">
                    <strong>Danke für deine Rückmeldung</strong>
                    <p>Deine Antwort wurde anonym gespeichert. Deine Lehrkraft sieht nur die gemeinsame Auswertung mehrerer Rückmeldungen.</p>
                  </article>
                `
                : `
                  <article class="mentor-card">
                    <strong>${escapeHtml(state.activeFeedbackRound.title)}</strong>
                    <p>${escapeHtml(state.activeFeedbackRound.introText)}</p>
                    <p>${feedbackCompletionCount()} von ${state.activeFeedbackRound.questions.length} Fragen beantwortet.</p>
                  </article>
                  <div class="feedback-question-list">
                    ${state.activeFeedbackRound.questions
                      .map(
                        (question) => `
                          <article class="mentor-card feedback-question-card">
                            <strong>${escapeHtml(question.label)}</strong>
                            <div class="feedback-scale" role="group" aria-label="${escapeHtml(question.label)}">
                              ${[1, 2, 3, 4, 5]
                                .map(
                                  (value) => `
                                    <button
                                      class="feedback-scale-button ${Number(state.feedbackAnswers?.[question.id]) === value ? "is-active" : ""}"
                                      type="button"
                                      data-feedback-question="${question.id}"
                                      data-feedback-value="${value}"
                                    >
                                      ${value}
                                    </button>
                                  `,
                                )
                                .join("")}
                            </div>
                            <div class="feedback-scale-labels">
                              <span>gar nicht</span>
                              <span>voll</span>
                            </div>
                          </article>
                        `,
                      )
                      .join("")}
                  </div>
                  ${state.feedbackError ? `<p class="profile-note feedback-note is-error">${escapeHtml(state.feedbackError)}</p>` : ""}
                  <button class="primary-button feedback-submit-button" id="submit-feedback-button" type="button" ${state.feedbackStatus === "sending" ? "disabled" : ""}>
                    ${state.feedbackStatus === "sending" ? "Wird gesendet..." : "Anonym absenden"}
                  </button>
                  <p class="profile-note feedback-note">Du kannst einmal teilnehmen. Die Antworten laufen anonym an die gemeinsame Auswertung.</p>
                `
        }
      </section>
      `
      }
    </section>
  `;
}

function currentScreen() {
  if (state.activeScreen === "log") {
    return logScreen();
  }

  if (state.activeScreen === "cards") {
    return cardsScreen();
  }

  if (state.activeScreen === "history") {
    return historyScreen();
  }

  if (state.activeScreen === "profile") {
    return profileScreen();
  }

  return todayScreen();
}

function render() {
  applyModalScrollLock();
  root.innerHTML = `
    <div class="app-shell">
      <div class="app-frame ${state.celebrate ? "is-celebrating" : ""} ${(state.settingsOpen || state.helpOpen || state.profileImportConfirmOpen || state.resetConfirmOpen || state.resetFinalConfirmOpen || state.scannerOpen || state.syncStatusOpen) ? "is-modal-open" : ""}">
        <header class="topbar">
          <div>
            <p class="eyebrow">Üben sichtbar machen</p>
            <h1>FleißTakt</h1>
          </div>
          <div class="topbar-actions">
            <button class="ghost-button" type="button" id="open-help">
              Hilfe
            </button>
            <button class="ghost-button" type="button" id="open-settings">
              Einstellungen
            </button>
          </div>
        </header>

        <main class="screen-area">
          ${currentScreen()}
        </main>

        <nav class="bottom-nav" aria-label="Hauptnavigation">
          ${navItems
            .map(
              (item) => `
                <button class="nav-item ${state.activeScreen === item.id ? "is-active" : ""}" type="button" data-nav="${item.id}">
                  <span>${item.icon}</span>
                  <strong>${item.label}</strong>
                </button>
              `,
            )
            .join("")}
        </nav>

        ${
          state.celebrate
            ? `<div class="toast" role="status">${state.celebrationText}</div>`
            : ""
        }
      </div>

      <dialog class="settings-dialog" id="settings-dialog">
        <form method="dialog" class="settings-sheet" tabindex="-1">
          <div class="section-head">
            <h2>Einstellungen</h2>
            <p>Installieren, Backup und Updates an einem Ort.</p>
          </div>

          <section class="settings-block">
            <h3>App</h3>
            <p class="settings-copy">Version ${escapeHtml(state.versionInfo.appVersion)} · ${escapeHtml(state.versionInfo.label || "FleißTakt")}</p>
            <div class="settings-actions">
              <button class="secondary-action" type="button" id="settings-install-app">
                ${state.installReady ? "App installieren" : "Installation prüfen"}
              </button>
            </div>
          </section>

          <section class="settings-block">
            <h3>Backup</h3>
            <p class="settings-copy">Backup speichert die Datei lokal. Für Gerätewechsel kann dieselbe Datei direkt über Teilen an das neue Gerät geschickt werden.</p>
            <div class="settings-actions">
              <button class="secondary-action" type="button" id="move-device-button">Auf neues Gerät umziehen</button>
              <button class="secondary-action" type="button" id="export-backup-button">Backup speichern</button>
              <label class="secondary-action settings-file-label" for="backup-input">Backup importieren</label>
              <input id="backup-input" type="file" accept="application/json,.json" hidden />
            </div>
          </section>

          <section class="settings-block">
            <h3>Mit Lehrkraft verbinden</h3>
            <p class="settings-copy">So startest du: App öffnen, dann entweder den QR-Code aus der Lehrkräfte-App scannen oder Lernenden-ID und Verbindungscode eingeben.</p>
            <article class="profile-sync-card tone-${escapeHtml(describeStudentSyncState().tone)}">
              <strong>${escapeHtml(describeStudentSyncState().title)}</strong>
              <p>${escapeHtml(describeStudentSyncState().text)}</p>
              <small>${state.syncUploadToken ? `Verbunden mit ${escapeHtml(state.syncSiteLabel || state.syncBaseUrl)}.` : "Noch kein Unterricht verbunden."}</small>
            </article>
            <div class="help-list compact-help-list">
              <article class="help-step">
                <strong>1. App öffnen</strong>
                <p>Lernenden-App installieren und öffnen.</p>
              </article>
              <article class="help-step">
                <strong>2. Unterricht koppeln</strong>
                <p>Die Lehrkraft zeigt dir entweder einen QR-Code oder gibt dir Lernenden-ID und Verbindungscode.</p>
              </article>
              <article class="help-step">
                <strong>3. QR oder manuelle Eingabe wählen</strong>
                <p>Du brauchst nur einen der beiden Wege. Beides verbindet denselben Unterricht.</p>
              </article>
            </div>
            <div class="settings-choice-block">
              <strong>Weg A: QR-Code scannen</strong>
              <p class="settings-copy">Am schnellsten mit der Kamera direkt aus der Lehrkräfte-App.</p>
            </div>
            <div class="settings-actions settings-actions-single">
              <button class="secondary-action sync-action" type="button" id="open-qr-scanner">QR-Code scannen</button>
            </div>
            <div class="settings-choice-block">
              <strong>Weg B: Lernenden-ID und Verbindungscode eingeben</strong>
              <p class="settings-copy">Diesen Weg nutzt du, wenn kein QR-Code zur Hand ist.</p>
            </div>
            <div class="settings-connect-form" id="connect-profile-form">
              <label class="field settings-field">
                <span>Lernenden-ID</span>
                <input id="connect-student-id" type="text" value="${escapeHtml(state.connectStudentIdDraft || (state.syncUploadToken ? state.studentId : ""))}" placeholder="z. B. app-..." autocapitalize="off" autocomplete="off" spellcheck="false" />
              </label>
              <label class="field settings-field">
                <span>Verbindungscode</span>
                <input id="connect-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" value="${escapeHtml(state.connectCodeDraft)}" placeholder="4-stellig" autocomplete="one-time-code" />
              </label>
              <div class="settings-actions settings-actions-single">
                <button class="secondary-action sync-action" type="button" id="connect-profile-button">Mit Lehrkraft verbinden</button>
              </div>
            </div>
            <div class="settings-choice-block">
              <strong>Danach: Mit dem Server synchronisieren</strong>
              <p class="settings-copy">Nach der Kopplung holt dieser Schritt neue Kärtchen vom Server und sendet deinen aktuellen Bericht zurück.</p>
            </div>
            <div class="settings-actions">
              <button class="secondary-action sync-action" type="button" id="student-sync-button" ${state.syncUploadToken ? "" : "disabled"}>Jetzt mit dem Server synchronisieren</button>
            </div>
            <p class="settings-copy">${state.syncStatusNote ? escapeHtml(state.syncStatusNote) : (state.syncUploadToken ? `Verbunden mit ${escapeHtml(state.syncSiteLabel || state.syncBaseUrl)}` : "Noch kein Unterricht verbunden.")}</p>
            <p class="settings-copy">Ausnahmeweg nur für seltene Fälle: Profilpaket importieren.</p>
            <div class="settings-actions">
              <label class="secondary-action settings-file-label" for="profile-package-input">Profilpaket importieren</label>
              <input id="profile-package-input" type="file" accept="application/json,.json" hidden />
            </div>
          </section>

          <section class="settings-block">
            <h3>Weiterempfehlen</h3>
            <p class="settings-copy">Teile den Link zu FleißTakt direkt aus der App.</p>
            <div class="settings-actions">
              <button class="secondary-action" type="button" id="share-app-button">App empfehlen</button>
            </div>
            <div class="share-card">
              <img
                class="share-qr-image"
                src="./icons/fleisstakt-share-qr.svg"
                alt="QR-Code zu FleißTakt"
              />
              <div class="share-card-copy">
                <p class="settings-copy">Oder mit dem Smartphone scannen:</p>
                <code class="share-url">${APP_SHARE_URL}</code>
              </div>
            </div>
          </section>

          <section class="settings-block">
            <h3>Updates</h3>
            <p class="settings-copy" id="version-label">Version ${escapeHtml(state.versionInfo.appVersion)} · Cache ${escapeHtml(state.versionInfo.cacheVersion)}</p>
            <p class="settings-copy">FleißTakt läuft auch offline weiter. Für eine Update-Prüfung braucht das Gerät nur kurz eine Internet-Verbindung.</p>
            <p class="settings-status" data-state="${state.updateState}">${escapeHtml(state.updateStatus)}</p>
            <div class="settings-actions">
              <button class="secondary-action" type="button" id="check-updates-button">Nach Updates suchen</button>
              <button class="secondary-action" type="button" id="reload-app-button">App neu laden</button>
            </div>
          </section>

          <section class="settings-block settings-block-danger">
            <h3>Test-Reset</h3>
            <p class="settings-copy">Für die Testphase kannst du alle lokalen Daten auf diesem Gerät löschen und danach neu mit Lernenden-ID und Verbindungscode starten.</p>
            <p class="settings-copy">Vorher am besten ein Backup speichern, wenn Einträge, Profile oder Verlauf noch gebraucht werden.</p>
            <div class="settings-actions settings-actions-close">
              <button class="secondary-action danger-action" type="button" id="open-reset-confirm">Alles löschen</button>
            </div>
          </section>

          <div class="settings-actions settings-actions-close">
            <button class="secondary-action" type="button" id="close-settings">Schließen</button>
          </div>
        </form>
      </dialog>

        <dialog class="settings-dialog" id="help-dialog">
          <form method="dialog" class="settings-sheet" tabindex="-1">
          <div class="section-head">
            <h2>Schneller Einstieg</h2>
            <p>So klappt der Start mit FleißTakt in wenigen Schritten.</p>
          </div>

          <section class="settings-block">
            <h3>So startest du</h3>
            <div class="help-list">
              <article class="help-step">
                <strong>1. Mit Lehrkraft verbinden</strong>
                <p>Am einfachsten per QR-Code aus der Lehrkräfte-App, alternativ mit Lernenden-ID und Verbindungscode.</p>
              </article>
              <article class="help-step">
                <strong>2. Unterricht laden</strong>
                <p>Name, Instrument, Unterrichtsbezeichnung und Tagesziel kommen danach direkt vom Server.</p>
              </article>
              <article class="help-step">
                <strong>3. Übeeinheit eintragen</strong>
                <p>Nach dem Üben nur Minuten, Schwerpunkt und auf Wunsch eine Notiz ergänzen.</p>
              </article>
              <article class="help-step">
                <strong>4. Mit Server synchronisieren</strong>
                <p>So landen Bericht und Fortschritt bei den Lehrkräften und neue Kärtchen kommen zurück.</p>
              </article>
              <article class="help-step">
                <strong>5. Bei Gerätewechsel Backup nutzen</strong>
                <p>Für ein neues Gerät am besten zuerst Backup speichern oder teilen, damit alles zusammenbleibt.</p>
              </article>
            </div>
          </section>

          <div class="settings-actions settings-actions-close">
            <button class="secondary-action" type="button" id="close-help">Schließen</button>
          </div>
          </form>
        </dialog>

        <dialog class="settings-dialog" id="profile-import-confirm-dialog">
          <form method="dialog" class="settings-sheet" tabindex="-1">
            <div class="section-head">
              <h2>Unterricht wirklich ersetzen?</h2>
              <p>Dieses Gerät ist bereits mit einem anderen Unterricht verbunden.</p>
            </div>

            <section class="settings-block">
              <div class="confirm-summary">
                <article class="confirm-card">
                  <strong>Aktuell auf diesem Gerät</strong>
                  <p>${escapeHtml(state.profileName || "Unbekannt")} · ${escapeHtml(state.instrument || "Kein Instrument")}</p>
                  <p class="settings-copy">${state.entries.length} Einträge auf diesem Gerät</p>
                </article>
                <article class="confirm-card">
                  <strong>Neues Profilpaket</strong>
                  <p>${escapeHtml(state.pendingProfileImport?.displayName || "Unbekannt")} · ${escapeHtml(state.pendingProfileImport?.instrument || "Kein Instrument")}</p>
                  <p class="settings-copy">${escapeHtml(state.pendingProfileImport?.profileLabel || "Profil")}</p>
                </article>
              </div>
              <p class="settings-copy">Beim Ersetzen werden die bisherigen Einträge und Lehrkräfte-Kärtchen auf diesem Gerät geleert, damit keine Daten von zwei Lernenden vermischt werden.</p>
            </section>

            <div class="settings-actions">
              <button class="secondary-action" type="button" id="cancel-profile-import">Abbrechen</button>
              <button class="secondary-action primary-action" type="button" id="confirm-profile-import">Profil ersetzen</button>
            </div>
          </form>
        </dialog>

        <dialog class="settings-dialog" id="scanner-dialog">
          <form method="dialog" class="settings-sheet" tabindex="-1">
            <div class="section-head">
              <h2>QR-Code scannen</h2>
              <p>Scanne den Kopplungs-QR aus der Lehrkräfte-App oder wähle ein Bild mit QR-Code aus.</p>
            </div>

            <section class="settings-block">
              <div class="scanner-shell">
                <div class="scanner-stage ${state.scannerState === "error" ? "is-error" : ""}">
                  <video id="connect-qr-video" class="scanner-video" autoplay muted playsinline></video>
                  <div class="scanner-frame" aria-hidden="true"></div>
                </div>
                <p class="settings-copy">${escapeHtml(connectionScannerText())}</p>
              </div>
            </section>

            <div class="settings-actions">
              <label class="secondary-action settings-file-label" for="scanner-image-input">QR-Bild auswählen</label>
              <input id="scanner-image-input" type="file" accept="image/*" hidden />
              <button class="secondary-action" type="button" id="restart-qr-scanner">Kamera neu starten</button>
            </div>

            <div class="settings-actions settings-actions-close">
              <button class="secondary-action" type="button" id="close-scanner">Schließen</button>
            </div>
          </form>
        </dialog>

        <dialog class="settings-dialog" id="sync-status-dialog">
          <form method="dialog" class="settings-sheet" tabindex="-1">
            <div class="section-head">
              <h2>${escapeHtml(state.syncStatusTitle || "Server-Sync")}</h2>
              <p>${escapeHtml(state.syncStatusMessage || "Bitte kurz warten...")}</p>
            </div>

            <section class="settings-block">
              <div class="sync-status-list">
                ${state.syncStatusSteps
                  .map(
                    (step) => `
                      <article class="sync-status-item is-${step.state}">
                        <strong>${escapeHtml(step.label)}</strong>
                        <span>${
                          step.state === "done"
                            ? "Fertig"
                            : step.state === "running"
                              ? "Läuft"
                              : step.state === "error"
                                ? "Fehler"
                                : "Wartet"
                        }</span>
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            </section>

            <div class="settings-actions settings-actions-close">
              <button class="secondary-action" type="button" id="close-sync-status" ${state.syncStatusState === "running" ? "disabled" : ""}>Schließen</button>
            </div>
          </form>
        </dialog>

        <dialog class="settings-dialog" id="reset-confirm-dialog">
          <form method="dialog" class="settings-sheet" tabindex="-1">
            <div class="section-head">
              <h2>Test-Reset vorbereiten</h2>
              <p>Diese Aktion entfernt alle lokalen Daten auf diesem Gerät.</p>
            </div>

            <section class="settings-block">
              <div class="confirm-summary">
                <article class="confirm-card">
                  <strong>Was gelöscht wird</strong>
                  <p>Alle Unterrichte, Einträge, lokalen Kärtchen und die aktuelle Server-Kopplung auf diesem Gerät.</p>
                </article>
                <article class="confirm-card">
                  <strong>Vorher empfohlen</strong>
                  <p>Bitte zuerst ein Backup speichern, wenn du den aktuellen Stand später noch brauchst.</p>
                </article>
              </div>
              <p class="settings-copy">Nach dem Reset startet die App wieder frisch und kann direkt neu mit Lernenden-ID und Verbindungscode gekoppelt werden.</p>
            </section>

            <div class="settings-actions">
              <button class="secondary-action" type="button" id="cancel-reset-confirm">Abbrechen</button>
              <button class="secondary-action primary-action" type="button" id="continue-reset-confirm">Weiter</button>
            </div>
          </form>
        </dialog>

        <dialog class="settings-dialog" id="reset-final-confirm-dialog">
          <form method="dialog" class="settings-sheet" tabindex="-1">
            <div class="section-head">
              <h2>Wirklich alles löschen?</h2>
              <p>Dieser Schritt löscht die lokalen Daten jetzt sofort.</p>
            </div>

            <section class="settings-block settings-block-danger">
              <div class="confirm-summary">
                <article class="confirm-card confirm-card-danger">
                  <strong>Lokaler Geräte-Reset</strong>
                  <p>Einträge, Profile, Verlauf und die bestehende Verbindung zu den Lehrkräften werden auf diesem Gerät entfernt.</p>
                </article>
              </div>
              <p class="settings-copy">Wenn du noch kein Backup gespeichert hast, geh jetzt besser zurück und sichere den Stand zuerst.</p>
            </section>

            <div class="settings-actions">
              <button class="secondary-action" type="button" id="cancel-final-reset">Zurück</button>
              <button class="secondary-action danger-action" type="button" id="confirm-final-reset">Jetzt alles löschen</button>
            </div>
          </form>
        </dialog>
      </div>
    `;

  bindEvents();
}

function bindEvents() {
  const settingsDialog = document.querySelector("#settings-dialog");
  if (settingsDialog) {
    if (state.settingsOpen && !settingsDialog.open) {
      settingsDialog.showModal();
    }

    if (state.settingsOpen) {
      window.requestAnimationFrame(() => {
        const nextFocusTarget = state.settingsFocusId
          ? settingsDialog.querySelector(`#${state.settingsFocusId}`)
          : settingsDialog.querySelector(".settings-sheet");

        nextFocusTarget?.focus?.();
      });
    }

    settingsDialog.addEventListener("close", () => {
      if (state.settingsOpen) {
        state.settingsOpen = false;
        state.settingsFocusId = "";
        applyModalScrollLock();
        render();
      }
    });
  }

  const helpDialog = document.querySelector("#help-dialog");
  if (helpDialog) {
    if (state.helpOpen && !helpDialog.open) {
      helpDialog.showModal();
    }

    helpDialog.addEventListener("close", () => {
      if (state.helpOpen) {
        state.helpOpen = false;
        applyModalScrollLock();
        render();
      }
    });
  }

  const profileImportConfirmDialog = document.querySelector("#profile-import-confirm-dialog");
  if (profileImportConfirmDialog) {
    if (state.profileImportConfirmOpen && !profileImportConfirmDialog.open) {
      profileImportConfirmDialog.showModal();
    }

    profileImportConfirmDialog.addEventListener("close", () => {
      if (state.profileImportConfirmOpen) {
        state.profileImportConfirmOpen = false;
        state.pendingProfileImport = null;
        applyModalScrollLock();
        render();
      }
    });
  }

  const scannerDialog = document.querySelector("#scanner-dialog");
  if (scannerDialog) {
    if (state.scannerOpen && !scannerDialog.open) {
      scannerDialog.showModal();
      window.requestAnimationFrame(() => {
        startQrScanner().catch((error) => {
          state.scannerState = "error";
          state.scannerMessage = error?.message || "Kamera konnte nicht gestartet werden.";
          render();
        });
      });
    }

    scannerDialog.addEventListener("close", () => {
      if (state.scannerOpen) {
        closeScannerDialog();
      }
    });
  }

  const syncStatusDialog = document.querySelector("#sync-status-dialog");
  if (syncStatusDialog) {
    if (state.syncStatusOpen && !syncStatusDialog.open) {
      syncStatusDialog.showModal();
    }

    syncStatusDialog.addEventListener("close", () => {
      if (state.syncStatusOpen && state.syncStatusState !== "running") {
        closeSyncStatusDialog();
      }
    });
  }

  const resetConfirmDialog = document.querySelector("#reset-confirm-dialog");
  if (resetConfirmDialog) {
    if (state.resetConfirmOpen && !resetConfirmDialog.open) {
      resetConfirmDialog.showModal();
    }

    resetConfirmDialog.addEventListener("close", () => {
      if (state.resetConfirmOpen) {
        state.resetConfirmOpen = false;
        applyModalScrollLock();
        render();
      }
    });
  }

  const resetFinalConfirmDialog = document.querySelector("#reset-final-confirm-dialog");
  if (resetFinalConfirmDialog) {
    if (state.resetFinalConfirmOpen && !resetFinalConfirmDialog.open) {
      resetFinalConfirmDialog.showModal();
    }

    resetFinalConfirmDialog.addEventListener("close", () => {
      if (state.resetFinalConfirmOpen) {
        state.resetFinalConfirmOpen = false;
        applyModalScrollLock();
        render();
      }
    });
  }

  settingsDialog?.querySelectorAll("button[id], input[id], select[id], textarea[id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.settingsFocusId = element.id || "";
    });
    element.addEventListener("focus", () => {
      state.settingsFocusId = element.id || "";
    });
  });

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeScreen = button.dataset.nav;
      render();
    });
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
    });
  });

  document.querySelectorAll("[data-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      state.profilePanel = button.dataset.panel;
      render();
    });
  });

  document.querySelectorAll("[data-report-range]").forEach((button) => {
    button.addEventListener("click", () => {
      state.reportRange = button.dataset.reportRange;
      render();
    });
  });

  document.querySelectorAll("[data-feedback-question][data-feedback-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const questionId = Number(button.dataset.feedbackQuestion);
      const value = Number(button.dataset.feedbackValue);
      if (!questionId || !value || state.feedbackStatus === "sending") {
        return;
      }
      state.feedbackAnswers = {
        ...state.feedbackAnswers,
        [questionId]: value,
      };
      state.feedbackStatus = "ready";
      state.feedbackError = "";
      persistState();
      render();
    });
  });

  document.querySelector("#submit-feedback-button")?.addEventListener("click", async () => {
    if (state.feedbackStatus === "sending") {
      return;
    }

    if (!feedbackReadyToSubmit()) {
      state.feedbackStatus = "error";
      state.feedbackError = "Bitte beantworte zuerst alle 5 Fragen.";
      render();
      return;
    }

    state.feedbackStatus = "sending";
    state.feedbackError = "";
    persistState();
    render();

    try {
      await submitFeedbackResponse();
      state.feedbackStatus = "success";
      state.feedbackError = "";
      if (state.activeFeedbackRound) {
        state.activeFeedbackRound = {
          ...state.activeFeedbackRound,
          alreadyAnswered: true,
          ballotToken: "",
        };
      }
      state.feedbackAnswers = {};
      persistState();
      render();
      runBackgroundStudentSync();
    } catch (error) {
      state.feedbackStatus = "error";
      state.feedbackError = error?.message === "feedback-unvollstaendig"
        ? "Bitte beantworte zuerst alle 5 Fragen."
        : "Die Rückmeldung konnte gerade nicht gesendet werden.";
      persistState();
      render();
    }
  });

  const instrumentSelect = document.querySelector("#instrument-select");
  if (instrumentSelect) {
    instrumentSelect.addEventListener("change", (event) => {
      state.instrument = event.target.value;
      persistState();
      render();
    });
  }

  const minutesRange = document.querySelector("#minutes-range");
  if (minutesRange) {
    minutesRange.addEventListener("input", (event) => {
      state.minutes = Number(event.target.value);
      const valueEl = document.querySelector("#minutes-value");
      if (valueEl) {
        valueEl.textContent = `${state.minutes} Minuten`;
      }
    });
  }

  const noteInput = document.querySelector("#note-input");
  if (noteInput) {
    noteInput.addEventListener("input", (event) => {
      state.note = event.target.value;
    });
  }

  const settingsInstallButton = document.querySelector("#settings-install-app");
  if (settingsInstallButton) {
    settingsInstallButton.addEventListener("click", async () => {
      await handleInstallPrompt();
    });
  }

  const openHelpButton = document.querySelector("#open-help");
  if (openHelpButton) {
    openHelpButton.addEventListener("click", () => {
      state.helpOpen = true;
      applyModalScrollLock();
      render();
    });
  }

  const openSettingsButton = document.querySelector("#open-settings");
  if (openSettingsButton) {
    openSettingsButton.addEventListener("click", () => {
      state.settingsOpen = true;
      state.settingsFocusId = "settings-install-app";
      applyModalScrollLock();
      render();
    });
  }

  const closeSettingsButton = document.querySelector("#close-settings");
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener("click", () => {
      state.settingsOpen = false;
      state.settingsFocusId = "";
      applyModalScrollLock();
      settingsDialog?.close();
    });
  }

  const openQrScannerButton = document.querySelector("#open-qr-scanner");
  if (openQrScannerButton) {
    openQrScannerButton.addEventListener("click", () => {
      openScannerDialog();
    });
  }

  const restartQrScannerButton = document.querySelector("#restart-qr-scanner");
  if (restartQrScannerButton) {
    restartQrScannerButton.addEventListener("click", async () => {
      try {
        await startQrScanner();
      } catch (error) {
        state.scannerState = "error";
        state.scannerMessage = error?.message || "Kamera konnte nicht neu gestartet werden.";
        render();
      }
    });
  }

  const closeScannerButton = document.querySelector("#close-scanner");
  if (closeScannerButton) {
    closeScannerButton.addEventListener("click", () => {
      document.querySelector("#scanner-dialog")?.close();
    });
  }

  const scannerImageInput = document.querySelector("#scanner-image-input");
  if (scannerImageInput) {
    scannerImageInput.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }
      try {
        state.scannerState = "active";
        state.scannerMessage = "QR-Code aus dem Bild wird gelesen...";
        render();
        await scanConnectionImageFile(file);
      } catch (error) {
        state.scannerState = "error";
        state.scannerMessage = error?.message || "Das ausgewählte Bild konnte nicht gelesen werden.";
        render();
      } finally {
        event.target.value = "";
      }
    });
  }

  const closeSyncStatusButton = document.querySelector("#close-sync-status");
  if (closeSyncStatusButton) {
    closeSyncStatusButton.addEventListener("click", () => {
      if (state.syncStatusState !== "running") {
        document.querySelector("#sync-status-dialog")?.close();
      }
    });
  }

  const closeHelpButton = document.querySelector("#close-help");
  if (closeHelpButton) {
    closeHelpButton.addEventListener("click", () => {
      state.helpOpen = false;
      applyModalScrollLock();
      helpDialog?.close();
    });
  }

  const cancelProfileImportButton = document.querySelector("#cancel-profile-import");
  if (cancelProfileImportButton) {
    cancelProfileImportButton.addEventListener("click", () => {
      state.profileImportConfirmOpen = false;
      state.pendingProfileImport = null;
      applyModalScrollLock();
      profileImportConfirmDialog?.close();
    });
  }

  const confirmProfileImportButton = document.querySelector("#confirm-profile-import");
  if (confirmProfileImportButton) {
    confirmProfileImportButton.addEventListener("click", () => {
      if (!state.pendingProfileImport) {
        return;
      }

      applyProfilePackagePayload(state.pendingProfileImport);
      state.celebrationText = `Profil ${state.profileName} wurde übernommen.`;
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
      profileImportConfirmDialog?.close();
    });
  }

  const openResetConfirmButton = document.querySelector("#open-reset-confirm");
  if (openResetConfirmButton) {
    openResetConfirmButton.addEventListener("click", () => {
      state.resetConfirmOpen = true;
      applyModalScrollLock();
      render();
    });
  }

  const cancelResetConfirmButton = document.querySelector("#cancel-reset-confirm");
  if (cancelResetConfirmButton) {
    cancelResetConfirmButton.addEventListener("click", () => {
      state.resetConfirmOpen = false;
      applyModalScrollLock();
      resetConfirmDialog?.close();
    });
  }

  const continueResetConfirmButton = document.querySelector("#continue-reset-confirm");
  if (continueResetConfirmButton) {
    continueResetConfirmButton.addEventListener("click", () => {
      state.resetConfirmOpen = false;
      state.resetFinalConfirmOpen = true;
      applyModalScrollLock();
      resetConfirmDialog?.close();
      render();
    });
  }

  const cancelFinalResetButton = document.querySelector("#cancel-final-reset");
  if (cancelFinalResetButton) {
    cancelFinalResetButton.addEventListener("click", () => {
      state.resetFinalConfirmOpen = false;
      applyModalScrollLock();
      resetFinalConfirmDialog?.close();
    });
  }

  const confirmFinalResetButton = document.querySelector("#confirm-final-reset");
  if (confirmFinalResetButton) {
    confirmFinalResetButton.addEventListener("click", () => {
      resetStudentAppForTesting();
      resetFinalConfirmDialog?.close();
      state.celebrationText = "Alle lokalen Daten wurden gelöscht. Die App ist bereit für eine neue Kopplung.";
      state.celebrate = true;
      applyModalScrollLock();
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2400);
    });
  }

  const exportBackupButton = document.querySelector("#export-backup-button");
  if (exportBackupButton) {
    exportBackupButton.addEventListener("click", () => {
      downloadFile({
        filename: createBackupFileName(),
        content: createBackupFileContent(),
        mimeType: "application/json;charset=utf-8",
      });
      state.celebrationText = "Backup lokal gespeichert.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
    });
  }

  const moveDeviceButton = document.querySelector("#move-device-button");
  if (moveDeviceButton) {
    moveDeviceButton.addEventListener("click", async () => {
      try {
        await shareDeviceMoveBackup();
        state.celebrationText = "Backup für Gerätewechsel geteilt.";
      } catch (error) {
        if (error?.name === "AbortError") {
          state.celebrationText = "Teilen wurde abgebrochen.";
        } else if (error?.message === "datei-teilen-nicht-verfuegbar" || error?.message === "teilen-nicht-verfuegbar") {
          state.celebrationText = "Datei-Teilen wird auf diesem Gerät nicht angeboten.";
        } else {
          state.celebrationText = "Gerätewechsel konnte nicht vorbereitet werden.";
        }
      }
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
    });
  }

  const backupInput = document.querySelector("#backup-input");
  if (backupInput) {
    backupInput.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }
      try {
        await importBackupFile(file);
        state.celebrationText = "Backup importiert.";
      } catch (error) {
        if (error?.message === "ungueltige-pruefsumme") {
          state.celebrationText = "Backup ungültig oder verändert. Import verweigert.";
        } else if (error?.message === "ungueltiges-backup") {
          state.celebrationText = "Backup-Datei unvollständig oder nicht lesbar.";
        } else {
          state.celebrationText = "Backup konnte nicht importiert werden.";
        }
      }
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
      event.target.value = "";
    });
  }

  const profilePackageInput = document.querySelector("#profile-package-input");
  if (profilePackageInput) {
    profilePackageInput.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      try {
        const result = await importProfilePackage(file);
        if (result === "confirm") {
          event.target.value = "";
          return;
        }
        state.celebrationText = `Profil ${state.profileName} importiert.`;
      } catch (error) {
        if (error?.message === "ungueltige-pruefsumme") {
          state.celebrationText = "Profilpaket ungültig oder verändert.";
        } else if (error?.message === "ungueltiges-profilpaket") {
          state.celebrationText = "Profilpaket unvollständig oder nicht lesbar.";
        } else {
          state.celebrationText = error?.message || "Profilpaket konnte nicht importiert werden.";
        }
      }

      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
      event.target.value = "";
    });
  }

  const connectStudentIdInput = document.querySelector("#connect-student-id");
  if (connectStudentIdInput) {
    connectStudentIdInput.addEventListener("input", (event) => {
      state.connectStudentIdDraft = `${event.target.value || ""}`.trim();
    });
  }

  const connectCodeInput = document.querySelector("#connect-code");
  if (connectCodeInput) {
    connectCodeInput.addEventListener("input", (event) => {
      const normalized = `${event.target.value || ""}`.replace(/\D+/g, "").slice(0, 8);
      state.connectCodeDraft = normalized;
      event.target.value = normalized;
    });
  }

  const connectProfileButton = document.querySelector("#connect-profile-button");
  if (connectProfileButton) {
    connectProfileButton.addEventListener("click", async () => {
      const connectStudentId = document.querySelector("#connect-student-id")?.value?.trim() || "";
      const connectCode = document.querySelector("#connect-code")?.value?.trim() || "";
      await connectProfileFlow(connectStudentId, connectCode);
    });
  }

  const cardPackageInput = document.querySelector("#card-package-input");
  if (cardPackageInput) {
    cardPackageInput.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      try {
        await importCardPackage(file);
        state.celebrationText = "Kartenpaket importiert.";
      } catch (error) {
        if (error?.message === "ungueltige-pruefsumme") {
          state.celebrationText = "Kartenpaket ungültig oder verändert.";
        } else if (error?.message === "falsche-lernenden-id") {
          state.celebrationText = "Dieses Kartenpaket ist für eine andere Lernenden-ID gedacht.";
        } else {
          state.celebrationText = "Kartenpaket konnte nicht importiert werden.";
        }
      }

      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
      event.target.value = "";
    });
  }

  const shareAppButton = document.querySelector("#share-app-button");
  if (shareAppButton) {
    shareAppButton.addEventListener("click", async () => {
      const payload = {
        title: "FleißTakt",
    text: "FleißTakt hilft Musiklernenden dabei, Übezeit festzuhalten und Kärtchen zu sammeln.",
        url: APP_SHARE_URL,
      };

      try {
        if (navigator.share) {
          await navigator.share(payload);
          state.celebrationText = "App-Link geteilt.";
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
          state.celebrationText = "App-Link in die Zwischenablage kopiert.";
        } else {
          state.celebrationText = "Teilen auf diesem Gerät nicht verfügbar.";
        }
      } catch (error) {
        state.celebrationText = error?.name === "AbortError" ? "Teilen wurde abgebrochen." : "App-Link konnte nicht geteilt werden.";
      }

      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
    });
  }

  const checkUpdatesButton = document.querySelector("#check-updates-button");
  if (checkUpdatesButton) {
    checkUpdatesButton.addEventListener("click", async () => {
      await checkForUpdates();
    });
  }

  const reloadAppButton = document.querySelector("#reload-app-button");
  if (reloadAppButton) {
    reloadAppButton.addEventListener("click", async () => {
      await performAppReload();
    });
  }

  const profileGoal = document.querySelector("#profile-goal");
  if (profileGoal) {
    profileGoal.addEventListener("input", (event) => {
      const nextGoal = Number(event.target.value);
      const valueEl = document.querySelector("#goal-value");
      if (valueEl) {
        valueEl.textContent = `${nextGoal} Minuten`;
      }
    });
  }

  const activeProfileSelect = document.querySelector("#active-profile-select");
  if (activeProfileSelect) {
    activeProfileSelect.addEventListener("change", (event) => {
      activateStoredProfile(event.target.value);
      state.celebrationText = "Profil gewechselt.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
    });
  }

  const profileForm = document.querySelector("#profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.profileName = document.querySelector("#profile-name")?.value?.trim() || "Mila";
      if (!state.syncUploadToken) {
        state.instrument = document.querySelector("#profile-instrument")?.value || instruments[0];
      }
      state.goal = Number(document.querySelector("#profile-goal")?.value) || 15;
      persistState();
      state.celebrationText = "Profil aktualisiert.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
    });
  }

  const handleStudentSync = async () => {
    if (studentSyncInProgress) {
      state.celebrationText = "Server-Sync läuft bereits im Hintergrund.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
      return;
    }
    studentSyncInProgress = true;
    openSyncStatus("Mit Server synchronisieren", [
      { id: "upload", label: "Aktuellen Bericht zum Server senden" },
      { id: "download", label: "Profil und Kärtchen vom Server laden" },
    ]);

    try {
      updateSyncStatus("upload", "running", "Bericht wird an den FleißTakt-Server gesendet...");
      const { uploadResult, snapshot } = await syncStudentAppWithServer();
      updateSyncStatus("upload", "done", "Bericht gespeichert. Jetzt werden Profil und Kärtchen geladen...");
      updateSyncStatus("download", "running", "Aktueller Serverstand wird auf das Gerät übernommen...");
      updateSyncStatus("download", "done", snapshot?.lastImportSummary || "Profil und Kärtchen wurden aktualisiert.");
      finishSyncStatus(
        "success",
        uploadResult?.status === "duplicate_ignored"
          ? (snapshot?.lastImportSummary || "Server-Sync abgeschlossen.")
          : "Bericht gesendet und Kärtchen synchronisiert.",
        true,
      );
      state.celebrationText = uploadResult?.status === "duplicate_ignored"
        ? (snapshot?.lastImportSummary || "Server-Sync abgeschlossen.")
        : "Bericht gesendet und Kärtchen synchronisiert.";
      setStudentSyncState("ok", "Bericht gesendet und aktueller Serverstand übernommen.", { markSuccess: true });
    } catch (error) {
      const runningStep = state.syncStatusSteps.find((step) => step.state === "running");
      if (runningStep) {
        updateSyncStatus(runningStep.id, "error");
      }
      if (error?.message === "fehlendes-upload-token") {
        state.celebrationText = "Bitte dieses Gerät zuerst mit einer Lehrkraft verbinden.";
        finishSyncStatus("error", "Bitte dieses Gerät zuerst mit einer Lehrkraft verbinden.");
      } else if (error?.message && !error.message.includes("upload-fehlgeschlagen") && !error.message.includes("sync-fehlgeschlagen")) {
        state.celebrationText = error.message;
        finishSyncStatus("error", error.message);
      } else {
        state.celebrationText = "Synchronisation mit dem Server gerade nicht möglich.";
        finishSyncStatus("error", "Synchronisation mit dem Server gerade nicht möglich.");
      }
      setStudentSyncState("error", "Manueller Server-Sync fehlgeschlagen. Bitte später erneut versuchen.");
    }

    state.celebrate = true;
    persistState();
    render();
    window.setTimeout(() => {
      state.celebrate = false;
      render();
    }, 2200);
    studentSyncInProgress = false;
    if (studentAutoSyncPending) {
      void runBackgroundStudentSync();
    }
  };

  const studentSyncButton = document.querySelector("#student-sync-button");
  if (studentSyncButton) {
    studentSyncButton.addEventListener("click", handleStudentSync);
  }

  const profileSyncButton = document.querySelector("#profile-sync-button");
  if (profileSyncButton) {
    profileSyncButton.addEventListener("click", handleStudentSync);
  }

  const shareSummaryButton = document.querySelector("#share-summary");
  if (shareSummaryButton) {
    shareSummaryButton.addEventListener("click", async () => {
      const summary = composeShortSummary();
      try {
        if (navigator.share) {
          const reportLabel = getReportActionLabel();
          await navigator.share({
            title: `FleißTakt ${reportLabel}`,
            text: summary,
          });
          state.celebrationText = `${reportLabel} geteilt.`;
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(summary);
          state.celebrationText = `${getReportActionLabel()} in die Zwischenablage kopiert.`;
        } else {
          state.celebrationText = "Teilen auf diesem Gerät nicht verfügbar.";
        }
      } catch {
        state.celebrationText = "Teilen wurde abgebrochen.";
      }
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
    });
  }

  const copySummaryButton = document.querySelector("#copy-summary");
  if (copySummaryButton) {
    copySummaryButton.addEventListener("click", async () => {
      const summary = composeWeeklySummary();
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(summary);
          state.celebrationText = "Zusammenfassung kopiert.";
        } else {
          state.celebrationText = "Zwischenablage ist hier nicht verfügbar.";
        }
      } catch {
        state.celebrationText = "Kopieren hat nicht geklappt.";
      }
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
    });
  }

  const mailSummaryButton = document.querySelector("#mail-summary");
  if (mailSummaryButton) {
    mailSummaryButton.addEventListener("click", () => {
      const subject = encodeURIComponent(`FleißTakt ${getReportActionLabel()} für ${state.profileName}`);
      const body = encodeURIComponent(composeWeeklySummary());
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }

  const openHtmlReportButton = document.querySelector("#open-html-report");
  if (openHtmlReportButton) {
    openHtmlReportButton.addEventListener("click", () => {
      openReportWindow({ printMode: false });
    });
  }

  const downloadHtmlReportButton = document.querySelector("#download-html-report");
  if (downloadHtmlReportButton) {
    downloadHtmlReportButton.addEventListener("click", () => {
      downloadFile({
        filename: createReportFileName("html"),
        content: composeHtmlReport(),
        mimeType: "text/html;charset=utf-8",
      });
      state.celebrationText = "HTML-Bericht heruntergeladen.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
    });
  }

  const printReportButton = document.querySelector("#print-report");
  if (printReportButton) {
    printReportButton.addEventListener("click", () => {
      openReportWindow({ printMode: true });
    });
  }

  const downloadTextReportButton = document.querySelector("#download-text-report");
  if (downloadTextReportButton) {
    downloadTextReportButton.addEventListener("click", () => {
      downloadFile({
        filename: createReportFileName("txt"),
        content: composeWeeklySummary(),
        mimeType: "text/plain;charset=utf-8",
      });
      state.celebrationText = "Textbericht heruntergeladen.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
    });
  }

  const saveButton = document.querySelector("#save-entry");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const statsBefore = getStats();
      const unlockedBefore = new Set(
        getCards(statsBefore)
          .filter((card) => card.unlocked)
          .map((card) => card.id),
      );
      const noteValue = document.querySelector("#note-input")?.value?.trim() || "";
      const now = new Date();

      state.entries.unshift(
        createEntry({
          date: getTodayKey(),
          instrument: state.instrument,
          minutes: state.minutes,
          category: state.category,
          note: noteValue,
          savedAt: now.toISOString(),
        }),
      );
      state.note = "";
      persistState();

      const unlockedAfter = getCards(getStats()).filter((card) => card.unlocked);
      const newCard = unlockedAfter.find((card) => !unlockedBefore.has(card.id));
      state.celebrationText = newCard
        ? `Neues Kärtchen freigeschaltet: ${newCard.title}`
        : "Eintrag gespeichert. Weiter so!";
      state.celebrate = true;
      state.activeScreen = "today";
      render();
      if (state.syncUploadToken) {
        void runBackgroundStudentSync();
      }
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 2200);
    });
  }
}

async function handleInstallPrompt() {
  if (!state.installPrompt) {
    state.celebrationText = "Die Installation wird auf diesem Gerät gerade nicht angeboten.";
    state.celebrate = true;
    render();
    window.setTimeout(() => {
      state.celebrate = false;
      render();
    }, 2200);
    return;
  }

  const prompt = state.installPrompt;
  prompt.prompt();
  try {
    await prompt.userChoice;
  } catch {
    // Ignore aborted install prompts.
  }
  state.installPrompt = null;
  state.installReady = false;
  render();
}

function composeWeeklySummary() {
  const report = getReportData(state.reportRange);
  const unlockedCards = report.unlockedCards;
  const unlocked = unlockedCards.length;
  const recent = report.entries
    .slice(0, 3)
    .map(
      (entry) =>
        `${formatDisplayDate(entry.date)}: ${entry.instrument}, ${entry.category}, ${entry.minutes} Min${
          entry.note ? `, Notiz: ${entry.note}` : ""
        }`,
    )
    .join("\n");

  return [
    `FleißTakt ${report.label} für ${state.profileName}`,
    ``,
    `${report.label}: ${report.minutes} Minuten`,
    `Tagesziel: ${state.goal} Minuten`,
    `Aktuelle Serie: ${report.stats.streak} Tage`,
    `Freigeschaltete Kärtchen: ${unlocked}`,
    unlockedCards.length ? `Kärtchen: ${unlockedCards.map((card) => card.title).join(", ")}` : "",
    recent ? `` : "",
    recent ? `Letzte Einträge:\n${recent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function composeShortSummary() {
  const report = getReportData(state.reportRange);
  const unlocked = report.unlockedCards.length;

  return [
    `FleißTakt: ${state.profileName}`,
    `${report.minutes} Minuten im Zeitraum ${report.label}`,
    `${report.stats.streak} Tage Serie`,
    `${unlocked} Kärtchen freigeschaltet`,
  ].join(" · ");
}

function formatDisplayDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function createReportFileName(extension) {
  const safeName = state.profileName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "") || "lernende";
  return `fleisstakt-${getReportSlug()}-${safeName}-${createDateStamp()}.${extension}`;
}

function getReportSlug() {
  if (state.reportRange === "month") {
    return "monatsbericht";
  }

  if (state.reportRange === "all") {
    return "gesamtbericht";
  }

  return "wochenbericht";
}

function createDateStamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function buildReportModel() {
  const report = getReportData(state.reportRange);
  return {
    profileName: state.profileName,
    instrument: state.instrument,
    goal: state.goal,
    report,
    stats: report.stats,
    cards: report.unlockedCards,
    recentEntries: report.entries.slice(0, 7),
  };
}

function composeHtmlReport({ printOnLoad = false } = {}) {
  const model = buildReportModel();
  const recentEntriesMarkup = model.recentEntries.length
    ? model.recentEntries
        .map(
          (entry) => `
            <tr>
              <td>${escapeHtml(formatDisplayDate(entry.date))}</td>
              <td>${escapeHtml(entry.instrument)}</td>
              <td>${escapeHtml(entry.category)}</td>
              <td>${entry.minutes} Min</td>
              <td>${entry.note ? escapeHtml(entry.note) : "—"}</td>
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td colspan="5">Noch keine Einträge vorhanden.</td>
      </tr>
    `;

  const cardsMarkup = model.cards.length
    ? model.cards
        .map(
          (card) => `
            <li>
              <strong>${escapeHtml(card.title)}</strong>
              <span>${escapeHtml(card.description)}</span>
            </li>
          `,
        )
        .join("")
    : `<li><strong>Noch keine Kärtchen</strong><span>Die ersten Erfolge werden bald sichtbar.</span></li>`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FleißTakt ${escapeHtml(model.report.label)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Trebuchet MS", "Segoe UI", sans-serif;
        --ink: #1f2a36;
        --ink-soft: #5b6773;
        --accent: #f26f3d;
        --paper: #fffaf3;
        --line: rgba(31, 42, 54, 0.1);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        background: linear-gradient(180deg, #fbf7f1 0%, #f2e8d8 100%);
        color: var(--ink);
      }
      .report {
        max-width: 920px;
        margin: 0 auto;
        background: rgba(255, 250, 243, 0.92);
        border: 1px solid rgba(255,255,255,0.75);
        border-radius: 28px;
        padding: 32px;
        box-shadow: 0 24px 48px rgba(88, 61, 34, 0.12);
      }
      h1, h2, h3, p { margin: 0; }
      .eyebrow {
        color: var(--ink-soft);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.76rem;
        margin-bottom: 12px;
      }
      h1 {
        font-size: 2.6rem;
        line-height: 0.96;
        letter-spacing: -0.05em;
        margin-bottom: 10px;
      }
      .lead {
        color: var(--ink-soft);
        line-height: 1.5;
        margin-bottom: 28px;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      .stat {
        background: white;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 16px;
      }
      .stat span {
        display: block;
        color: var(--ink-soft);
        font-size: 0.84rem;
        margin-bottom: 6px;
      }
      .stat strong {
        font-size: 1.2rem;
      }
      .section {
        margin-top: 28px;
      }
      .section h2 {
        font-size: 1.3rem;
        margin-bottom: 12px;
      }
      .cards {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .cards li {
        background: white;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 16px;
        display: grid;
        gap: 6px;
      }
      .cards span {
        color: var(--ink-soft);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid var(--line);
      }
      th, td {
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      th {
        background: rgba(242,111,61,0.08);
      }
      tr:last-child td {
        border-bottom: 0;
      }
      .footer-note {
        margin-top: 24px;
        color: var(--ink-soft);
        line-height: 1.45;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .report {
          box-shadow: none;
          border: 0;
          padding: 0;
        }
      }
      @media (max-width: 720px) {
        body { padding: 16px; }
        .report { padding: 20px; }
        .stats, .cards { grid-template-columns: 1fr 1fr; }
      }
    </style>
  </head>
  <body>
    <article class="report">
      <p class="eyebrow">FleißTakt ${escapeHtml(model.report.label)}</p>
      <h1>${escapeHtml(model.profileName)}</h1>
      <p class="lead">Hauptinstrument: ${escapeHtml(model.instrument)} · Tagesziel: ${model.goal} Minuten</p>

      <section class="stats">
        <div class="stat"><span>${escapeHtml(model.report.label)}</span><strong>${model.report.minutes} Minuten</strong></div>
        <div class="stat"><span>Serie</span><strong>${model.stats.streak} Tage</strong></div>
        <div class="stat"><span>Übetage</span><strong>${model.report.uniqueDaysCount}</strong></div>
        <div class="stat"><span>Notizen</span><strong>${model.report.notedCount}</strong></div>
      </section>

      <section class="section">
        <h2>Freigeschaltete Kärtchen</h2>
        <ul class="cards">${cardsMarkup}</ul>
      </section>

      <section class="section">
        <h2>Letzte Einträge</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Instrument</th>
              <th>Schwerpunkt</th>
              <th>Dauer</th>
              <th>Notiz</th>
            </tr>
          </thead>
          <tbody>${recentEntriesMarkup}</tbody>
        </table>
      </section>

      <p class="footer-note">
        Dieser Bericht soll Üben sichtbar machen und positive Gespräche über Fortschritt, Regelmäßigkeit und nächste Schritte erleichtern.
      </p>
    </article>
    ${
      printOnLoad
        ? `<script>window.addEventListener("load", () => { window.print(); });</script>`
        : ""
    }
  </body>
</html>`;
}

function openReportWindow({ printMode }) {
  const html = composeHtmlReport({ printOnLoad: printMode });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    state.celebrationText = "Der Bericht konnte nicht in einem neuen Fenster geöffnet werden.";
    state.celebrate = true;
    render();
    window.setTimeout(() => {
      state.celebrate = false;
      render();
    }, 2200);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadFile({ filename, content, mimeType }) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

render();

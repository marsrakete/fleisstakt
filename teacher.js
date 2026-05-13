const TEACHER_STORAGE_KEY = "fleisstakt-teacher-state-v1";
const APP_SHARE_URL = "https://marsrakete.github.io/fleisstakt/";
const DEFAULT_SYNC_BASE_URL = "https://schwoabamunzee.marsrakete.de/wp-json/fleisstakt-sync/v1";
const STATUS_LINE_TTL_MS = 5 * 60 * 1000;
const TEACHER_TOAST_TTL_MS = 30 * 1000;
const CARD_AWARD_NOTE_MAX_LENGTH = 140;
const TEACHER_APP_VERSION_INFO = Object.freeze(globalThis.APP_VERSION_INFO || {
  appVersion: "0.0.0",
  cacheVersion: "v0",
  label: "",
});

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
const cardAccentOptions = ["apricot", "gold", "sky", "mint"];
const cardRarityOptions = ["Basis", "Bronze", "Silber", "Gold", "Spezial"];
const defaultPracticeCategories = ["Hände getrennt üben", "Schneckentempo", "Raupe", "Übarten", "Hör dir gut zu", "Schwere Stellen üben", "Theorie", "Wiederholungen"];
const teacherWorkspaces = [
  { id: "overview", label: "Übersicht", icon: "▣" },
  { id: "week", label: "Woche", icon: "▤" },
  { id: "classes", label: "Klassen", icon: "◫" },
  { id: "students", label: "Lernende", icon: "◎" },
  { id: "cards", label: "Kärtchen", icon: "✦" },
  { id: "feedback", label: "Feedback", icon: "◌" },
];
const teacherInstrumentOptions = ["Klavier", "Violine", "Gitarre", "Cello", "Gesang", "Flöte"];
const teacherHelpTopics = {
  overview: {
    eyebrow: "Hilfe",
    title: "Workspace Übersicht",
    text: "Hier startet die Lehrkräfte-App mit Kennzahlen, letzten Berichten und einem ruhigen Überblick über den aktuellen Stand.",
    bullets: [
      "zeigt Lernende, Klassen, Einträge und Kärtchen auf einen Blick",
      "bündelt die letzten Berichte an einer Stelle",
      "hilft beim täglichen Einstieg",
    ],
  },
  week: {
    eyebrow: "Hilfe",
    title: "Workspace Woche",
    text: "Die Wochenansicht ist die Arbeitsansicht für den Alltag. Hier siehst du Aktivität, letzte Rückmeldungen und offene Unterrichte.",
    bullets: [
      "filtert nach Klasse",
      "markiert aktive und offene Unterrichte",
      "öffnet bei Klick auf einen Lernenden rechts die Berichte dieser Woche",
    ],
  },
  classes: {
    eyebrow: "Hilfe",
    title: "Workspace Klassen",
    text: "Hier verwaltest du Klassen selbst: anlegen, Unterrichte zuordnen, aus Klassen entfernen oder eine Klasse wieder löschen.",
    bullets: [
      "zeigt alle Klassen und ihre Zuordnungen",
      "ordnet Unterrichte direkt einer Klasse zu",
      "löscht Klassen mit Sicherheitsabfrage",
    ],
  },
  students: {
    eyebrow: "Hilfe",
    title: "Workspace Lernende",
    text: "Hier pflegst du die lernende Person und den jeweils aktiven Unterricht. Neue Unterrichte werden ebenfalls hier angelegt.",
    bullets: [
      "legt lernende Personen an",
      "verwaltet mehrere Unterrichte pro Person",
      "pflegt Klasse, Unterrichtsbezeichnung, Instrument und Tagesziel",
    ],
  },
  cards: {
    eyebrow: "Hilfe",
    title: "Workspace Kärtchen",
    text: "Hier entstehen Ziele und Belohnungen. Kärtchen können automatisch freigeschaltet oder direkt verliehen werden.",
    bullets: [
      "legt Kärtchen an und bearbeitet sie",
      "weist Kärtchen allen, einer Klasse oder einem Unterricht zu",
      "verleiht Kärtchen direkt mit optionaler Notiz",
    ],
  },
  feedback: {
    eyebrow: "Hilfe",
    title: "Workspace Feedback",
    text: "Hier siehst du anonyme Rückmeldungen aus dem Unterricht als gemeinsame Auswertung.",
    bullets: [
      "ordnet Antworten nach Feedback-Runden",
      "zeigt Verteilungen pro Frage",
      "bleibt bewusst ohne Personenbezug",
    ],
  },
  class_assignment: {
    eyebrow: "Hinweis",
    title: "Unterricht einer Klasse zuordnen",
    text: "Nicht die Person an sich gehört in eine Klasse, sondern der konkrete Unterricht. Deshalb werden Klassen immer an Unterrichte gebunden.",
    bullets: [
      "ein Lernender kann mehrere Unterrichte haben",
      "jeder Unterricht kann in einer anderen Klasse liegen",
    ],
  },
  student_form: {
    eyebrow: "Hinweis",
    title: "Stammdaten und aktueller Unterricht",
    text: "Dieses Formular mischt bewusst Person und aktiven Unterricht. Klasse, Instrument und Tagesziel beziehen sich auf den aktuell ausgewählten Unterricht.",
    bullets: [
      "Anzeigename, Vorname, Nachname gehören zur Person",
      "Klasse, Unterrichtsbezeichnung, Instrument und Tagesziel gehören zum Unterricht",
    ],
  },
  coupling: {
    eyebrow: "Hinweis",
    title: "Kopplung für die Lernenden-App",
    text: "Die Kopplung verbindet genau einen Unterricht mit einem Gerät. Danach läuft der Austausch über den Server.",
    bullets: [
      "zuerst Lernenden und Unterricht anlegen",
      "dann Lernenden-App installieren",
      "anschließend Lernenden und Unterricht mit dem Server synchronisieren",
      "anschließend QR-Code oder Lernenden-ID und Verbindungscode weitergeben",
    ],
  },
  card_rules: {
    eyebrow: "Hinweis",
    title: "Zielbedingung und Zielwert",
    text: "Die Zielbedingung sagt, was geprüft wird. Der Zielwert sagt, ab welcher Zahl das Kärtchen automatisch freigeschaltet wird.",
    bullets: [
      "Beispiel: Wochenminuten + 60 bedeutet insgesamt 60 Minuten in einer Woche",
      "Beispiel: Keine bedeutet nur direkte Vergabe ohne automatische Prüfung",
    ],
  },
};

const teacherState = {
  classes: [],
  students: [],
  cardLibrary: [],
  feedbackRounds: [],
  practiceCategories: [...defaultPracticeCategories],
  selectedClassId: "all",
  selectedStudentId: "",
  selectedWeekStudentId: "",
  selectedCardId: "",
  selectedFeedbackRoundId: "",
  currentWorkspace: "overview",
  sidebarCollapsed: false,
  classDraft: "",
  studentFormDraft: null,
  cardFormDraft: null,
  practiceCategoriesDraft: "",
  manualAwardDraft: null,
  statusLine: "Bereit.",
  statusLineUpdatedAt: 0,
  toast: "",
  lastImportSummary: "Noch keine Berichtspakete importiert.",
  syncBaseUrl: DEFAULT_SYNC_BASE_URL,
  syncTeacherKey: "",
  syncTeacherLabel: "",
  installPrompt: null,
  installReady: false,
  settingsOpen: false,
  settingsFocusId: "",
  helpDialogOpen: false,
  helpTopic: "",
  confirmDialogOpen: false,
  confirmDialogTone: "default",
  confirmDialogTitle: "",
  confirmDialogMessage: "",
  confirmDialogDetail: "",
  confirmDialogConfirmLabel: "Bestätigen",
  confirmDialogCancelLabel: "Abbrechen",
  updateStatus: "Die App funktioniert auch offline. Für eine Update-Prüfung bitte kurz online gehen.",
  updateState: "idle",
  updateReady: false,
  versionInfo: TEACHER_APP_VERSION_INFO,
  profileShareOpen: false,
  profileShareEyebrow: "Kopplung",
  profileShareTitle: "",
  profileShareDescription: "",
  profileShareUrl: "",
  profileShareHelp: "",
  profileShareAllowPackageDownload: false,
  profileShareFileName: "",
  profileSharePayload: null,
  syncProgressOpen: false,
  syncProgressTitle: "",
  syncProgressMessage: "",
  syncProgressState: "idle",
  syncProgressSteps: [],
  lastServerSyncAt: "",
  syncState: "idle",
  syncStateDetail: "",
};

const teacherRoot = document.querySelector("#teacher-root");
let teacherServiceWorkerRegistration = null;
let teacherUpdateInProgress = false;
let teacherReloadInProgress = false;
let teacherControllerReloadHandled = false;
let teacherStatusLineTimeout = null;
let lastRenderedTeacherStatusLine = null;
let teacherAutoSyncInProgress = false;
let teacherAutoSyncPending = {
  roster: false,
  cards: false,
};
let pendingTeacherConfirmAction = null;

hydrateTeacherState();
applyTeacherModalScrollLock();
applyTeacherReloadStatusFromUrl();
renderTeacherApp();
registerTeacherServiceWorker();

function createId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createChecksum(payload) {
  const normalized = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(normalized);
  let hash = 2166136261;

  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 16777619);
  }

  return `ft-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizePracticeCategories(list) {
  const values = Array.isArray(list)
    ? list
    : `${list || ""}`
        .split(/\r?\n|,/)
        .map((item) => item.trim());

  const unique = [...new Set(values.map((item) => `${item || ""}`.trim()).filter(Boolean))];
  return unique.length ? unique.slice(0, 12) : [...defaultPracticeCategories];
}

function getEffectivePracticeCategories() {
  return normalizePracticeCategories(teacherState.practiceCategories);
}

function escapeHtml(text) {
  return `${text ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createDateStamp() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function defaultTeacherState() {
  return {
    classes: [],
    students: [],
    cardLibrary: [],
    feedbackRounds: [],
    practiceCategories: [...defaultPracticeCategories],
    selectedClassId: "all",
    selectedStudentId: "",
    selectedWeekStudentId: "",
    selectedCardId: "",
    selectedFeedbackRoundId: "",
    currentWorkspace: "overview",
    sidebarCollapsed: false,
    classDraft: "",
    studentFormDraft: null,
    cardFormDraft: null,
    practiceCategoriesDraft: "",
    manualAwardDraft: null,
    statusLine: "Bereit.",
    statusLineUpdatedAt: 0,
    toast: "",
    lastImportSummary: "Noch keine Berichtspakete importiert.",
    syncBaseUrl: DEFAULT_SYNC_BASE_URL,
    syncTeacherKey: "",
    syncTeacherLabel: "",
    installPrompt: null,
    installReady: false,
    settingsOpen: false,
    settingsFocusId: "",
    helpDialogOpen: false,
    helpTopic: "",
    confirmDialogOpen: false,
    confirmDialogTone: "default",
    confirmDialogTitle: "",
    confirmDialogMessage: "",
    confirmDialogDetail: "",
    confirmDialogConfirmLabel: "Bestätigen",
    confirmDialogCancelLabel: "Abbrechen",
    updateStatus: "Die App funktioniert auch offline. Für eine Update-Prüfung bitte kurz online gehen.",
    updateState: "idle",
    updateReady: false,
    versionInfo: TEACHER_APP_VERSION_INFO,
    profileShareOpen: false,
    profileShareEyebrow: "Kopplung",
    profileShareTitle: "",
    profileShareDescription: "",
    profileShareUrl: "",
    profileShareHelp: "",
    profileShareAllowPackageDownload: false,
    profileShareFileName: "",
    profileSharePayload: null,
    syncProgressOpen: false,
    syncProgressTitle: "",
    syncProgressMessage: "",
    syncProgressState: "idle",
    syncProgressSteps: [],
    lastServerSyncAt: "",
    syncState: "idle",
    syncStateDetail: "",
  };
}

function applyTeacherModalScrollLock() {
  const isLocked = isAnyTeacherModalOpen();
  document.documentElement.style.overflow = isLocked ? "hidden" : "";
  document.body.style.overflow = isLocked ? "hidden" : "";
  document.body.classList.toggle("is-modal-open", isLocked);
}

function isAnyTeacherModalOpen() {
  return teacherState.settingsOpen
    || teacherState.profileShareOpen
    || teacherState.syncProgressOpen
    || teacherState.helpDialogOpen
    || teacherState.confirmDialogOpen;
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

function setTeacherUpdateStatus(message, options = {}) {
  const { showReload = false, error = false, stateName = "" } = options;
  teacherState.updateReady = Boolean(showReload);
  teacherState.updateStatus = message;
  teacherState.updateState = stateName || (showReload ? "ready" : error ? "error" : message ? "ok" : "idle");
  renderTeacherApp();
}

function applyTeacherReloadStatusFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("reload")) {
    return;
  }

  teacherState.updateReady = false;
  teacherState.updateState = "ok";
  teacherState.updateStatus = "App wurde neu geladen. Die aktuelle Version ist jetzt aktiv.";
  url.searchParams.delete("reload");
  window.history.replaceState({}, "", url.toString());
}

async function fetchTeacherVersionInfo() {
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

function markTeacherUpdateReady() {
  teacherState.updateReady = true;
  teacherState.updateState = "ready";
  teacherState.updateStatus = "Update bereit. App bitte neu laden.";
  renderTeacherApp();
}

function appendTeacherToast(message) {
  const existing = `${teacherState.toast || ""}`.trim();
  if (!existing) {
    teacherState.toast = message;
    return;
  }
  if (existing.includes(message)) {
    teacherState.toast = existing;
    return;
  }
  teacherState.toast = `${existing} ${message}`;
}

function openTeacherConfirmDialog(config = {}, onConfirm = null) {
  teacherState.confirmDialogOpen = true;
  teacherState.confirmDialogTone = config.tone === "danger" ? "danger" : "default";
  teacherState.confirmDialogTitle = `${config.title || "Bitte bestätigen"}`.trim();
  teacherState.confirmDialogMessage = `${config.message || ""}`.trim();
  teacherState.confirmDialogDetail = `${config.detail || ""}`.trim();
  teacherState.confirmDialogConfirmLabel = `${config.confirmLabel || "Bestätigen"}`.trim();
  teacherState.confirmDialogCancelLabel = `${config.cancelLabel || "Abbrechen"}`.trim();
  pendingTeacherConfirmAction = typeof onConfirm === "function" ? onConfirm : null;
  applyTeacherModalScrollLock();
  renderTeacherApp();
}

function closeTeacherConfirmDialog() {
  teacherState.confirmDialogOpen = false;
  teacherState.confirmDialogTone = "default";
  teacherState.confirmDialogTitle = "";
  teacherState.confirmDialogMessage = "";
  teacherState.confirmDialogDetail = "";
  teacherState.confirmDialogConfirmLabel = "Bestätigen";
  teacherState.confirmDialogCancelLabel = "Abbrechen";
  pendingTeacherConfirmAction = null;
  applyTeacherModalScrollLock();
}

function queueTeacherAutoSync({ roster = false, cards = false } = {}) {
  teacherAutoSyncPending = {
    roster: teacherAutoSyncPending.roster || roster,
    cards: teacherAutoSyncPending.cards || cards,
  };

  if (!teacherState.syncTeacherKey) {
    teacherState.statusLine = "Änderungen lokal gespeichert. Server-Sync ausstehend.";
    setTeacherSyncState("pending", "Der Lehrkräfte-Key fehlt noch. Die Änderungen bleiben lokal, bis ein Serverzugang hinterlegt ist.");
    persistTeacherState();
    renderTeacherApp();
    return;
  }

  if (teacherAutoSyncInProgress) {
    teacherState.statusLine = "Änderungen gespeichert. Server-Sync läuft im Hintergrund weiter.";
    appendTeacherToast("Server-Sync läuft im Hintergrund weiter.");
    setTeacherSyncState("running", "Weitere Änderungen werden an den laufenden Hintergrund-Sync angehängt.");
    persistTeacherState();
    renderTeacherApp();
    return;
  }

  void runQueuedTeacherAutoSync();
}

async function runQueuedTeacherAutoSync() {
  if (teacherAutoSyncInProgress || (!teacherAutoSyncPending.roster && !teacherAutoSyncPending.cards)) {
    return;
  }

  teacherAutoSyncInProgress = true;
  teacherState.statusLine = "Änderungen gespeichert. Server-Sync läuft im Hintergrund.";
  appendTeacherToast("Server-Sync läuft im Hintergrund.");
  setTeacherSyncState("running", "Änderungen werden im Hintergrund zum Server gesendet.");
  persistTeacherState();
  renderTeacherApp();

  try {
    while (teacherAutoSyncPending.roster || teacherAutoSyncPending.cards) {
      const nextRun = { ...teacherAutoSyncPending };
      teacherAutoSyncPending = { roster: false, cards: false };

      if (nextRun.roster) {
        await pushTeacherRosterToServer();
      }

      if (nextRun.cards) {
        await pushTeacherCardsToServer();
      }

      const snapshot = await fetchTeacherSyncSnapshot();
      const importResult = importTeacherSyncSnapshot(snapshot, {
        preserveLocalCardsOnEmpty: nextRun.cards,
        preserveLocalClassesOnEmpty: nextRun.roster,
        preserveMissingLocalClasses: nextRun.roster,
      });
      if (importResult.preservedLocalCards) {
        teacherState.toast = "Der Server hat direkt nach dem Kärtchen-Sync noch keine Karten zurückgemeldet. Die lokale Bibliothek bleibt deshalb vorerst erhalten.";
      } else if (importResult.preservedLocalClasses || importResult.preservedMissingLocalClasses) {
        teacherState.toast = "Der Server hat direkt nach dem Klassen-Sync noch nicht alle Klassen zurückgemeldet. Die lokale Liste bleibt deshalb vorerst erhalten.";
      }
    }

    if (!teacherState.toast || teacherState.toast.includes("Server-Sync läuft im Hintergrund")) {
      teacherState.statusLine = "Änderungen gespeichert und mit dem Server synchronisiert.";
      teacherState.toast = "Änderungen wurden mit dem Server synchronisiert.";
    }
    setTeacherSyncState("ok", "Lokale Änderungen wurden automatisch zum Server gesendet und mit dem aktuellen Serverstand abgeglichen.", { markSynced: true });
  } catch (error) {
    teacherState.statusLine = "Änderungen gespeichert. Server-Sync ausstehend.";
    teacherState.toast = error?.message || "Automatischer Server-Sync fehlgeschlagen. Bitte Alles synchronisieren.";
    setTeacherSyncState("error", teacherState.toast);
  } finally {
    teacherAutoSyncInProgress = false;
    persistTeacherState();
    renderTeacherApp();
  }
}

function watchTeacherServiceWorker(registration) {
  if (registration.waiting) {
    markTeacherUpdateReady();
  }

  registration.addEventListener("updatefound", () => {
    teacherState.updateState = "checking";
    teacherState.updateStatus = "Neue Version wird vorbereitet...";
    const worker = registration.installing;
    if (!worker) {
      renderTeacherApp();
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed") {
        if (navigator.serviceWorker.controller) {
          markTeacherUpdateReady();
        } else {
          teacherState.updateState = "ok";
          teacherState.updateStatus = "Lehrkräfte-App ist bereit und funktioniert auch offline.";
          renderTeacherApp();
        }
      }
    });
    renderTeacherApp();
  });
}

async function performTeacherAppReload() {
  if (teacherReloadInProgress) {
    return;
  }

  teacherReloadInProgress = true;
  setTeacherUpdateStatus("Update wird angewendet...", { showReload: true, stateName: "ready" });

  try {
    await teacherServiceWorkerRegistration?.update().catch(() => {});
    teacherServiceWorkerRegistration?.waiting?.postMessage?.({ type: "SKIP_WAITING" });
  } catch {
    // fallback reload below
  }

  window.setTimeout(() => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("reload", String(Date.now()));
    window.location.replace(nextUrl.toString());
  }, 140);
}

async function checkTeacherForUpdates(options = {}) {
  const {
    showChecking = true,
    silentNoChange = false,
    silentError = false,
  } = options;

  if (teacherUpdateInProgress) {
    return;
  }

  if (!teacherServiceWorkerRegistration) {
    if (!silentError) {
      setTeacherUpdateStatus("Update-Prüfung auf diesem Gerät nicht verfügbar.", { error: true });
    }
    return;
  }

  if (!navigator.onLine) {
    if (!silentError) {
      setTeacherUpdateStatus("Du musst bitte eine Internet-Verbindung aufbauen, um ein Update zu starten.", {
        error: true,
      });
    }
    return;
  }

  teacherUpdateInProgress = true;
  if (showChecking) {
    teacherState.updateState = "checking";
    teacherState.updateStatus = "Suche nach Updates...";
    renderTeacherApp();
  }

  try {
    await teacherServiceWorkerRegistration.update();
    const remoteVersion = await fetchTeacherVersionInfo();

    if (!remoteVersion.appVersion || !remoteVersion.cacheVersion) {
      if (!silentError) {
        setTeacherUpdateStatus("Versionsinformationen sind unvollständig. Bitte später erneut versuchen.", {
          error: true,
        });
      }
      return;
    }

    if (versionSignature(remoteVersion) === versionSignature(TEACHER_APP_VERSION_INFO)) {
      if (!silentNoChange) {
        setTeacherUpdateStatus("Die Lehrkräfte-App ist auf dem aktuellen Stand.", { stateName: "ok" });
      }
      return;
    }

    const remoteLabel = remoteVersion.label ? ` · ${remoteVersion.label}` : "";
    setTeacherUpdateStatus(
      `Neue Version gefunden: ${remoteVersion.appVersion} · ${remoteVersion.cacheVersion}${remoteLabel}. Bitte jetzt neu laden.`,
      { showReload: true, stateName: "ready" },
    );
  } catch {
    if (!silentError) {
      setTeacherUpdateStatus(
        "Update-Prüfung gerade nicht möglich. Bitte verbinde das Gerät kurz mit dem Internet und versuche es dann erneut.",
        { error: true },
      );
    }
  } finally {
    teacherUpdateInProgress = false;
  }
}

function registerTeacherServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    teacherState.updateStatus = "Update-Prüfung auf diesem Gerät nicht verfügbar.";
    teacherState.updateState = "error";
    renderTeacherApp();
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (teacherControllerReloadHandled) {
      return;
    }

    teacherControllerReloadHandled = true;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("reload", String(Date.now()));
    window.location.replace(nextUrl.toString());
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      teacherServiceWorkerRegistration = registration;
      watchTeacherServiceWorker(registration);
      await navigator.serviceWorker.ready.catch(() => registration);

      if (navigator.onLine) {
        void checkTeacherForUpdates({
          showChecking: false,
          silentNoChange: true,
          silentError: true,
        });
      }
    } catch {
      teacherState.updateStatus = "Update-Prüfung auf diesem Gerät nicht verfügbar.";
      teacherState.updateState = "error";
      renderTeacherApp();
    }
  });
}

function normalizeCardRule(rule) {
  const nextType = cardRuleTypes.includes(rule?.type) ? rule.type : "entriesCountAtLeast";
  const nextValue = nextType === "none"
    ? 0
    : nextType === "morningEntryOnce"
      ? 1
      : Math.max(1, Number(rule?.value) || 1);
  const category = nextType === "categoryUsed"
    ? `${rule?.category || getEffectivePracticeCategories()[0] || ""}`.trim()
    : "";

  return {
    type: nextType,
    value: nextValue,
    category,
  };
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

function getRuleTypeLabel(ruleType) {
  if (ruleType === "none") {
    return "Keine";
  }
  if (ruleType === "streakAtLeast") {
    return "Serie";
  }
  if (ruleType === "dayMinutesAtLeast") {
    return "Tagesminuten";
  }
  if (ruleType === "weekMinutesAtLeast") {
    return "Wochenminuten";
  }
  if (ruleType === "monthMinutesAtLeast") {
    return "Monatsminuten";
  }
  if (ruleType === "notedEntriesAtLeast") {
    return "Einträge mit Notiz";
  }
  if (ruleType === "categoryUsed") {
    return "Kategorie genutzt";
  }
  if (ruleType === "categoriesCountAtLeast") {
    return "Mehrere Kategorien";
  }
  if (ruleType === "morningEntryOnce") {
    return "Morgen-Eintrag";
  }
  if (ruleType === "entriesCountAtLeast") {
    return "Eintragsanzahl";
  }
  if (ruleType === "weekEntriesAtLeast") {
    return "Wochen-Einträge";
  }
  if (ruleType === "daysPracticedAtLeast") {
    return "Übetage";
  }

  return "Zielbedingung";
}

function getRuleTypeGuidance(rule = {}) {
  const normalizedType = rule.type || "entriesCountAtLeast";
  const value = Number(rule.value) || 0;
  const category = rule.category || "einer Kategorie";

  const guidanceMap = {
    none: {
    title: "Direkt verliehen ohne automatische Prüfung",
      text: "Dieses Kärtchen wird nicht durch Übedaten freigeschaltet. Es eignet sich für direkte Verleihungen mit persönlicher Notiz.",
      example: "Beispiel: Nach einem Vorspiel oder einer besonders konzentrierten Stunde direkt verleihen.",
    },
    streakAtLeast: {
      title: "Regelmäßigkeit in Folge",
      text: "Gezählt werden Tage hintereinander, an denen überhaupt geübt wurde. Schon ein kurzer Eintrag reicht für den Tag.",
      example: `Beispiel: Zielwert ${value || 5} bedeutet ${value || 5} Tage in Folge üben.`,
    },
    dayMinutesAtLeast: {
      title: "Zeit an einem einzelnen Tag",
      text: "Es zählt die gesamte Übezeit an einem Kalendertag, auch wenn sie auf mehrere Einträge verteilt ist.",
      example: `Beispiel: Zielwert ${value || 15} bedeutet insgesamt ${value || 15} Minuten an einem Tag.`,
    },
    weekMinutesAtLeast: {
      title: "Zeit innerhalb einer Woche",
      text: "Es zählt die Summe aller Einträge innerhalb einer Woche. Mehrere kurze Einheiten werden zusammengezählt.",
      example: `Beispiel: Zielwert ${value || 60} bedeutet insgesamt ${value || 60} Minuten in einer Woche.`,
    },
    monthMinutesAtLeast: {
      title: "Zeit innerhalb eines Monats",
      text: "Diese Regel belohnt längere Ausdauer über mehrere Wochen hinweg.",
      example: `Beispiel: Zielwert ${value || 240} bedeutet insgesamt ${value || 240} Minuten in einem Monat.`,
    },
    notedEntriesAtLeast: {
      title: "Mitdenken und reflektieren",
      text: "Gezählt werden nur Einträge, in denen die lernende Person zusätzlich eine Notiz hinterlässt.",
      example: `Beispiel: Zielwert ${value || 5} bedeutet ${value || 5} Einträge mit Notiz.`,
    },
    categoryUsed: {
      title: "Bestimmten Schwerpunkt üben",
      text: "Es werden nur Einträge gezählt, die genau dieser Übekategorie zugeordnet sind.",
      example: `Beispiel: Zielwert ${value || 3} bedeutet ${value || 3} Einträge in ${category}.`,
    },
    categoriesCountAtLeast: {
      title: "Abwechslung in den Schwerpunkten",
      text: "Die Lernenden sollen verschiedene Kategorien nutzen statt immer nur denselben Schwerpunkt.",
      example: `Beispiel: Zielwert ${value || 3} bedeutet ${value || 3} unterschiedliche Kategorien wurden genutzt.`,
    },
    morningEntryOnce: {
      title: "Früh am Tag üben",
      text: "Dieses Kärtchen wird freigeschaltet, sobald mindestens ein Eintrag vor 8 Uhr gespeichert wurde.",
      example: "Beispiel: Ein einziger Morgen-Eintrag reicht aus.",
    },
    entriesCountAtLeast: {
      title: "Einfach dranbleiben",
      text: "Gezählt wird nur die Anzahl der gespeicherten Einträge, unabhängig von Dauer oder Kategorie.",
      example: `Beispiel: Zielwert ${value || 10} bedeutet ${value || 10} gespeicherte Einträge.`,
    },
    weekEntriesAtLeast: {
      title: "Mehrfach in einer Woche üben",
      text: "Hier geht es nicht um Minuten, sondern darum, wie oft in einer Woche geübt und eingetragen wurde.",
      example: `Beispiel: Zielwert ${value || 4} bedeutet ${value || 4} Einträge in derselben Woche.`,
    },
    daysPracticedAtLeast: {
      title: "Viele einzelne Übetage sammeln",
      text: "Gezählt werden unterschiedliche Kalendertage mit mindestens einem Eintrag.",
      example: `Beispiel: Zielwert ${value || 10} bedeutet ${value || 10} verschiedene Übetage.`,
    },
  };

  return guidanceMap[normalizedType] || {
    title: "Zielbedingung festlegen",
    text: "Die Zielbedingung beschreibt, was die Lernenden erreichen sollen.",
    example: "Wähle eine passende Bedingung und einen klaren Zielwert.",
  };
}

function formatTeacherDateTime(value) {
  if (!value) {
    return "Noch nicht synchronisiert";
  }

  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setTeacherSyncState(syncState, detail = "", options = {}) {
  teacherState.syncState = syncState;
  teacherState.syncStateDetail = detail;
  if (options.markSynced) {
    teacherState.lastServerSyncAt = new Date().toISOString();
  }
}

function describeTeacherSyncState() {
  if (!teacherState.syncTeacherKey) {
    return {
      tone: "idle",
      title: "Noch kein Serverzugang hinterlegt",
    text: "Sobald Lehrkräfte-Key und Basis-URL gespeichert sind, können Lernende, Unterrichte und Kärtchen mit dem Server abgeglichen werden.",
    };
  }

  if (teacherAutoSyncInProgress) {
    return {
      tone: "running",
      title: "Server-Sync läuft gerade",
      text: teacherState.syncStateDetail || "Lokale Änderungen werden im Hintergrund an den Server übertragen.",
    };
  }

  if (teacherState.syncState === "error") {
    return {
      tone: "error",
      title: "Server-Sync braucht Aufmerksamkeit",
      text: teacherState.syncStateDetail || "Der letzte Abgleich hat nicht vollständig geklappt.",
    };
  }

  if (teacherState.syncState === "pending") {
    return {
      tone: "pending",
      title: "Lokale Änderungen warten auf den Server",
    text: teacherState.syncStateDetail || "Bitte kurz synchronisieren, damit Verbindungen, Unterrichte und Kärtchen sicher auf dem Server landen.",
    };
  }

  if (teacherState.lastServerSyncAt) {
    return {
      tone: "ok",
      title: "Serverstand aktuell",
      text: teacherState.syncStateDetail || `Zuletzt vollständig synchronisiert am ${formatTeacherDateTime(teacherState.lastServerSyncAt)}.`,
    };
  }

  return {
    tone: "idle",
    title: "Bereit für den ersten Server-Sync",
    text: "Nach dem ersten Abgleich stehen Verbindungscode, Kärtchen und Unterrichte auch serverseitig bereit.",
  };
}

function normalizeTeacherCard(card) {
  const rule = normalizeCardRule(card?.rule);
  const assignment = {
    type: ["all", "class", "student"].includes(card?.assignment?.type) ? card.assignment.type : "all",
    targetId: `${card?.assignment?.targetId || ""}`.trim(),
  };
  return {
    id: `${card?.id || createId("card")}`,
    title: `${card?.title || "Neues Kärtchen"}`.trim() || "Neues Kärtchen",
    description: `${card?.description || describeRule(rule)}`.trim() || describeRule(rule),
    accent: cardAccentOptions.includes(card?.accent) ? card.accent : "gold",
    symbol: `${card?.symbol || "✦"}`.trim().slice(0, 2) || "✦",
    rarity: cardRarityOptions.includes(card?.rarity) ? card.rarity : "Spezial",
    status: card?.status === "inactive" ? "inactive" : "active",
    source: "teacher",
    ownerScope: card?.ownerScope === "global" ? "global" : "teacher",
    awardCount: Math.max(0, Number(card?.awardCount) || 0),
    assignment,
    rule,
    createdAt: card?.createdAt || new Date().toISOString(),
    updatedAt: card?.updatedAt || new Date().toISOString(),
  };
}

function normalizeSyncBaseUrl(value) {
  const normalized = `${value || ""}`.trim();
  return normalized.replace(/\/+$/, "") || DEFAULT_SYNC_BASE_URL;
}

function emptyCardDraft() {
  return {
    id: "",
    title: "",
    description: "",
    accent: "gold",
    symbol: "✦",
    rarity: "Spezial",
    status: "active",
    ownerScope: "teacher",
    assignment: {
      type: "all",
      targetId: "",
    },
    rule: {
      type: "entriesCountAtLeast",
      value: 5,
      category: "",
    },
  };
}

function summarizeCardRule(card) {
  const description = describeRule(card.rule);
  let audience = "Für alle";
  if (card.assignment?.type === "class") {
    audience = `Klasse: ${getClassName(card.assignment.targetId)}`;
  } else if (card.assignment?.type === "student") {
    const student = teacherState.students.find((item) => item.studentId === card.assignment.targetId);
    audience = student ? `Person: ${getDisplayName(student)}` : "Person individuell";
  }

  const base = `${description} · ${audience}`;
  return card.status === "inactive" ? `${base} · pausiert` : base;
}

function buildRuleMeaningText(rule = {}) {
  const normalizedRule = normalizeCardRule(rule);
  const value = Number(normalizedRule.value) || 0;
  const category = normalizedRule.category || "einer Kategorie";

  if (normalizedRule.type === "none") {
    return "Bedeutet: Dieses Kärtchen wird nicht automatisch freigeschaltet, sondern nur direkt verliehen.";
  }

  if (normalizedRule.type === "streakAtLeast") {
    return `Bedeutet: Die lernende Person muss ${value || 5} Tage in Folge üben.`;
  }

  if (normalizedRule.type === "dayMinutesAtLeast") {
    return `Bedeutet: An einem einzelnen Tag müssen insgesamt ${value || 15} Minuten zusammenkommen.`;
  }

  if (normalizedRule.type === "weekMinutesAtLeast") {
    return `Bedeutet: In einer Woche müssen insgesamt ${value || 60} Minuten zusammenkommen.`;
  }

  if (normalizedRule.type === "monthMinutesAtLeast") {
    return `Bedeutet: In einem Monat müssen insgesamt ${value || 240} Minuten zusammenkommen.`;
  }

  if (normalizedRule.type === "notedEntriesAtLeast") {
    return `Bedeutet: Es braucht ${value || 5} Einträge mit Notiz.`;
  }

  if (normalizedRule.type === "categoryUsed") {
    return `Bedeutet: Es braucht ${value || 3} Einträge in ${category}.`;
  }

  if (normalizedRule.type === "categoriesCountAtLeast") {
    return `Bedeutet: Es müssen mindestens ${value || 3} verschiedene Kategorien genutzt werden.`;
  }

  if (normalizedRule.type === "morningEntryOnce") {
    return "Bedeutet: Ein einziger Eintrag vor 8 Uhr schaltet dieses Kärtchen frei.";
  }

  if (normalizedRule.type === "entriesCountAtLeast") {
    return `Bedeutet: Es braucht ${value || 10} gespeicherte Einträge.`;
  }

  if (normalizedRule.type === "weekEntriesAtLeast") {
    return `Bedeutet: Es braucht ${value || 4} Einträge innerhalb derselben Woche.`;
  }

  if (normalizedRule.type === "daysPracticedAtLeast") {
    return `Bedeutet: Es braucht ${value || 10} verschiedene Übetage.`;
  }

  return "Bedeutet: Diese Zielbedingung wird automatisch mit den Übedaten der Lernenden-App geprüft.";
}

function pickStarterCategory(preferred, fallbackIndex = 0) {
  const categories = getEffectivePracticeCategories();
  if (categories.includes(preferred)) {
    return preferred;
  }

  return categories[fallbackIndex] || categories[0] || "";
}

function buildStarterCardSet() {
  const now = new Date().toISOString();
  const makeCard = (id, title, description, accent, symbol, rarity, rule) =>
    normalizeTeacherCard({
      id,
      title,
      description,
      accent,
      symbol,
      rarity,
      status: "active",
      assignment: { type: "all", targetId: "" },
      rule,
      createdAt: now,
      updatedAt: now,
    });

  return [
    makeCard("starter-serie-3", "Warm gespielt", "3 Tage hintereinander geübt", "apricot", "♬", "Bronze", { type: "streakAtLeast", value: 3 }),
    makeCard("starter-serie-7", "Dranbleiber", "7 Tage hintereinander geübt", "gold", "✦", "Gold", { type: "streakAtLeast", value: 7 }),
    makeCard("starter-tag-15", "15-Minuten-Fokus", "15 Minuten an einem Tag geschafft", "sky", "◔", "Basis", { type: "dayMinutesAtLeast", value: 15 }),
    makeCard("starter-tag-30", "Halbe Stunde Klang", "30 Minuten an einem Tag geschafft", "mint", "◕", "Silber", { type: "dayMinutesAtLeast", value: 30 }),
    makeCard("starter-woche-45", "Wochenstarter", "45 Minuten in einer Woche gesammelt", "apricot", "☀", "Basis", { type: "weekMinutesAtLeast", value: 45 }),
    makeCard("starter-woche-90", "Wochenklang", "90 Minuten in einer Woche gesammelt", "gold", "✶", "Silber", { type: "weekMinutesAtLeast", value: 90 }),
    makeCard("starter-monat-180", "Monatsbogen", "180 Minuten in einem Monat gesammelt", "sky", "◌", "Silber", { type: "monthMinutesAtLeast", value: 180 }),
    makeCard("starter-monat-360", "Monatsmeister", "360 Minuten in einem Monat gesammelt", "gold", "✹", "Gold", { type: "monthMinutesAtLeast", value: 360 }),
    makeCard("starter-eintraege-5", "Notenfest", "5 Einträge gespeichert", "apricot", "☑", "Basis", { type: "entriesCountAtLeast", value: 5 }),
    makeCard("starter-eintraege-12", "Übetagebuch", "12 Einträge gespeichert", "mint", "☰", "Silber", { type: "entriesCountAtLeast", value: 12 }),
    makeCard("starter-wocheneintraege-3", "Aktive Woche", "3 Einträge in einer Woche", "sky", "≋", "Bronze", { type: "weekEntriesAtLeast", value: 3 }),
    makeCard("starter-wocheneintraege-5", "Volle Woche", "5 Einträge in einer Woche", "gold", "▤", "Gold", { type: "weekEntriesAtLeast", value: 5 }),
    makeCard("starter-notizen-3", "Klangnotizen", "3 Einträge mit Notiz", "mint", "✎", "Bronze", { type: "notedEntriesAtLeast", value: 3 }),
    makeCard("starter-notizen-8", "Reflexionsprofi", "8 Einträge mit Notiz", "gold", "✍", "Spezial", { type: "notedEntriesAtLeast", value: 8 }),
    makeCard("starter-morgen", "Morgenklang", "Vor 8 Uhr geübt", "sky", "☀", "Silber", { type: "morningEntryOnce", value: 1 }),
    makeCard("starter-technik", "Technik im Griff", `${pickStarterCategory("Technik")} bewusst genutzt`, "apricot", "⚙", "Basis", { type: "categoryUsed", value: 2, category: pickStarterCategory("Technik") }),
    makeCard("starter-stueck", "Am Stück dran", `${pickStarterCategory("Stück", 1)} mehrfach genutzt`, "mint", "♫", "Bronze", { type: "categoryUsed", value: 2, category: pickStarterCategory("Stück", 1) }),
    makeCard("starter-freies-spiel", "Freier Klang", `${pickStarterCategory("Freies Spiel", 2)} entdeckt`, "sky", "★", "Spezial", { type: "categoryUsed", value: 1, category: pickStarterCategory("Freies Spiel", 2) }),
    makeCard("starter-kategorien-3", "Vielseitig", "3 verschiedene Kategorien genutzt", "apricot", "⬢", "Silber", { type: "categoriesCountAtLeast", value: 3 }),
    makeCard("starter-uebetage-10", "Treue Töne", "10 Übetage gesammelt", "gold", "❋", "Gold", { type: "daysPracticedAtLeast", value: 10 }),
  ];
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  teacherState.installPrompt = event;
  teacherState.installReady = true;
  renderTeacherApp();
});

window.addEventListener("appinstalled", () => {
  teacherState.installPrompt = null;
  teacherState.installReady = false;
  teacherState.toast = "Lehrkräfte-App installiert.";
  renderTeacherApp();
});

function hydrateTeacherState() {
  try {
    const raw = window.localStorage.getItem(TEACHER_STORAGE_KEY);
    if (!raw) {
      persistTeacherState();
      return;
    }

    const parsed = JSON.parse(raw);
    teacherState.classes = Array.isArray(parsed.classes) ? parsed.classes : [];
    teacherState.students = Array.isArray(parsed.students) ? parsed.students.map(normalizeTeacherStudent) : [];
    teacherState.cardLibrary = Array.isArray(parsed.cardLibrary)
      ? parsed.cardLibrary.map(normalizeTeacherCard)
      : [];
    teacherState.feedbackRounds = Array.isArray(parsed.feedbackRounds) ? parsed.feedbackRounds : [];
    teacherState.practiceCategories = normalizePracticeCategories(parsed.practiceCategories);
    teacherState.selectedClassId = parsed.selectedClassId || "all";
    teacherState.selectedStudentId = parsed.selectedStudentId || "";
    teacherState.selectedCardId = parsed.selectedCardId || "";
    teacherState.selectedFeedbackRoundId = parsed.selectedFeedbackRoundId || "";
    teacherState.currentWorkspace = teacherWorkspaces.some((item) => item.id === parsed.currentWorkspace)
      ? parsed.currentWorkspace
      : "overview";
    teacherState.sidebarCollapsed = Boolean(parsed.sidebarCollapsed);
    teacherState.classDraft = typeof parsed.classDraft === "string" ? parsed.classDraft : "";
    teacherState.studentFormDraft = parsed.studentFormDraft && typeof parsed.studentFormDraft === "object"
      ? parsed.studentFormDraft
      : null;
    teacherState.cardFormDraft = parsed.cardFormDraft && typeof parsed.cardFormDraft === "object"
      ? parsed.cardFormDraft
      : null;
    teacherState.practiceCategoriesDraft = typeof parsed.practiceCategoriesDraft === "string" ? parsed.practiceCategoriesDraft : "";
    teacherState.manualAwardDraft = parsed.manualAwardDraft && typeof parsed.manualAwardDraft === "object"
      ? parsed.manualAwardDraft
      : null;
    teacherState.statusLine = parsed.statusLine || "Bereit.";
    teacherState.statusLineUpdatedAt = Number(parsed.statusLineUpdatedAt) || 0;
    teacherState.lastImportSummary = parsed.lastImportSummary || "Noch keine Berichtspakete importiert.";
    teacherState.syncBaseUrl = normalizeSyncBaseUrl(parsed.syncBaseUrl || DEFAULT_SYNC_BASE_URL);
    teacherState.syncTeacherKey = parsed.syncTeacherKey || "";
    teacherState.syncTeacherLabel = parsed.syncTeacherLabel || "";
    teacherState.lastServerSyncAt = parsed.lastServerSyncAt || "";
    teacherState.syncState = ["idle", "pending", "running", "ok", "error"].includes(parsed.syncState) ? parsed.syncState : "idle";
    teacherState.syncStateDetail = parsed.syncStateDetail || "";
    if (
      teacherState.statusLine !== "Bereit."
      && (!teacherState.statusLineUpdatedAt || (Date.now() - teacherState.statusLineUpdatedAt) >= STATUS_LINE_TTL_MS)
    ) {
      teacherState.statusLine = "Bereit.";
      teacherState.statusLineUpdatedAt = 0;
    }
  } catch {
    Object.assign(teacherState, defaultTeacherState());
  }
}

function persistTeacherState() {
  window.localStorage.setItem(
    TEACHER_STORAGE_KEY,
    JSON.stringify({
      classes: teacherState.classes,
      students: teacherState.students,
      cardLibrary: teacherState.cardLibrary,
      feedbackRounds: teacherState.feedbackRounds,
      practiceCategories: teacherState.practiceCategories,
      selectedClassId: teacherState.selectedClassId,
      selectedStudentId: teacherState.selectedStudentId,
      selectedCardId: teacherState.selectedCardId,
      selectedFeedbackRoundId: teacherState.selectedFeedbackRoundId,
      currentWorkspace: teacherState.currentWorkspace,
      sidebarCollapsed: teacherState.sidebarCollapsed,
      classDraft: teacherState.classDraft,
      studentFormDraft: teacherState.studentFormDraft,
      cardFormDraft: teacherState.cardFormDraft,
      practiceCategoriesDraft: teacherState.practiceCategoriesDraft,
      manualAwardDraft: teacherState.manualAwardDraft,
      statusLine: teacherState.statusLine,
      statusLineUpdatedAt: teacherState.statusLineUpdatedAt,
      lastImportSummary: teacherState.lastImportSummary,
      syncBaseUrl: teacherState.syncBaseUrl,
      syncTeacherKey: teacherState.syncTeacherKey,
      syncTeacherLabel: teacherState.syncTeacherLabel,
      lastServerSyncAt: teacherState.lastServerSyncAt,
      syncState: teacherState.syncState,
      syncStateDetail: teacherState.syncStateDetail,
    }),
  );
}

function scheduleTeacherStatusLineReset() {
  if (teacherStatusLineTimeout) {
    window.clearTimeout(teacherStatusLineTimeout);
    teacherStatusLineTimeout = null;
  }

  if (teacherState.statusLine === "Bereit.") {
    return;
  }

  const updatedAt = Number(teacherState.statusLineUpdatedAt) || Date.now();
  const remainingMs = STATUS_LINE_TTL_MS - (Date.now() - updatedAt);

  if (remainingMs <= 0) {
    teacherState.statusLine = "Bereit.";
    teacherState.statusLineUpdatedAt = 0;
    persistTeacherState();
    renderTeacherApp();
    return;
  }

  teacherStatusLineTimeout = window.setTimeout(() => {
    teacherStatusLineTimeout = null;
    if (teacherState.statusLine === "Bereit.") {
      return;
    }
    teacherState.statusLine = "Bereit.";
    teacherState.statusLineUpdatedAt = 0;
    persistTeacherState();
    renderTeacherApp();
  }, remainingMs);
}

function normalizeTeacherStudent(student) {
  return {
    studentId: student.studentId || createId("student"),
    studentUuid: student.studentUuid || "",
    profileUuid: student.profileUuid || "",
    importedDisplayName: student.importedDisplayName || student.profileName || "Unbekannt",
    importedInstrument: student.importedInstrument || student.instrument || "",
    importedGoal: Number(student.importedGoal ?? student.goal) || 0,
    profileLabel: student.profileLabel || student.importedInstrument || student.instrument || "Profil",
    connectCode: `${student.connectCode || ""}`.trim(),
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    email: student.email || "",
    messengerId: student.messengerId || "",
    classId: student.classId || "",
    entries: Array.isArray(student.entries) ? student.entries : [],
    latestChecksum: student.latestChecksum || "",
    latestReportLabel: student.latestReportLabel || "",
    latestReportRange: student.latestReportRange || "week",
    latestReportMinutes: Number(student.latestReportMinutes) || 0,
    latestReportUniqueDaysCount: Number(student.latestReportUniqueDaysCount) || 0,
    latestReportNotedCount: Number(student.latestReportNotedCount) || 0,
    latestReportStreak: Number(student.latestReportStreak) || 0,
    unlockedCards: Array.isArray(student.unlockedCards) ? student.unlockedCards : [],
    awardedCards: Array.isArray(student.awardedCards) ? student.awardedCards : [],
    recentReports: Array.isArray(student.recentReports) ? student.recentReports : [],
    reportsReceived: Number(student.reportsReceived) || 0,
    lastImportedAt: student.lastImportedAt || "",
  };
}

function getDisplayName(student) {
  const fullName = `${student.firstName} ${student.lastName}`.trim();
  return student.importedDisplayName || fullName || "Unbekannt";
}

function getFormalName(student) {
  return `${student.firstName || ""} ${student.lastName || ""}`.trim();
}

function renderStudentNameBlock(student, meta = "", note = "") {
  const displayName = getDisplayName(student);
  const formalName = getFormalName(student);
  const showFormalName = formalName && formalName !== displayName;

  return `
    <div class="teacher-student-name-block">
      <strong>${escapeHtml(displayName)}</strong>
      ${showFormalName ? `<small class="teacher-student-formal-name">${escapeHtml(formalName)}</small>` : ""}
      ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
      ${note ? `<small class="teacher-student-meta-note">${escapeHtml(note)}</small>` : ""}
    </div>
  `;
}

function renderTeacherIdentityLine() {
  if (teacherState.syncTeacherLabel) {
    return `<p class="teacher-identity-line"><strong>Angemeldet als</strong> ${escapeHtml(teacherState.syncTeacherLabel)}</p>`;
  }

  return `<p class="teacher-identity-line is-muted"><strong>Angemeldet als</strong> Noch keine Lehrkraft vom Server geladen</p>`;
}

function renderHelpTrigger(topic, label = "Hilfe") {
  return `<button class="teacher-help-trigger" type="button" data-help-topic="${escapeHtml(topic)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">?</button>`;
}

function getStudentFormValues(activeStudent) {
  if (!activeStudent) {
    return null;
  }

  const draft = teacherState.studentFormDraft;
  if (!draft || draft.studentId !== activeStudent.studentId) {
    return {
      importedDisplayName: activeStudent.importedDisplayName || "",
      firstName: activeStudent.firstName || "",
      lastName: activeStudent.lastName || "",
      email: activeStudent.email || "",
      messengerId: activeStudent.messengerId || "",
      classId: activeStudent.classId || "",
      profileLabel: activeStudent.profileLabel || "",
      importedInstrument: activeStudent.importedInstrument || "",
      importedGoal: String(activeStudent.importedGoal || 15),
    };
  }

  return {
    importedDisplayName: draft.importedDisplayName ?? activeStudent.importedDisplayName ?? "",
    firstName: draft.firstName ?? activeStudent.firstName ?? "",
    lastName: draft.lastName ?? activeStudent.lastName ?? "",
    email: draft.email ?? activeStudent.email ?? "",
    messengerId: draft.messengerId ?? activeStudent.messengerId ?? "",
    classId: draft.classId ?? activeStudent.classId ?? "",
    profileLabel: draft.profileLabel ?? activeStudent.profileLabel ?? "",
    importedInstrument: draft.importedInstrument ?? activeStudent.importedInstrument ?? "",
    importedGoal: draft.importedGoal ?? String(activeStudent.importedGoal || 15),
  };
}

function getCurrentCardDraftContextId(activeCard) {
  return activeCard?.id || "__new__";
}

function getCardFormValues(activeCard) {
  const base = activeCard ? normalizeTeacherCard(activeCard) : emptyCardDraft();
  const draft = teacherState.cardFormDraft;
  if (!draft || draft.contextId !== getCurrentCardDraftContextId(activeCard)) {
    return base;
  }

  return normalizeTeacherCard({
    ...base,
    title: draft.title ?? base.title,
    description: draft.description ?? base.description,
    accent: draft.accent ?? base.accent,
    symbol: draft.symbol ?? base.symbol,
    rarity: draft.rarity ?? base.rarity,
    status: draft.status ?? base.status,
    assignment: {
      ...base.assignment,
      type: draft.assignmentType ?? base.assignment.type,
      targetId: draft.assignmentTargetId ?? base.assignment.targetId,
    },
    rule: {
      ...base.rule,
      type: draft.ruleType ?? base.rule.type,
      value: Number(draft.ruleValue ?? base.rule.value) || 0,
      category: draft.ruleCategory ?? base.rule.category,
    },
  });
}

function getPracticeCategoriesTextareaValue() {
  return teacherState.practiceCategoriesDraft || getEffectivePracticeCategories().join("\n");
}

function getManualAwardFormValues(activeCard, selectedLearner) {
  const base = {
    studentId: selectedLearner?.studentId || "",
    note: "",
  };
  const draft = teacherState.manualAwardDraft;
  if (!activeCard || !draft || draft.cardId !== activeCard.id) {
    return base;
  }
  return {
    studentId: draft.studentId ?? base.studentId,
    note: draft.note ?? "",
  };
}

function getTeacherHelpTopic(topic) {
  return teacherHelpTopics[topic] || {
    eyebrow: "Hilfe",
    title: "Hinweis",
    text: "Für diesen Bereich ist noch keine eigene Erklärung hinterlegt.",
    bullets: [],
  };
}

function getPersonId(student) {
  return student.studentUuid || `person-${student.studentId}`;
}

function groupedStudents(students = teacherState.students) {
  const groups = new Map();
  students.forEach((student) => {
    const personId = getPersonId(student);
    const existing = groups.get(personId) || {
      personId,
      displayName: getDisplayName(student),
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      classId: student.classId || "",
      profiles: [],
    };
    existing.displayName = existing.displayName || getDisplayName(student);
    existing.firstName = existing.firstName || student.firstName || "";
    existing.lastName = existing.lastName || student.lastName || "";
    existing.classId = existing.classId || student.classId || "";
    existing.profiles.push(student);
    groups.set(personId, existing);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      profiles: group.profiles.sort((a, b) => (a.profileLabel || a.importedInstrument || "").localeCompare((b.profileLabel || b.importedInstrument || ""), "de")),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "de"));
}

function getClassName(classId) {
  if (!classId) {
    return "Ohne Klasse";
  }

  return teacherState.classes.find((item) => item.id === classId)?.name || "Ohne Klasse";
}

function getProfileDescriptor(student) {
  const profileLabel = `${student.profileLabel || ""}`.trim();
  const instrument = `${student.importedInstrument || ""}`.trim();

  if (profileLabel && instrument && profileLabel.toLowerCase() !== instrument.toLowerCase()) {
    return `${profileLabel} · ${instrument}`;
  }

  return profileLabel || instrument || "Unterricht";
}

function getPersonProfileSummary(person) {
  const labels = [...new Set(
    (person.profiles || [])
      .map((student) => getProfileDescriptor(student))
      .filter(Boolean),
  )];

  return labels.join(" · ");
}

function filteredStudents() {
  if (teacherState.selectedClassId === "all") {
    return teacherState.students;
  }

  return teacherState.students.filter((student) => (student.classId || "") === teacherState.selectedClassId);
}

function selectedStudent() {
  return teacherState.students.find((student) => student.studentId === teacherState.selectedStudentId) || null;
}

function selectedPersonProfiles() {
  const activeStudent = selectedStudent();
  if (!activeStudent) {
    return [];
  }

  return teacherState.students
    .filter((student) => getPersonId(student) === getPersonId(activeStudent))
    .sort((a, b) => (a.profileLabel || a.importedInstrument || "").localeCompare((b.profileLabel || b.importedInstrument || ""), "de"));
}

function selectedCard() {
  return teacherState.cardLibrary.find((card) => card.id === teacherState.selectedCardId) || null;
}

function getAwardedCardsForCard(cardOrId) {
  const cardId = typeof cardOrId === "string"
    ? cardOrId.trim()
    : `${cardOrId?.id || ""}`.trim();
  const cardTitle = typeof cardOrId === "string"
    ? ""
    : `${cardOrId?.title || ""}`.trim();
  if (!cardId) {
    return [];
  }

  const awardedCards = teacherState.students
    .flatMap((student) => (student.awardedCards || []).map((award) => ({
      ...award,
      studentId: student.studentId,
    profileLabel: student.profileLabel || student.importedInstrument || "Unterricht",
      studentName: getDisplayName(student),
    })))
    .sort((a, b) => `${b.awardedAt || ""}`.localeCompare(`${a.awardedAt || ""}`));

  const idMatches = awardedCards.filter((award) => `${award.cardId || ""}`.trim() === cardId);
  if (idMatches.length || !cardTitle) {
    return idMatches;
  }

  const normalizedTitle = cardTitle.toLocaleLowerCase("de-DE");
  const uniqueTitleMatch = teacherState.cardLibrary.filter(
    (card) => `${card.title || ""}`.trim().toLocaleLowerCase("de-DE") === normalizedTitle,
  ).length === 1;

  if (!uniqueTitleMatch) {
    return [];
  }

  return awardedCards.filter(
    (award) => `${award.title || ""}`.trim().toLocaleLowerCase("de-DE") === normalizedTitle,
  );
}

function selectedClass() {
  return teacherState.selectedClassId === "all"
    ? null
    : teacherState.classes.find((item) => item.id === teacherState.selectedClassId) || null;
}

function createEmptyTeacherStudent() {
  const classId = teacherState.selectedClassId !== "all" ? teacherState.selectedClassId : "";
  return normalizeTeacherStudent({
    studentId: createId("student"),
    studentUuid: createId("student-uuid"),
    profileUuid: createId("profile"),
    importedDisplayName: "Neue lernende Person",
    importedInstrument: "",
    importedGoal: 15,
  profileLabel: "Hauptunterricht",
    firstName: "",
    lastName: "",
    email: "",
    messengerId: "",
    classId,
    entries: [],
    latestChecksum: "",
    latestReportLabel: "",
    latestReportRange: "week",
    latestReportMinutes: 0,
    latestReportUniqueDaysCount: 0,
    latestReportNotedCount: 0,
    latestReportStreak: 0,
    unlockedCards: [],
    awardedCards: [],
    reportsReceived: 0,
    lastImportedAt: "",
  });
}

function createSiblingTeacherProfile(student) {
  return normalizeTeacherStudent({
    ...student,
    studentId: createId("student"),
    profileUuid: createId("profile"),
    importedInstrument: "",
    importedGoal: 15,
  profileLabel: `Unterricht ${selectedPersonProfiles().length + 1}`,
    entries: [],
    latestChecksum: "",
    latestReportLabel: "",
    latestReportRange: "week",
    latestReportMinutes: 0,
    latestReportUniqueDaysCount: 0,
    latestReportNotedCount: 0,
    latestReportStreak: 0,
    unlockedCards: [],
    awardedCards: [],
    reportsReceived: 0,
    lastImportedAt: "",
  });
}

function mergeEntries(existingEntries, importedEntries) {
  const map = new Map(existingEntries.map((entry) => [entry.id, entry]));
  importedEntries.forEach((entry) => {
    if (!entry?.id) {
      return;
    }

    map.set(entry.id, {
      id: entry.id,
      date: entry.date,
      instrument: entry.instrument,
      minutes: Number(entry.minutes) || 0,
      category: entry.category,
      note: entry.note || "",
      savedAt: entry.savedAt,
    });
  });

  return [...map.values()].sort((a, b) => `${b.savedAt}`.localeCompare(`${a.savedAt}`));
}

function mergeStudents(targetStudentId, sourceStudentId) {
  if (!targetStudentId || !sourceStudentId || targetStudentId === sourceStudentId) {
    return false;
  }

  const target = teacherState.students.find((student) => student.studentId === targetStudentId);
  const source = teacherState.students.find((student) => student.studentId === sourceStudentId);
  if (!target || !source) {
    return false;
  }

  const merged = normalizeTeacherStudent({
    ...target,
    importedDisplayName: target.importedDisplayName || source.importedDisplayName,
    importedInstrument: target.importedInstrument || source.importedInstrument,
    importedGoal: target.importedGoal || source.importedGoal,
    firstName: target.firstName || source.firstName,
    lastName: target.lastName || source.lastName,
    email: target.email || source.email,
    messengerId: target.messengerId || source.messengerId,
    classId: target.classId || source.classId,
    entries: mergeEntries(target.entries, source.entries),
    latestChecksum: target.lastImportedAt >= source.lastImportedAt ? target.latestChecksum : source.latestChecksum,
    latestReportLabel: target.lastImportedAt >= source.lastImportedAt ? target.latestReportLabel : source.latestReportLabel,
    latestReportRange: target.lastImportedAt >= source.lastImportedAt ? target.latestReportRange : source.latestReportRange,
    latestReportMinutes: Math.max(target.latestReportMinutes, source.latestReportMinutes),
    latestReportUniqueDaysCount: Math.max(target.latestReportUniqueDaysCount, source.latestReportUniqueDaysCount),
    latestReportNotedCount: Math.max(target.latestReportNotedCount, source.latestReportNotedCount),
    latestReportStreak: Math.max(target.latestReportStreak, source.latestReportStreak),
    unlockedCards: [...new Map([...target.unlockedCards, ...source.unlockedCards].map((card) => [card.id, card])).values()],
    awardedCards: [...new Map([...(target.awardedCards || []), ...(source.awardedCards || [])].map((award) => [award.awardId || `${award.cardId}-${award.awardedAt}`, award])).values()],
    reportsReceived: target.reportsReceived + source.reportsReceived,
    lastImportedAt: [target.lastImportedAt, source.lastImportedAt].filter(Boolean).sort().reverse()[0] || "",
  });

  teacherState.students = teacherState.students
    .filter((student) => student.studentId !== sourceStudentId)
    .map((student) => (student.studentId === targetStudentId ? merged : student));
  teacherState.selectedStudentId = targetStudentId;
  return true;
}

function parseReportPackage(text) {
  const parsed = JSON.parse(text);
  const checksum = parsed?.checksum;
  const payload = parsed?.kind
    ? {
        kind: parsed.kind,
        exportedAt: parsed.exportedAt,
        appVersion: parsed.appVersion,
        student: parsed.student,
        report: parsed.report,
      }
    : null;

  if (!payload || payload.kind !== "fleisstakt-berichtspaket") {
    throw new Error("ungueltiges-paket");
  }

  if (!checksum || createChecksum(payload) !== checksum) {
    throw new Error("ungueltige-pruefsumme");
  }

  if (!payload.student?.studentId || !Array.isArray(payload.report?.entries)) {
    throw new Error("ungueltiges-paket");
  }

  return { ...payload, checksum };
}

function mergeReportPackage(pkg) {
  const existing = teacherState.students.find((student) => student.studentId === pkg.student.studentId);
  const nextStudent = normalizeTeacherStudent({
    ...existing,
    studentId: pkg.student.studentId,
    importedDisplayName: pkg.student.displayName || existing?.importedDisplayName || "Unbekannt",
    importedInstrument: pkg.student.instrument || existing?.importedInstrument || "",
    importedGoal: Number(pkg.student.goal) || existing?.importedGoal || 0,
    entries: mergeEntries(existing?.entries || [], pkg.report.entries),
    latestChecksum: pkg.checksum,
    latestReportLabel: pkg.report.label || "",
    latestReportRange: pkg.report.range || "week",
    latestReportMinutes: Number(pkg.report.minutes) || 0,
    latestReportUniqueDaysCount: Number(pkg.report.uniqueDaysCount) || 0,
    latestReportNotedCount: Number(pkg.report.notedCount) || 0,
    latestReportStreak: Number(pkg.report.streak) || 0,
    unlockedCards: Array.isArray(pkg.report.unlockedCards) ? pkg.report.unlockedCards : [],
    reportsReceived: (existing?.reportsReceived || 0) + (existing?.latestChecksum === pkg.checksum ? 0 : 1),
    lastImportedAt: pkg.exportedAt || new Date().toISOString(),
  });

  if (existing) {
    teacherState.students = teacherState.students.map((student) =>
      student.studentId === nextStudent.studentId ? nextStudent : student,
    );
  } else {
    teacherState.students = [nextStudent, ...teacherState.students];
  }

  teacherState.selectedStudentId = nextStudent.studentId;
  return { created: !existing };
}

async function importReportFiles(files) {
  let created = 0;
  let updated = 0;
  let rejected = 0;

  for (const file of files) {
    try {
      const pkg = parseReportPackage(await file.text());
      const result = mergeReportPackage(pkg);
      if (result.created) {
        created += 1;
      } else {
        updated += 1;
      }
    } catch {
      rejected += 1;
    }
  }

  teacherState.lastImportSummary = `${created} neu, ${updated} aktualisiert, ${rejected} abgelehnt.`;
  teacherState.statusLine = rejected
    ? "Berichtspakete mit Hinweisen verarbeitet."
    : "Berichtspakete zuletzt erfolgreich importiert.";
  teacherState.toast = rejected
    ? "Einige Berichtspakete wurden wegen ungültiger Prüfsumme oder Struktur abgelehnt."
    : "Berichtspakete erfolgreich importiert.";
  persistTeacherState();
  renderTeacherApp();
}

async function fetchTeacherSyncSnapshot() {
  if (!teacherState.syncTeacherKey) {
    throw new Error("fehlender-teacher-key");
  }

  const cacheBust = `t=${Date.now()}`;
  const separator = teacherState.syncBaseUrl.includes("?") ? "&" : "?";
  const response = await fetch(`${teacherState.syncBaseUrl}/teacher-sync${separator}${cacheBust}`, {
    cache: "no-store",
    headers: {
      "X-FleissTakt-Teacher-Key": teacherState.syncTeacherKey,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.snapshot) {
    throw new Error(data?.message || "teacher-sync-fehlgeschlagen");
  }
  return data.snapshot;
}

function exportTeacherRosterSyncPayload() {
  const payload = {
    kind: "fleisstakt-teacher-roster-sync",
    exportedAt: new Date().toISOString(),
    appVersion: TEACHER_APP_VERSION_INFO.appVersion,
    categories: getEffectivePracticeCategories(),
    classes: teacherState.classes.map((item) => ({
      id: item.id,
      name: item.name,
    })),
    students: teacherState.students.map((student) => ({
      studentId: student.studentId,
      studentUuid: student.studentUuid || `student-${student.studentId}`,
      profileUuid: student.profileUuid || `profile-${student.studentId}`,
      importedDisplayName: student.importedDisplayName || getDisplayName(student),
      importedInstrument: student.importedInstrument || "",
      importedGoal: Number(student.importedGoal) || 15,
    profileLabel: student.profileLabel || student.importedInstrument || "Unterricht",
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      messengerId: student.messengerId || "",
      classId: student.classId || "",
    })),
  };

  return {
    ...payload,
    checksum: createChecksum(payload),
  };
}

function exportTeacherCardsSyncPayload() {
  const cards = teacherState.cardLibrary
    .filter((card) => card.ownerScope !== "global")
    .map((card) => ({
      id: card.id,
      title: card.title,
      description: card.description,
      accent: card.accent,
      symbol: card.symbol,
      rarity: card.rarity,
      status: card.status,
      rule: {
        type: card.rule.type,
        value: card.rule.value,
        category: card.rule.category || "",
      },
      assignment: {
        type: card.assignment?.type || "all",
        targetId: card.assignment?.targetId || "",
      },
      updatedAt: card.updatedAt,
      createdAt: card.createdAt,
    }));
  const payload = {
    kind: "fleisstakt-teacher-karten-sync",
    exportedAt: new Date().toISOString(),
    appVersion: TEACHER_APP_VERSION_INFO.appVersion,
    cards,
  };

  return {
    ...payload,
    checksum: createChecksum(payload),
  };
}

function exportTeacherCardAwardPayload(action, cardId, studentId = "", note = "", awardId = 0) {
  const payload = {
    kind: "fleisstakt-teacher-karten-vergabe",
    exportedAt: new Date().toISOString(),
    appVersion: TEACHER_APP_VERSION_INFO.appVersion,
    action,
    cardId,
    studentId,
    note,
    awardId,
  };

  return {
    ...payload,
    checksum: createChecksum(payload),
  };
}

async function pushTeacherCardsToServer() {
  if (!teacherState.syncTeacherKey) {
    throw new Error("fehlender-teacher-key");
  }

  const response = await fetch(`${teacherState.syncBaseUrl}/teacher-cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-FleissTakt-Teacher-Key": teacherState.syncTeacherKey,
    },
    body: JSON.stringify(exportTeacherCardsSyncPayload()),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "teacher-cards-fehlgeschlagen");
  }
  return data;
}

async function saveTeacherCardAwardOnServer(action, payload) {
  if (!teacherState.syncTeacherKey) {
    throw new Error("fehlender-teacher-key");
  }

  const response = await fetch(`${teacherState.syncBaseUrl}/teacher-card-awards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-FleissTakt-Teacher-Key": teacherState.syncTeacherKey,
    },
    body: JSON.stringify(
      action === "revoke"
        ? exportTeacherCardAwardPayload("revoke", payload.cardId || "", "", "", payload.awardId || 0)
        : exportTeacherCardAwardPayload("award", payload.cardId || "", payload.studentId || "", payload.note || "", 0),
    ),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "teacher-card-awards-fehlgeschlagen");
  }
  return data;
}

async function pushTeacherRosterToServer() {
  if (!teacherState.syncTeacherKey) {
    throw new Error("fehlender-teacher-key");
  }

  const response = await fetch(`${teacherState.syncBaseUrl}/teacher-roster`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-FleissTakt-Teacher-Key": teacherState.syncTeacherKey,
    },
    body: JSON.stringify(exportTeacherRosterSyncPayload()),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "teacher-roster-fehlgeschlagen");
  }
  return data;
}

function importTeacherSyncSnapshot(snapshot, options = {}) {
  const {
    preserveLocalCardsOnEmpty = false,
    preserveLocalClassesOnEmpty = false,
    preserveMissingLocalClasses = false,
  } = options;
  const previousCards = Array.isArray(teacherState.cardLibrary) ? teacherState.cardLibrary : [];
  const previousClasses = Array.isArray(teacherState.classes) ? teacherState.classes : [];
  const incomingCards = Array.isArray(snapshot.cardLibrary)
    ? snapshot.cardLibrary.map(normalizeTeacherCard)
    : [];
  const incomingClasses = Array.isArray(snapshot.classes)
    ? snapshot.classes
        .filter((item) => item?.id && item?.name)
        .map((item) => ({ id: item.id, name: item.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
    : [];
  const preservedLocalCards = preserveLocalCardsOnEmpty
    && previousCards.length > 0
    && incomingCards.length === 0;
  const preservedLocalClasses = preserveLocalClassesOnEmpty
    && previousClasses.length > 0
    && incomingClasses.length === 0;
  const mergedLocalClasses = preserveMissingLocalClasses
    ? (() => {
        const merged = new Map(incomingClasses.map((item) => [item.id, item]));
        previousClasses.forEach((item) => {
          if (!merged.has(item.id)) {
            merged.set(item.id, item);
          }
        });
        return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
      })()
    : incomingClasses;
  const preservedMissingLocalClasses = preserveMissingLocalClasses
    && previousClasses.some((item) => !incomingClasses.find((incoming) => incoming.id === item.id));

  teacherState.practiceCategories = normalizePracticeCategories(snapshot.categories);
  teacherState.classes = preservedLocalClasses ? previousClasses : mergedLocalClasses;
  teacherState.students = Array.isArray(snapshot.students)
    ? snapshot.students.map(normalizeTeacherStudent)
    : [];
  teacherState.cardLibrary = preservedLocalCards ? previousCards : incomingCards;
  teacherState.feedbackRounds = Array.isArray(snapshot.feedbackRounds)
    ? snapshot.feedbackRounds
    : [];
  teacherState.syncTeacherLabel = snapshot.teacher?.displayName || teacherState.syncTeacherLabel;
  if (preservedLocalCards) {
    teacherState.lastImportSummary = "Lokale Kärtchenbibliothek beibehalten, weil der Server nach dem Sync noch keine Kärtchen zurückgemeldet hat.";
    teacherState.statusLine = "Serverstand geladen. Lokale Kärtchen vorsorglich beibehalten.";
  } else if (preservedLocalClasses) {
    teacherState.lastImportSummary = "Lokale Klassen beibehalten, weil der Server direkt nach dem Sync noch keine Klassen zurückgemeldet hat.";
    teacherState.statusLine = "Serverstand geladen. Lokale Klassen vorsorglich beibehalten.";
  } else if (preservedMissingLocalClasses) {
    teacherState.lastImportSummary = "Lokale Klassenliste vorsorglich ergänzt, weil der Server direkt nach dem Sync noch nicht alle Klassen zurückgemeldet hat.";
    teacherState.statusLine = "Serverstand geladen. Fehlende Klassen lokal vorsorglich ergänzt.";
  } else {
    teacherState.lastImportSummary = snapshot.lastImportSummary || "Serverdaten übernommen.";
    teacherState.statusLine = snapshot.statusLine || "Mit dem FleißTakt-Server synchronisiert.";
  }
  teacherState.selectedClassId = teacherState.selectedClassId === "all"
    ? "all"
    : (teacherState.classes.find((item) => item.id === teacherState.selectedClassId)?.id || "all");
  teacherState.selectedStudentId = teacherState.students.find((student) => student.studentId === teacherState.selectedStudentId)?.studentId
    || teacherState.students[0]?.studentId
    || "";
  teacherState.selectedCardId = teacherState.cardLibrary.find((card) => card.id === teacherState.selectedCardId)?.id
    || teacherState.cardLibrary[0]?.id
    || "";
  teacherState.selectedFeedbackRoundId = teacherState.feedbackRounds.find((round) => round.roundId === teacherState.selectedFeedbackRoundId)?.roundId
    || teacherState.feedbackRounds[0]?.roundId
    || "";
  persistTeacherState();
  return {
    preservedLocalCards,
    preservedLocalClasses,
    preservedMissingLocalClasses,
  };
}

function exportTeacherBackupPayload() {
  const payload = {
    kind: "fleisstakt-teacher-backup",
    exportedAt: new Date().toISOString(),
    version: TEACHER_APP_VERSION_INFO.appVersion,
    data: {
      classes: teacherState.classes,
      students: teacherState.students,
      cardLibrary: teacherState.cardLibrary,
      feedbackRounds: teacherState.feedbackRounds,
    },
  };

  return {
    ...payload,
    checksum: createChecksum(payload),
  };
}

function mergeTeacherBackup(payload) {
  const classMap = new Map(teacherState.classes.map((item) => [item.id, item]));
  payload.data.classes.forEach((item) => {
    if (item?.id && item?.name) {
      classMap.set(item.id, { id: item.id, name: item.name });
    }
  });
  teacherState.classes = [...classMap.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));

  const studentMap = new Map(teacherState.students.map((student) => [student.studentId, student]));
  payload.data.students.forEach((rawStudent) => {
    const nextStudent = normalizeTeacherStudent(rawStudent);
    const existing = studentMap.get(nextStudent.studentId);
    if (!existing) {
      studentMap.set(nextStudent.studentId, nextStudent);
      return;
    }

    studentMap.set(
      nextStudent.studentId,
      normalizeTeacherStudent({
        ...existing,
        ...nextStudent,
        entries: mergeEntries(existing.entries, nextStudent.entries),
        reportsReceived: Math.max(existing.reportsReceived, nextStudent.reportsReceived),
      }),
    );
  });

  const cardMap = new Map(teacherState.cardLibrary.map((card) => [card.id, card]));
  (payload.data.cardLibrary || []).forEach((rawCard) => {
    const nextCard = normalizeTeacherCard(rawCard);
    const existing = cardMap.get(nextCard.id);
    if (!existing || `${nextCard.updatedAt}` >= `${existing.updatedAt}`) {
      cardMap.set(nextCard.id, nextCard);
    }
  });

  teacherState.students = [...studentMap.values()].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"));
  teacherState.cardLibrary = [...cardMap.values()].sort((a, b) => a.title.localeCompare(b.title, "de"));
  teacherState.feedbackRounds = Array.isArray(payload.data.feedbackRounds) ? payload.data.feedbackRounds : teacherState.feedbackRounds;
}

function parseTeacherBackup(text) {
  const parsed = JSON.parse(text);
  const checksum = parsed?.checksum;
  const payload = parsed?.kind
    ? {
        kind: parsed.kind,
        exportedAt: parsed.exportedAt,
        version: parsed.version,
        data: parsed.data,
      }
    : null;

  if (!payload || payload.kind !== "fleisstakt-teacher-backup") {
    throw new Error("ungueltiges-backup");
  }

  if (!checksum || createChecksum(payload) !== checksum) {
    throw new Error("ungueltige-pruefsumme");
  }

  if (!Array.isArray(payload.data?.classes) || !Array.isArray(payload.data?.students)) {
    throw new Error("ungueltiges-backup");
  }

  if (payload.data.cardLibrary && !Array.isArray(payload.data.cardLibrary)) {
    throw new Error("ungueltiges-backup");
  }

  return payload;
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

function buildProfilePackageFilename(profilePackage) {
  const safeDisplayName = `${profilePackage?.displayName || "schueler"}`
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const safeStudentId = `${profilePackage?.appStudentId || "profil"}`
    .trim()
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `fleisstakt-profile-${safeDisplayName || "schueler"}-${safeStudentId || "profil"}.json`;
}

function buildStudentConnectionText(student) {
  const profileLabel = student.profileLabel || student.importedInstrument || "Unterricht";
  const connectUrl = buildStudentConnectionUrl(student);
  return [
    `FleißTakt verbinden für ${getDisplayName(student)} · ${profileLabel}`,
    `Lernenden-ID: ${student.studentId || "-"}`,
    `Verbindungscode: ${student.connectCode || "-"}`,
    `Server: ${teacherState.syncBaseUrl}`,
    connectUrl ? `Link: ${connectUrl}` : "",
  ].filter(Boolean).join("\n");
}

function buildStudentConnectionUrl(student) {
  if (!student?.studentId || !student?.connectCode) {
    return "";
  }

  const url = new URL(APP_SHARE_URL);
  url.searchParams.set("connect", "1");
  url.searchParams.set("studentId", student.studentId);
  url.searchParams.set("code", student.connectCode);
  url.searchParams.set("server", teacherState.syncBaseUrl);
  return url.toString();
}

function closeProfileShareDialog() {
  teacherState.profileShareOpen = false;
  teacherState.profileShareEyebrow = "Kopplung";
  teacherState.profileShareTitle = "";
  teacherState.profileShareDescription = "";
  teacherState.profileShareUrl = "";
  teacherState.profileShareHelp = "";
  teacherState.profileShareAllowPackageDownload = false;
  teacherState.profileShareFileName = "";
  teacherState.profileSharePayload = null;
  applyTeacherModalScrollLock();
  renderTeacherApp();
}

function openSyncProgress(title, steps) {
  teacherState.syncProgressOpen = true;
  teacherState.syncProgressTitle = title;
  teacherState.syncProgressMessage = "Synchronisierung wird vorbereitet...";
  teacherState.syncProgressState = "running";
  teacherState.syncProgressSteps = steps.map((step) => ({
    id: step.id,
    label: step.label,
    state: "pending",
  }));
  applyTeacherModalScrollLock();
  renderTeacherApp();
}

function updateSyncProgress(stepId, state, message = "") {
  teacherState.syncProgressSteps = teacherState.syncProgressSteps.map((step) =>
    step.id === stepId ? { ...step, state } : step,
  );
  if (message) {
    teacherState.syncProgressMessage = message;
  }
  renderTeacherApp();
}

function finishSyncProgress(state, message) {
  teacherState.syncProgressState = state;
  teacherState.syncProgressMessage = message;
  renderTeacherApp();
}

function closeSyncProgressDialog() {
  teacherState.syncProgressOpen = false;
  teacherState.syncProgressTitle = "";
  teacherState.syncProgressMessage = "";
  teacherState.syncProgressState = "idle";
  teacherState.syncProgressSteps = [];
  applyTeacherModalScrollLock();
  renderTeacherApp();
}

async function fetchTeacherProfilePackage(studentId) {
  if (!teacherState.syncTeacherKey) {
    throw new Error("fehlender-teacher-key");
  }

  const url = new URL(`${teacherState.syncBaseUrl}/teacher-profile-package`);
  url.searchParams.set("studentId", studentId);
  const response = await fetch(url.toString(), {
    headers: {
      "X-FleissTakt-Teacher-Key": teacherState.syncTeacherKey,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok || !data?.package) {
    throw new Error(data?.message || "teacher-profile-package-fehlgeschlagen");
  }
  return {
    package: data.package,
    fileName: data.fileName || buildProfilePackageFilename(data.package),
    downloadUrl: data.downloadUrl || "",
    shareUrl: data.shareUrl || data.downloadUrl || "",
  };
}

async function openTeacherProfileQr(student) {
  const connectUrl = buildStudentConnectionUrl(student);
  teacherState.profileShareOpen = true;
  teacherState.profileShareEyebrow = "Kopplung";
  teacherState.profileShareTitle = `${getDisplayName(student)} · ${student.profileLabel || student.importedInstrument || "Unterricht"}`;
  teacherState.profileShareDescription = "Die Lernenden scannen diesen QR-Code nach der Installation der Lernenden-App oder öffnen den Link direkt mit vorausgefüllten Kopplungsdaten.";
  teacherState.profileShareUrl = connectUrl;
  teacherState.profileShareHelp = "Dieser QR-Code und der Link öffnen FleißTakt mit Lernenden-ID, Verbindungscode und Server-Adresse bereits vorausgefüllt.";
  teacherState.profileShareAllowPackageDownload = true;
  teacherState.profileShareFileName = "";
  teacherState.profileSharePayload = null;
  applyTeacherModalScrollLock();
  renderTeacherApp();
}

function openLearnerAppShareDialog() {
  teacherState.profileShareOpen = true;
  teacherState.profileShareEyebrow = "Lernenden-App";
  teacherState.profileShareTitle = "Lernenden-App installieren";
  teacherState.profileShareDescription = "Teile zuerst die Lernenden-App, damit sie auf dem Gerät installiert und einmal geöffnet werden kann. Danach folgt die eigentliche Profil-Kopplung.";
  teacherState.profileShareUrl = APP_SHARE_URL;
  teacherState.profileShareHelp = "Dieser QR-Code und der Link führen zur Installationsseite der Lernenden-App.";
  teacherState.profileShareAllowPackageDownload = false;
  teacherState.profileShareFileName = "";
  teacherState.profileSharePayload = null;
  applyTeacherModalScrollLock();
  renderTeacherApp();
}

async function downloadTeacherProfilePackage(student) {
  const result = await fetchTeacherProfilePackage(student.studentId);
  downloadFile({
    filename: result.fileName,
    content: JSON.stringify(result.package, null, 2),
    mimeType: "application/json",
  });
  teacherState.statusLine = "Profilpaket bereitgestellt.";
  teacherState.toast = `Profilpaket für ${getDisplayName(student)} geladen.`;
}

async function shareTeacherProfilePackage(student) {
  const result = await fetchTeacherProfilePackage(student.studentId);
  const fileContent = JSON.stringify(result.package, null, 2);
  const shareTitle = `FleißTakt Profilpaket für ${getDisplayName(student)}`;
  const shareText = `Profilpaket für ${getDisplayName(student)}${student.profileLabel ? ` · ${student.profileLabel}` : ""}`;

  if (navigator.share) {
    try {
      const file = new File([fileContent], result.fileName, { type: "application/json" });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
      } else {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: result.shareUrl || result.downloadUrl,
        });
      }
      teacherState.statusLine = "Profilpaket geteilt.";
      teacherState.toast = `Profilpaket für ${getDisplayName(student)} geteilt.`;
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  if (navigator.clipboard?.writeText && (result.shareUrl || result.downloadUrl)) {
    await navigator.clipboard.writeText(result.shareUrl || result.downloadUrl);
    teacherState.statusLine = "Freigabelink kopiert.";
    teacherState.toast = `Link für ${getDisplayName(student)} in die Zwischenablage kopiert.`;
    return;
  }

  downloadFile({
    filename: result.fileName,
    content: fileContent,
    mimeType: "application/json",
  });
  teacherState.statusLine = "Profilpaket bereitgestellt.";
  teacherState.toast = `Profilpaket für ${getDisplayName(student)} geladen.`;
}

function computeOverview() {
  const students = filteredStudents();
  const entries = students.flatMap((student) => student.entries);
  const uniqueClasses = new Set(teacherState.students.map((student) => student.classId).filter(Boolean));

  return {
    studentCount: students.length,
    classCount: uniqueClasses.size,
    totalEntries: entries.length,
    totalMinutes: entries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0),
    activeCardCount: teacherState.cardLibrary.filter((card) => card.status === "active").length,
  };
}

function startOfTeacherWeek(input = new Date()) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  const weekday = date.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + offset);
  return date;
}

function endOfTeacherWeek(input = new Date()) {
  const date = startOfTeacherWeek(input);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseTeacherDateValue(value) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInTeacherWeek(value, weekStart, weekEnd) {
  const date = parseTeacherDateValue(value);
  return Boolean(date && date >= weekStart && date <= weekEnd);
}

function formatTeacherDate(value) {
  const date = parseTeacherDateValue(value);
  return date ? date.toLocaleDateString("de-DE") : "—";
}

function describeWeekActivity(student, weekStart, weekEnd) {
  const entries = Array.isArray(student.entries) ? student.entries : [];
  const weekEntries = entries.filter((entry) => isDateInTeacherWeek(entry.date || entry.savedAt, weekStart, weekEnd));
  const weekMinutes = weekEntries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
  const weekNotes = weekEntries.filter((entry) => `${entry.note || ""}`.trim()).length;
  const awardsThisWeek = (student.awardedCards || []).filter((award) => isDateInTeacherWeek(award.awardedAt, weekStart, weekEnd));
  const lastEntry = [...entries]
    .map((entry) => ({ ...entry, __time: parseTeacherDateValue(entry.date || entry.savedAt) }))
    .filter((entry) => entry.__time)
    .sort((a, b) => b.__time - a.__time)[0] || null;

  let tone = "quiet";
  let label = "Noch ohne Eintrag";

  if (weekEntries.length > 0) {
    tone = "active";
    label = "Diese Woche aktiv";
  } else if (lastEntry) {
    tone = "pending";
    label = "Diese Woche noch offen";
  }

  return {
    weekEntries,
    weekMinutes,
    weekNotes,
    awardsThisWeek,
    lastEntry,
    tone,
    label,
  };
}

function buildWeekSnapshot(students = filteredStudents()) {
  const weekStart = startOfTeacherWeek();
  const weekEnd = endOfTeacherWeek();
  const items = students
    .map((student) => ({
      student,
      activity: describeWeekActivity(student, weekStart, weekEnd),
    }))
    .sort((left, right) => {
      if (left.activity.weekEntries.length !== right.activity.weekEntries.length) {
        return right.activity.weekEntries.length - left.activity.weekEntries.length;
      }
      if (left.activity.weekMinutes !== right.activity.weekMinutes) {
        return right.activity.weekMinutes - left.activity.weekMinutes;
      }
      return getDisplayName(left.student).localeCompare(getDisplayName(right.student), "de");
    });

  return {
    weekStart,
    weekEnd,
    items,
    activeCount: items.filter((item) => item.activity.tone === "active").length,
    pendingCount: items.filter((item) => item.activity.tone === "pending").length,
    quietCount: items.filter((item) => item.activity.tone === "quiet").length,
    totalEntries: items.reduce((sum, item) => sum + item.activity.weekEntries.length, 0),
    totalMinutes: items.reduce((sum, item) => sum + item.activity.weekMinutes, 0),
    totalNotes: items.reduce((sum, item) => sum + item.activity.weekNotes, 0),
    totalAwards: items.reduce((sum, item) => sum + item.activity.awardsThisWeek.length, 0),
    reportsThisWeek: items.filter((item) => isDateInTeacherWeek(item.student.lastImportedAt, weekStart, weekEnd)).length,
  };
}

function buildRecentReports(limit = 8) {
  return [...teacherState.students]
    .filter((student) => student.reportsReceived > 0 && student.lastImportedAt)
    .sort((a, b) => `${b.lastImportedAt || ""}`.localeCompare(`${a.lastImportedAt || ""}`))
    .slice(0, limit);
}

function recentWeekReportsForStudent(student, weekStart, weekEnd) {
  return (Array.isArray(student.recentReports) ? student.recentReports : [])
    .filter((report) => {
      const reportDate = report.exportedAt || report.receivedAt || "";
      return report.range === "week" && isDateInTeacherWeek(reportDate, weekStart, weekEnd);
    })
    .sort((a, b) => `${b.exportedAt || b.receivedAt || ""}`.localeCompare(`${a.exportedAt || a.receivedAt || ""}`));
}

function renderWorkspaceRail() {
  return `
    <aside class="teacher-rail">
      <div class="brand-block">
        <div class="brand-mark">
          <img src="./icons/icon-192.svg" alt="FleißTakt Logo" />
        </div>
        <div class="brand-copy">
          <strong>FleißTakt</strong>
          <span>Lehrkräfte Studio</span>
        </div>
      </div>

      <nav class="workspace-nav" aria-label="Workspaces">
        ${teacherWorkspaces
          .map(
            (workspace) => `
              <button
                class="workspace-button ${teacherState.currentWorkspace === workspace.id ? "is-active" : ""}"
                type="button"
                data-workspace="${workspace.id}"
                aria-pressed="${teacherState.currentWorkspace === workspace.id ? "true" : "false"}"
              >
                <span class="workspace-icon">${workspace.icon}</span>
                <strong>${workspace.label}</strong>
              </button>
            `,
          )
          .join("")}
      </nav>

      <button class="rail-toggle" type="button" id="sidebar-toggle">
        <span>${teacherState.sidebarCollapsed ? "»" : "«"}</span>
        <strong>${teacherState.sidebarCollapsed ? "Öffnen" : "Schließen"}</strong>
      </button>
    </aside>
  `;
}

function renderClassSidebar() {
  return `
    <section class="workspace-panel">
      <div class="workspace-panel-head">
        <div>
          <p class="teacher-eyebrow">Workspace</p>
          <h2>Klassen</h2>
        </div>
        <span>${teacherState.classes.length}</span>
      </div>

      <div class="class-list">
        <button class="class-chip ${teacherState.selectedClassId === "all" ? "is-active" : ""}" type="button" data-class-filter="all">
          <span>Alle Klassen</span>
          <strong>${teacherState.students.length}</strong>
        </button>
        ${teacherState.classes
          .sort((a, b) => a.name.localeCompare(b.name, "de"))
          .map(
            (item) => `
              <button class="class-chip ${teacherState.selectedClassId === item.id ? "is-active" : ""}" type="button" data-class-filter="${item.id}">
                <span>${escapeHtml(item.name)}</span>
                <strong>${teacherState.students.filter((student) => student.classId === item.id).length}</strong>
              </button>
            `,
          )
          .join("")}
      </div>

      <form class="class-form" id="class-form">
        <input id="class-name-input" type="text" placeholder="Neue Klasse anlegen" value="${escapeHtml(teacherState.classDraft)}" />
        <button class="teacher-button" type="submit">Anlegen</button>
      </form>
    </section>
  `;
}

function renderStudentSidebar(students) {
  const activeStudent = selectedStudent();
  const sortedProfiles = [...students].sort((a, b) => {
    const left = `${getDisplayName(a)} ${getProfileDescriptor(a)}`.trim();
    const right = `${getDisplayName(b)} ${getProfileDescriptor(b)}`.trim();
    return left.localeCompare(right, "de");
  });

  return `
    <section class="workspace-panel">
      <div class="workspace-panel-head">
        <div>
          <p class="teacher-eyebrow">Workspace</p>
          <h2>Lernende</h2>
        </div>
        <span>${sortedProfiles.length}</span>
      </div>

      <div class="teacher-inline-actions">
        <button class="teacher-button teacher-button-primary" type="button" id="new-student-button">Neue lernende Person</button>
      </div>

      <div class="filter-row">
        <button class="filter-chip ${teacherState.selectedClassId === "all" ? "is-active" : ""}" type="button" data-class-filter="all">Alle</button>
        ${teacherState.classes
          .sort((a, b) => a.name.localeCompare(b.name, "de"))
          .map(
            (item) => `
              <button class="filter-chip ${teacherState.selectedClassId === item.id ? "is-active" : ""}" type="button" data-class-filter="${item.id}">
                ${escapeHtml(item.name)}
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="student-list">
        ${
          sortedProfiles.length
            ? sortedProfiles
                .map(
                  (student) => `
                    <button class="student-row ${activeStudent?.studentId === student.studentId ? "is-active" : ""}" type="button" data-student-id="${student.studentId}">
                      ${renderStudentNameBlock(
                        student,
                        `${getProfileDescriptor(student)} · ${getClassName(student.classId)}`,
                        student.latestReportLabel || "Noch kein Bericht",
                      )}
                    </button>
                  `,
                )
                .join("")
            : `<p class="empty-copy">Noch keine Lernenden importiert.</p>`
        }
      </div>
    </section>
  `;
}

function renderCardSidebar(cards) {
  return `
    <section class="workspace-panel">
      <div class="workspace-panel-head">
        <div>
          <p class="teacher-eyebrow">Workspace</p>
          <h2>Kartenbibliothek</h2>
        </div>
        <span>${cards.length}</span>
      </div>

      <div class="card-library-list">
        ${
          cards.length
            ? cards
                .map(
                  (card) => `
                    <button class="card-library-row card-library-preview ${teacherState.selectedCardId === card.id ? "is-active" : ""}" type="button" data-card-id="${card.id}">
                      <article class="card-preview accent-${card.accent}">
                        <div class="card-preview-top">
                          <strong>${escapeHtml(card.title)}</strong>
                          <span>${escapeHtml(card.symbol)}</span>
                        </div>
                        <p>${escapeHtml(card.description)}</p>
                        <small>${escapeHtml(summarizeCardRule(card))} · ${escapeHtml(card.rarity)} · ${card.awardCount || 0} verliehen</small>
                      </article>
                    </button>
                  `,
                )
                .join("")
            : `<p class="empty-copy">Noch keine Lehrkräfte-Kärtchen angelegt.</p>`
        }
      </div>

      <div class="teacher-inline-actions">
        <button class="teacher-button" type="button" id="new-card-button">Neue Karte</button>
      </div>
    </section>
  `;
}

function selectedFeedbackRound() {
  return teacherState.feedbackRounds.find((round) => round.roundId === teacherState.selectedFeedbackRoundId)
    || teacherState.feedbackRounds[0]
    || null;
}

function renderFeedbackSidebar() {
  return `
    <section class="workspace-panel">
      <div class="workspace-panel-head">
        <div>
          <h3>Runden</h3>
          <span>${teacherState.feedbackRounds.length}</span>
        </div>
      </div>
      <div class="card-library-list">
        ${
          teacherState.feedbackRounds.length
            ? teacherState.feedbackRounds
                .map(
                  (round) => `
                    <button class="card-library-row ${teacherState.selectedFeedbackRoundId === round.roundId ? "is-active" : ""}" type="button" data-feedback-round-id="${round.roundId}">
                      <strong>${escapeHtml(round.title || "Feedbackrunde")}</strong>
                      <span>${round.responseCount || 0} von ${round.eligibleCount || 0} Rückmeldungen</span>
                    </button>
                  `,
                )
                .join("")
            : `<p class="empty-copy">Noch keine Feedbackrunde verfügbar.</p>`
        }
      </div>
    </section>
  `;
}

function renderFeedbackWorkspace() {
  const round = selectedFeedbackRound();

  return `
    <section class="workspace-main">
      <div class="workspace-hero">
        <div>
          <p class="teacher-eyebrow">Feedback-Workspace</p>
          <div class="teacher-help-heading">
            <h2>${escapeHtml(round?.title || "Feedback")}</h2>
            ${renderHelpTrigger("feedback", "Hilfe zu Feedback")}
          </div>
          <p class="teacher-subline">Anonyme Rückmeldungen aus dem Unterricht, sichtbar nur als gemeinsame Auswertung.</p>
        </div>
        <div class="detail-badges">
          <span>${teacherState.feedbackRounds.length} Runden</span>
          <span>${round?.responseCount || 0} Rückmeldungen</span>
          <span>Anzeige ab ${round?.minResultsCount || 5}</span>
        </div>
      </div>

      <section class="workspace-card-grid">
        <article class="detail-card metric-card">
          <span>Teilnahme</span>
          <strong>${round ? `${round.responseCount || 0} / ${round.eligibleCount || 0}` : "0 / 0"}</strong>
        </article>
        <article class="detail-card metric-card">
          <span>Gesamtzufriedenheit</span>
          <strong>${round?.resultsVisible ? `${Number(round.summary?.overallAverage || 0).toFixed(1)} / 5` : "versteckt"}</strong>
        </article>
        <article class="detail-card metric-card">
          <span>Status</span>
          <strong>${round?.resultsVisible ? "sichtbar" : "gesperrt"}</strong>
        </article>
      </section>

      ${
        !round
          ? `
            <section class="detail-card">
              <p class="empty-copy">Sobald Rückmeldungen für deine Unterrichte verfügbar sind, erscheinen sie hier.</p>
            </section>
          `
          : !round.resultsVisible
            ? `
              <section class="detail-card">
                <div class="workspace-panel-head">
                  <div>
                    <h3>Auswertung noch gesperrt</h3>
                    <span>${round.responseCount || 0} von ${round.minResultsCount || 5} nötigen Rückmeldungen</span>
                  </div>
                </div>
                <p class="empty-copy">Die Ergebnisse werden erst angezeigt, wenn genügend anonyme Rückmeldungen vorliegen.</p>
              </section>
            `
            : `
              <section class="detail-card">
                <div class="workspace-panel-head">
                  <div>
                    <h3>Fragenübersicht</h3>
                    <span>${round.questions?.length || 0} Fragen</span>
                  </div>
                </div>
                <div class="feedback-results-list">
                  ${(round.questions || [])
                    .map(
                      (question) => `
                        <article class="feedback-result-card">
                          <div class="feedback-result-head">
                            <strong>${escapeHtml(question.label || "")}</strong>
                            <span>${Number(question.average || 0).toFixed(1)} / 5</span>
                          </div>
                          <div class="feedback-distribution">
                            ${[1, 2, 3, 4, 5]
                              .map((value) => {
                                const amount = Number(question.distribution?.[value] || question.distribution?.[`${value}`] || 0);
                                const count = Math.max(1, Number(question.count || 0));
                                const percent = Math.round((amount / count) * 100);
                                return `
                                  <div class="feedback-distribution-row">
                                    <span>${value}</span>
                                    <div class="feedback-distribution-bar"><i style="width:${amount ? percent : 0}%"></i></div>
                                    <strong>${amount}</strong>
                                  </div>
                                `;
                              })
                              .join("")}
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              </section>
            `
      }
    </section>
  `;
}

function renderSidebarPane(students, cards) {
  if (teacherState.sidebarCollapsed) {
    return "";
  }

  if (teacherState.currentWorkspace === "overview") {
    return "";
  }

  if (teacherState.currentWorkspace === "week") {
    return `<aside class="teacher-sidebar-pane">${renderClassSidebar()}</aside>`;
  }

  if (teacherState.currentWorkspace === "classes") {
    return `<aside class="teacher-sidebar-pane">${renderClassSidebar()}</aside>`;
  }

  if (teacherState.currentWorkspace === "cards") {
    return `<aside class="teacher-sidebar-pane">${renderCardSidebar(cards)}</aside>`;
  }

  if (teacherState.currentWorkspace === "feedback") {
    return `<aside class="teacher-sidebar-pane">${renderFeedbackSidebar()}</aside>`;
  }

  return `<aside class="teacher-sidebar-pane">${renderStudentSidebar(students)}</aside>`;
}

function renderClassesWorkspace() {
  const currentClass = selectedClass();
  const visibleStudents = filteredStudents().sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"));
  const classEntries = visibleStudents.flatMap((student) => student.entries);
  const assignableStudents = currentClass
    ? teacherState.students
        .filter((student) => student.classId !== currentClass.id)
        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"))
    : [];
  const currentClassStudentCount = currentClass
    ? teacherState.students.filter((student) => student.classId === currentClass.id).length
    : 0;
  const hasAnyStudents = teacherState.students.length > 0;

  return `
    <section class="workspace-main">
      <div class="workspace-hero">
        <div>
          <p class="teacher-eyebrow">Klassen-Workspace</p>
          <div class="teacher-help-heading">
            <h2>${escapeHtml(currentClass?.name || "Alle Klassen")}</h2>
            ${renderHelpTrigger("classes", "Hilfe zu Klassen")}
          </div>
          <p class="teacher-subline">Ruhiger Überblick über Lerngruppen, Beteiligung und letzte Aktivität.</p>
        </div>
        <div class="detail-badges">
          <span>${visibleStudents.length} Lernende</span>
          <span>${classEntries.length} Einträge</span>
          <span>${teacherState.cardLibrary.filter((card) => card.status === "active").length} aktive Lehrkräfte-Kärtchen</span>
        </div>
      </div>

      <section class="workspace-card-grid">
        <article class="detail-card metric-card">
          <span>Minuten gesamt</span>
          <strong>${classEntries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0)}</strong>
        </article>
        <article class="detail-card metric-card">
          <span>Berichte empfangen</span>
          <strong>${visibleStudents.filter((student) => student.reportsReceived > 0).length}</strong>
        </article>
        <article class="detail-card metric-card">
          <span>Klassen ohne Zuordnung</span>
          <strong>${teacherState.students.filter((student) => !student.classId).length}</strong>
        </article>
      </section>

      <section class="detail-card">
        <div class="sidebar-head">
          <h3>Klassenliste</h3>
          <span>${teacherState.classes.length}</span>
        </div>
        <div class="roster-list">
          ${
            teacherState.classes.length
              ? teacherState.classes
                  .sort((a, b) => a.name.localeCompare(b.name, "de"))
                  .map(
                    (item) => `
                      <article class="roster-row">
                        <div>
                          <strong>${escapeHtml(item.name)}</strong>
                          <p>${teacherState.students.filter((student) => student.classId === item.id).length} Lernende zugeordnet</p>
                        </div>
                        <span>${teacherState.students.filter((student) => student.classId === item.id).reduce((sum, student) => sum + student.entries.length, 0)} Einträge</span>
                      </article>
                    `,
                  )
                  .join("")
              : `<p class="empty-copy">Noch keine Klassen angelegt.</p>`
          }
        </div>
      </section>

      <section class="detail-card">
        <div class="sidebar-head">
          <h3>Lernende in dieser Auswahl</h3>
          <span>${visibleStudents.length}</span>
        </div>
        <div class="roster-list">
          ${
            visibleStudents.length
              ? visibleStudents
                  .map(
                    (student) => `
                      <article class="roster-row">
                        <div class="roster-row-main">
                          ${renderStudentNameBlock(student, `${getProfileDescriptor(student)} · ${getClassName(student.classId)}`)}
                        </div>
                        <div class="roster-row-side">
                          <span>${student.latestReportMinutes} Min</span>
                          ${currentClass ? `<button class="teacher-button teacher-button-subtle" type="button" data-remove-student-from-class="${student.studentId}">Aus Klasse entfernen</button>` : ""}
                        </div>
                      </article>
                    `,
                  )
                  .join("")
              : `<p class="empty-copy">Für diese Auswahl gibt es noch keine Lernenden.</p>`
          }
        </div>
      </section>

      <section class="detail-card">
        <div class="sidebar-head">
          <div>
            <div class="teacher-help-heading teacher-help-heading-inline">
              <h3>Unterricht zu einer Klasse zuordnen</h3>
              ${renderHelpTrigger("class_assignment", "Hilfe zur Klassenzuordnung")}
            </div>
            <p class="detail-note">${currentClass ? `Wähle Unterrichte aus, die zu ${currentClass.name} gehören sollen.` : "Wähle zuerst links oder oben eine Klasse aus."}</p>
          </div>
          <span>${currentClass ? assignableStudents.length : 0}</span>
        </div>
        ${
          currentClass
            ? `
              <div class="roster-list">
                ${
                  assignableStudents.length
                    ? assignableStudents.map((student) => `
                        <article class="roster-row">
                          <div class="roster-row-main">
                            ${renderStudentNameBlock(student, `${getProfileDescriptor(student)} · ${getClassName(student.classId)}`)}
                          </div>
                          <div class="roster-row-side">
                            <button class="teacher-button teacher-button-primary" type="button" data-assign-student-to-class="${student.studentId}">Dieser Klasse zuordnen</button>
                          </div>
                        </article>
                      `).join("")
                    : `<p class="empty-copy">${hasAnyStudents ? "Alle sichtbaren Unterrichte sind dieser Klasse bereits zugeordnet." : "Es gibt noch keine Lernenden und noch keine Unterrichte zum Zuordnen."}</p>`
                }
              </div>
            `
            : `<p class="empty-copy">Bitte zuerst eine konkrete Klasse auswählen, damit Unterrichte zugeordnet werden können.</p>`
        }
      </section>

      <section class="detail-card">
        <div class="sidebar-head">
          <div>
            <h3>Klasse verwalten</h3>
            <p class="detail-note">${currentClass ? "Leere Klassen lassen sich direkt löschen. Bei zugeordneten Unterrichten wird die Zuordnung vorher entfernt." : "Bitte zuerst eine Klasse auswählen."}</p>
          </div>
        </div>
        <div class="teacher-inline-actions teacher-inline-actions-wrap">
          <button class="teacher-button" type="button" id="delete-class-button" ${currentClass ? "" : "disabled"}>Klasse löschen</button>
        </div>
        ${
          currentClass
            ? `<p class="detail-note">Aktuell sind ${currentClassStudentCount} Unterrichte dieser Klasse zugeordnet.</p>`
            : ""
        }
      </section>
    </section>
  `;
}

function renderOverviewWorkspace() {
  const overview = computeOverview();
  const latestStudents = [...teacherState.students]
    .sort((a, b) => `${b.lastImportedAt}`.localeCompare(`${a.lastImportedAt}`))
    .slice(0, 6);
  const latestCards = [...teacherState.cardLibrary]
    .sort((a, b) => `${b.updatedAt}`.localeCompare(`${a.updatedAt}`))
    .slice(0, 6);
  const recentReports = buildRecentReports(8);

  return `
    <section class="workspace-main workspace-main-overview">
      <div class="workspace-hero workspace-hero-overview">
        <div>
          <p class="teacher-eyebrow">Übersichts-Workspace</p>
          <div class="teacher-help-heading">
            <h2>Lehrkräfte Studio auf einen Blick</h2>
            ${renderHelpTrigger("overview", "Hilfe zur Übersicht")}
          </div>
          <p class="teacher-subline">Kennzahlen, letzte Importe und der aktuelle Stand der Kartenbibliothek in einem ruhigen Startbereich.</p>
          ${renderTeacherIdentityLine()}
        </div>
        <div class="detail-badges overview-badge-stack">
          <span>${overview.studentCount} Lernende</span>
          <span>${overview.classCount} Klassen</span>
          <span>${overview.activeCardCount} aktive Lehrkräfte-Kärtchen</span>
        </div>
      </div>

      <section class="teacher-overview teacher-overview-embedded">
        <article class="overview-card">
          <span>Lernende</span>
          <strong>${overview.studentCount}</strong>
        </article>
        <article class="overview-card">
          <span>Klassen</span>
          <strong>${overview.classCount}</strong>
        </article>
        <article class="overview-card">
          <span>Einträge</span>
          <strong>${overview.totalEntries}</strong>
        </article>
        <article class="overview-card">
          <span>Aktive Kärtchen</span>
          <strong>${overview.activeCardCount}</strong>
        </article>
      </section>

      <section class="detail-card">
        <div class="sidebar-head">
          <h3>Import-Zusammenfassung</h3>
          <span>Status</span>
        </div>
        <div class="roster-list">
          <article class="roster-row">
            <div>
              <strong>Letzter Datenimport</strong>
              <p>${escapeHtml(teacherState.lastImportSummary)}</p>
            </div>
            <span>${escapeHtml(teacherState.statusLine)}</span>
          </article>
        </div>
      </section>

      <section class="detail-grid detail-grid-wide detail-grid-overview">
        <section class="detail-card">
          <div class="sidebar-head">
            <h3>Zuletzt importierte Lernende</h3>
            <span>${latestStudents.length}</span>
          </div>
          <div class="roster-list">
            ${
              latestStudents.length
                ? latestStudents
                    .map(
                      (student) => `
                        <article class="roster-row">
                          ${renderStudentNameBlock(student, `${getClassName(student.classId)} · ${student.latestReportLabel || "Noch kein Bericht"}`)}
                          <span>${student.latestReportMinutes} Min</span>
                        </article>
                      `,
                    )
                    .join("")
                : `<p class="empty-copy">Noch keine Lernenden importiert.</p>`
            }
          </div>
        </section>

        <section class="detail-card">
          <div class="sidebar-head">
            <h3>Kartenbibliothek zuletzt bearbeitet</h3>
            <span>${latestCards.length}</span>
          </div>
          <div class="roster-list">
            ${
              latestCards.length
                ? latestCards
                    .map(
                      (card) => `
                        <article class="roster-row">
                          <div>
                            <strong>${escapeHtml(card.title)}</strong>
                            <p>${escapeHtml(summarizeCardRule(card))}</p>
                          </div>
                          <span>${escapeHtml(card.rarity)}</span>
                        </article>
                      `,
                    )
                    .join("")
                : `<p class="empty-copy">Noch keine Lehrkräfte-Kärtchen angelegt.</p>`
            }
          </div>
        </section>
      </section>

      <section class="detail-card">
        <div class="sidebar-head">
          <div>
            <h3>Letzte Berichte</h3>
            <p class="detail-note">Hier siehst du die zuletzt eingegangenen Berichte aus den Unterrichten.</p>
          </div>
          <span>${recentReports.length}</span>
        </div>
        <div class="roster-list">
          ${
            recentReports.length
              ? recentReports
                  .map(
                    (student) => `
                      <article class="roster-row">
                        <div>
                          <strong>${escapeHtml(getDisplayName(student))} · ${escapeHtml(getProfileDescriptor(student))}</strong>
                          <p>${escapeHtml(getClassName(student.classId))} · ${escapeHtml(student.latestReportLabel || "Bericht")}</p>
                        </div>
                        <span>${student.latestReportMinutes} Min · ${escapeHtml(formatTeacherDateTime(student.lastImportedAt))}</span>
                      </article>
                    `,
                  )
                  .join("")
              : `<p class="empty-copy">Noch keine Berichte sichtbar. Nach dem nächsten Server-Sync erscheinen sie hier.</p>`
          }
        </div>
      </section>
    </section>
  `;
}

function renderWeekWorkspace() {
  const currentClass = selectedClass();
  const snapshot = buildWeekSnapshot(filteredStudents());
  const attentionItems = snapshot.items.filter((item) => item.activity.tone !== "active");
  const selectedWeekItem = snapshot.items.find((item) => item.student.studentId === teacherState.selectedWeekStudentId) || null;
  const selectedWeekReports = selectedWeekItem
    ? recentWeekReportsForStudent(selectedWeekItem.student, snapshot.weekStart, snapshot.weekEnd)
    : [];

  return `
    <section class="workspace-main">
      <div class="workspace-hero">
        <div>
          <p class="teacher-eyebrow">Wochen-Workspace</p>
          <div class="teacher-help-heading">
            <h2>${escapeHtml(currentClass?.name ? `Woche in ${currentClass.name}` : "Aktuelle Woche")}</h2>
            ${renderHelpTrigger("week", "Hilfe zur Woche")}
          </div>
          <p class="teacher-subline">Arbeitsansicht für die laufende Woche mit Aktivität, letzter Rückmeldung und direktem Blick auf offene Unterrichte.</p>
        </div>
        <div class="detail-badges">
          <span>${escapeHtml(formatTeacherDate(snapshot.weekStart))} – ${escapeHtml(formatTeacherDate(snapshot.weekEnd))}</span>
          <span>${snapshot.items.length} Unterrichte</span>
          <span>${snapshot.activeCount} aktiv</span>
        </div>
      </div>

      <section class="workspace-card-grid">
        <article class="detail-card metric-card">
          <span>Aktiv in dieser Woche</span>
          <strong>${snapshot.activeCount}</strong>
        </article>
        <article class="detail-card metric-card">
          <span>Noch offen</span>
          <strong>${snapshot.pendingCount + snapshot.quietCount}</strong>
        </article>
        <article class="detail-card metric-card">
          <span>Minuten in dieser Woche</span>
          <strong>${snapshot.totalMinutes}</strong>
        </article>
      </section>

      <section class="detail-grid detail-grid-wide">
        <section class="detail-card">
          <div class="sidebar-head">
            <div>
              <h3>Wochenblick</h3>
              <p class="detail-note">Grün heißt: diese Woche schon aktiv. Ocker heißt: früher aktiv, diese Woche noch offen. Rot heißt: noch gar kein Eintrag vorhanden.</p>
            </div>
            <span>${snapshot.items.length}</span>
          </div>
          <div class="teacher-week-legend">
            <span class="teacher-week-pill is-active">Diese Woche aktiv</span>
            <span class="teacher-week-pill is-pending">Noch offen</span>
            <span class="teacher-week-pill is-quiet">Noch ohne Einträge</span>
          </div>
          <div class="teacher-week-list">
            ${
              snapshot.items.length
                ? snapshot.items.map(({ student, activity }) => `
                    <button
                      class="teacher-week-row teacher-week-row-${activity.tone} ${teacherState.selectedWeekStudentId === student.studentId ? "is-selected" : ""}"
                      type="button"
                      data-week-student-id="${escapeHtml(student.studentId)}"
                    >
                      <div class="teacher-week-head">
                        ${renderStudentNameBlock(student, `${getProfileDescriptor(student)} · ${getClassName(student.classId)}`)}
                        <span class="teacher-week-state teacher-week-state-${activity.tone}">${escapeHtml(activity.label)}</span>
                      </div>
                      <div class="teacher-week-metrics">
                        <span>${activity.weekMinutes} Min</span>
                        <span>${activity.weekEntries.length} Einträge</span>
                        <span>${activity.weekNotes} Notizen</span>
                        <span>${activity.awardsThisWeek.length} direkte Kärtchen</span>
                        <span>Serie ${student.latestReportStreak || 0}</span>
                      </div>
                      <p class="teacher-week-foot">Letzte Aktivität: ${escapeHtml(activity.lastEntry ? formatTeacherDate(activity.lastEntry.date || activity.lastEntry.savedAt) : "Noch keine")}</p>
                    </button>
                  `).join("")
                : `<p class="empty-copy">Für diese Auswahl gibt es noch keine Unterrichte.</p>`
            }
          </div>
        </section>

        <section class="detail-card">
          <div class="sidebar-head">
            <div>
              <h3>${selectedWeekItem ? `Berichte von ${escapeHtml(getDisplayName(selectedWeekItem.student))}` : "Diese Woche auf einen Blick"}</h3>
              <p class="detail-note">${
                selectedWeekItem
                  ? "Noch einmal auf denselben Unterricht klicken, um zurück zur Gesamtübersicht zu wechseln."
                  : "Kompakte Kennzahlen für Nachverfolgung und Unterrichtsgespräche."
              }</p>
            </div>
          </div>
          ${
            selectedWeekItem
              ? `
                <dl class="detail-metrics">
                  <div><dt>Berichte in dieser Woche</dt><dd>${selectedWeekReports.length}</dd></div>
                  <div><dt>Minuten laut letztem Bericht</dt><dd>${selectedWeekItem.student.latestReportMinutes}</dd></div>
                  <div><dt>Notizen laut letztem Bericht</dt><dd>${selectedWeekItem.student.latestReportNotedCount}</dd></div>
                  <div><dt>Serie laut letztem Bericht</dt><dd>${selectedWeekItem.student.latestReportStreak}</dd></div>
                </dl>
                <div class="teacher-week-attention">
                  <h4>Letzte 5 Wochenberichte</h4>
                  <div class="teacher-entry-list">
                    ${
                      selectedWeekReports.length
                        ? selectedWeekReports.slice(0, 5).map((report) => `
                            <article class="teacher-entry-row">
                              <div>
                                <strong>${escapeHtml(report.label || "Wochenbericht")}</strong>
                                <p>${report.minutes} Min · ${report.entriesCount || 0} Einträge · ${report.notedCount || 0} Notizen · Serie ${report.streak || 0}</p>
                              </div>
                              <span>${escapeHtml(report.exportedAt ? formatTeacherDateTime(report.exportedAt) : "—")}</span>
                            </article>
                          `).join("")
                        : `<p class="empty-copy">Für diesen Unterricht ist in dieser Woche noch kein Wochenbericht eingegangen.</p>`
                    }
                  </div>
                </div>
              `
              : `
                <dl class="detail-metrics">
                  <div><dt>Berichte in dieser Woche</dt><dd>${snapshot.reportsThisWeek}</dd></div>
                  <div><dt>Einträge in dieser Woche</dt><dd>${snapshot.totalEntries}</dd></div>
                  <div><dt>Notizen in dieser Woche</dt><dd>${snapshot.totalNotes}</dd></div>
                  <div><dt>Direkt verliehene Kärtchen</dt><dd>${snapshot.totalAwards}</dd></div>
                </dl>
                <div class="teacher-week-attention">
                  <h4>Gesprächsbedarf</h4>
                  <div class="roster-list">
                    ${
                      attentionItems.length
                        ? attentionItems.slice(0, 6).map(({ student, activity }) => `
                            <article class="roster-row">
                              ${renderStudentNameBlock(student, `${getProfileDescriptor(student)} · ${activity.label}`)}
                              <span>${escapeHtml(activity.lastEntry ? formatTeacherDate(activity.lastEntry.date || activity.lastEntry.savedAt) : "Noch offen")}</span>
                            </article>
                          `).join("")
                        : `<p class="empty-copy">Alle sichtbaren Unterrichte sind in dieser Woche schon aktiv.</p>`
                    }
                  </div>
                </div>
              `
          }
        </section>
      </section>
    </section>
  `;
}

function renderStudentsWorkspace(students) {
  const activeStudent = students.find((student) => student.studentId === teacherState.selectedStudentId) || students[0] || null;
  const formValues = getStudentFormValues(activeStudent);
  const personProfiles = activeStudent
    ? teacherState.students
        .filter((student) => getPersonId(student) === getPersonId(activeStudent))
        .sort((a, b) => (a.profileLabel || a.importedInstrument || "").localeCompare((b.profileLabel || b.importedInstrument || ""), "de"))
    : [];
  const classOptions = teacherState.classes
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map((item) => `<option value="${item.id}" ${formValues?.classId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
    .join("");
  const mergeOptions = teacherState.students
    .filter((student) => activeStudent && student.studentId !== activeStudent.studentId)
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"))
    .map(
      (student) => `<option value="${student.studentId}">${escapeHtml(getDisplayName(student))} · ${escapeHtml(student.studentId)}</option>`,
    )
    .join("");

  if (activeStudent && teacherState.selectedStudentId !== activeStudent.studentId) {
    teacherState.selectedStudentId = activeStudent.studentId;
  }

  if (!activeStudent) {
    return `
      <section class="workspace-main">
        <section class="detail-card">
          <h2>Noch keine Lernenden ausgewählt</h2>
          <p class="empty-copy">Lege eine neue lernende Person an oder importiere vorhandene Daten vom Server beziehungsweise aus Berichtspaketen.</p>
          <div class="teacher-inline-actions">
            <button class="teacher-button teacher-button-primary" type="button" id="new-student-button">Neue lernende Person anlegen</button>
          </div>
        </section>
      </section>
    `;
  }

  return `
    <section class="workspace-main">
      <section class="detail-header">
        <div>
          <p class="teacher-eyebrow">Lernenden-Workspace</p>
          <div class="teacher-help-heading">
            <h2>${escapeHtml(getDisplayName(activeStudent))}</h2>
            ${renderHelpTrigger("students", "Hilfe zu Lernenden")}
          </div>
          ${getFormalName(activeStudent) && getFormalName(activeStudent) !== getDisplayName(activeStudent) ? `<p class="teacher-subline teacher-subline-secondary">${escapeHtml(getFormalName(activeStudent))}</p>` : ""}
          <p class="teacher-subline">${personProfiles.length} Unterrichte · Aktuell: ${escapeHtml(activeStudent.profileLabel || activeStudent.importedInstrument || "Unterricht")} · Ziel ${activeStudent.importedGoal || 0} Minuten</p>
        </div>
        <div class="detail-badges">
          <span>${escapeHtml(activeStudent.latestReportLabel || "Noch kein Bericht")}</span>
          <span>${activeStudent.latestReportMinutes} Minuten</span>
          <span>${activeStudent.latestReportStreak} Tage Serie</span>
        </div>
      </section>

      <section class="detail-card detail-action-card">
        <div class="sidebar-head">
          <div>
            <h3>Unterrichte dieser lernenden Person</h3>
            <p class="detail-note">Hier siehst du, welche Unterrichte zu dieser lernenden Person gehören. Den aktiven Unterricht wählst du bereits links in der Lernenden-Liste aus.</p>
          </div>
          <span>${personProfiles.length}</span>
        </div>
        <div class="teacher-inline-actions teacher-inline-actions-wrap">
          ${personProfiles
            .map(
              (student) => `
                <span class="teacher-static-chip ${student.studentId === activeStudent.studentId ? "is-active" : ""}">
                  ${escapeHtml(getProfileDescriptor(student))}
                </span>
              `,
            )
            .join("")}
          <button class="teacher-button" type="button" id="delete-profile-button">Unterricht löschen</button>
        </div>
        <div class="teacher-inline-actions teacher-inline-actions-emphasis">
          <button class="teacher-button teacher-button-primary teacher-button-strong" type="button" id="add-profile-button">Neuen Unterricht für diese lernende Person anlegen</button>
        </div>
      </section>

      <section class="detail-grid">
        <form class="detail-card" id="student-form">
          <div class="teacher-help-heading teacher-help-heading-inline">
            <h3>Stammdaten und aktueller Unterricht</h3>
            ${renderHelpTrigger("student_form", "Hilfe zu Stammdaten und Unterricht")}
          </div>
          <input type="hidden" id="student-id" value="${escapeHtml(activeStudent.studentId)}" />
          <label>
            <span>Anzeigename</span>
            <input id="student-display-name" type="text" value="${escapeHtml(formValues?.importedDisplayName || "")}" />
          </label>
          <label>
            <span>Vorname</span>
            <input id="student-first-name" type="text" value="${escapeHtml(formValues?.firstName || "")}" />
          </label>
          <label>
            <span>Nachname</span>
            <input id="student-last-name" type="text" value="${escapeHtml(formValues?.lastName || "")}" />
          </label>
          <label>
            <span>E-Mail</span>
            <input id="student-email" type="text" value="${escapeHtml(formValues?.email || "")}" />
          </label>
          <label>
            <span>Messenger-ID</span>
            <input id="student-messenger" type="text" value="${escapeHtml(formValues?.messengerId || "")}" />
          </label>
          <label>
            <span>Klasse</span>
            <select id="student-class-id">
              <option value="">Ohne Klasse</option>
              ${classOptions}
            </select>
          </label>
          <label>
              <span>Unterrichtsbezeichnung</span>
            <input id="student-profile-label" type="text" value="${escapeHtml(formValues?.profileLabel || "")}" />
          </label>
          <label>
            <span>Instrument</span>
            <input id="student-instrument" type="text" list="teacher-instrument-options" value="${escapeHtml(formValues?.importedInstrument || "")}" />
          </label>
          <datalist id="teacher-instrument-options">
            ${teacherInstrumentOptions.map((instrument) => `<option value="${escapeHtml(instrument)}"></option>`).join("")}
          </datalist>
          <label>
            <span>Tagesziel in Minuten</span>
            <input id="student-goal" type="number" min="5" step="5" value="${escapeHtml(formValues?.importedGoal || "15")}" />
          </label>
          <button class="teacher-button teacher-button-primary" type="submit">Lernende Person speichern</button>
        </form>

        <article class="detail-card">
          <h3>Berichtsstand</h3>
          <dl class="detail-metrics">
            <div><dt>Berichte empfangen</dt><dd>${activeStudent.reportsReceived}</dd></div>
            <div><dt>Übetage</dt><dd>${activeStudent.latestReportUniqueDaysCount}</dd></div>
            <div><dt>Notizen</dt><dd>${activeStudent.latestReportNotedCount}</dd></div>
            <div><dt>Letzter Import</dt><dd>${activeStudent.lastImportedAt ? new Date(activeStudent.lastImportedAt).toLocaleString("de-DE") : "—"}</dd></div>
          </dl>
        </article>
      </section>

      <section class="detail-card detail-action-card">
        <div class="sidebar-head">
          <div>
            <div class="teacher-help-heading teacher-help-heading-inline">
              <h3>Kopplung für die Lernenden-App</h3>
              ${renderHelpTrigger("coupling", "Hilfe zur Kopplung")}
            </div>
            <p class="detail-note">Kurzablauf: App teilen, Unterricht synchronisieren, QR-Code oder ID und Code weitergeben.</p>
          </div>
        </div>
        <ol class="teacher-coupling-steps">
          <li>Lernenden-App teilen oder App-QR zeigen.</li>
          <li>Unterricht speichern und mit dem Server synchronisieren.</li>
          <li>Kopplungs-QR zeigen oder Lernenden-ID und Verbindungscode teilen.</li>
        </ol>
        <div class="teacher-inline-actions teacher-inline-actions-wrap">
          <button class="teacher-button teacher-button-primary" type="button" id="share-learner-app">Lernenden-App teilen</button>
          <button class="teacher-button" type="button" id="show-learner-app-qr">App-QR zeigen</button>
        </div>
        <div class="teacher-inline-actions teacher-inline-actions-wrap">
          <label class="teacher-detail-field">
            <span>Lernenden-ID</span>
            <input type="text" readonly value="${escapeHtml(activeStudent.studentId || "")}" />
          </label>
          <label class="teacher-detail-field">
            <span>Verbindungscode</span>
            <input type="text" readonly value="${escapeHtml(activeStudent.connectCode || "")}" />
          </label>
        </div>
        <div class="teacher-inline-actions teacher-inline-actions-wrap">
          <button class="teacher-button teacher-button-primary" type="button" id="show-profile-qr" ${(activeStudent.studentId && activeStudent.connectCode) ? "" : "disabled"}>Kopplungs-QR zeigen</button>
          <button class="teacher-button" type="button" id="share-connect-data" ${(activeStudent.studentId && activeStudent.connectCode) ? "" : "disabled"}>Kopplung teilen</button>
          <button class="teacher-button" type="button" id="copy-student-id" ${(activeStudent.studentId && activeStudent.connectCode) ? "" : "disabled"}>ID kopieren</button>
          <button class="teacher-button" type="button" id="copy-connect-code" ${(activeStudent.studentId && activeStudent.connectCode) ? "" : "disabled"}>Code kopieren</button>
        </div>
        <p class="detail-note">${activeStudent.connectCode ? "ID und 4-stelliger Code sind bereit. Jetzt einfach QR-Code zeigen oder beides teilen." : "Nach dem ersten erfolgreichen Server-Sync erscheinen hier automatisch Lernenden-ID und Verbindungscode."}</p>
      </section>

      <section class="detail-card">
        <h3>Freigeschaltete Kärtchen</h3>
        <div class="badge-row">
          ${
            activeStudent.unlockedCards.length
              ? activeStudent.unlockedCards
                  .map((card) => `<span class="teacher-badge">${escapeHtml(card.title)}</span>`)
                  .join("")
              : `<span class="empty-copy">Noch keine Kärtchen aus einem Bericht übernommen.</span>`
          }
        </div>
      </section>

      <section class="detail-card">
        <h3>Direkt verliehene Kärtchen</h3>
        <div class="teacher-entry-list">
          ${
            activeStudent.awardedCards.length
              ? activeStudent.awardedCards
                  .map(
                    (award) => `
                      <article class="teacher-entry-row teacher-award-row">
                        <div>
                          <strong>${escapeHtml(award.title || "Kärtchen")}</strong>
                          <p class="teacher-award-meta">${escapeHtml(award.awardedAt ? `Verliehen am ${formatTeacherDateTime(award.awardedAt)}` : "Direkt verliehen")}</p>
                          <p class="teacher-award-note">${escapeHtml(award.note || "Ohne Notiz")}</p>
                        </div>
                        <span>${award.awardedAt ? escapeHtml(new Date(award.awardedAt).toLocaleDateString("de-DE")) : "Direkt verliehen"}</span>
                      </article>
                    `,
                  )
                  .join("")
              : `<p class="empty-copy">Dieser Unterricht hat noch keine direkt verliehenen Kärtchen.</p>`
          }
        </div>
      </section>

      <section class="detail-card">
        <h3>Doppelte Einträge zusammenführen</h3>
        <p class="detail-note">Falls dieselbe lernende Person durch Gerätewechsel mit neuer Lernenden-ID auftaucht, kann sie hier manuell zusammengeführt werden.</p>
        <form class="merge-form" id="merge-form">
          <input type="hidden" id="merge-target-student-id" value="${escapeHtml(activeStudent.studentId)}" />
          <label>
            <span>Mit anderer lernender Person zusammenführen</span>
            <select id="merge-source-student-id">
              <option value="">Bitte auswählen</option>
              ${mergeOptions}
            </select>
          </label>
          <button class="teacher-button" type="submit">Zusammenführen</button>
        </form>
      </section>

      <section class="detail-card">
        <h3>Letzte Berichte</h3>
        <div class="teacher-entry-list">
          ${
            activeStudent.recentReports.length
              ? activeStudent.recentReports
                  .slice(0, 5)
                  .map(
                    (report) => `
                      <article class="teacher-entry-row">
                        <div>
                          <strong>${escapeHtml(report.label || "Bericht")}</strong>
                          <p>${report.minutes} Min · ${report.entriesCount || 0} Einträge · ${report.notedCount || 0} Notizen · Serie ${report.streak || 0}</p>
                        </div>
                        <span>${escapeHtml(report.exportedAt ? formatTeacherDateTime(report.exportedAt) : "—")}</span>
                      </article>
                    `,
                  )
                  .join("")
              : `<p class="empty-copy">Noch keine Berichte vorhanden.</p>`
          }
        </div>
      </section>

      <section class="detail-card detail-action-card">
        <div class="sidebar-head">
          <div>
            <h3>Ausnahmeweg: Profilpaket</h3>
            <p class="detail-note">Nur für Ausnahmefälle, wenn QR-Code und Code-Eingabe nicht funktionieren.</p>
          </div>
        </div>
        <div class="teacher-inline-actions teacher-inline-actions-wrap">
          <button class="teacher-button teacher-button-primary" type="button" id="download-profile-package">Profilpaket laden</button>
          <button class="teacher-button" type="button" id="share-profile-package">Teilen</button>
        </div>
      </section>
    </section>
  `;
}

function renderCardsWorkspace(cards) {
  const activeCard = cards.find((card) => card.id === teacherState.selectedCardId) || null;
  const cardDraft = getCardFormValues(activeCard);
  const selectedLearner = selectedStudent();
  const practiceCategoriesText = getPracticeCategoriesTextareaValue();
  const manualAwardValues = getManualAwardFormValues(activeCard, selectedLearner);
  const awardedCards = activeCard ? getAwardedCardsForCard(activeCard) : [];
  const latestAward = awardedCards[0] || null;
  const practiceCategories = getEffectivePracticeCategories();
  const ruleGuidance = getRuleTypeGuidance(cardDraft.rule);
  const ruleMeaningText = buildRuleMeaningText(cardDraft.rule);
  const categoryRuleOptions = practiceCategories
    .map((item) => `<option value="${escapeHtml(item)}" ${cardDraft.rule.category === item ? "selected" : ""}>${escapeHtml(item)}</option>`)
    .join("");
  const classAssignmentOptions = teacherState.classes
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map((item) => `<option value="${item.id}" ${cardDraft.assignment.type === "class" && cardDraft.assignment.targetId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
    .join("");
  const studentAssignmentOptions = teacherState.students
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"))
    .map((student) => `<option value="${student.studentId}" ${cardDraft.assignment.type === "student" && cardDraft.assignment.targetId === student.studentId ? "selected" : ""}>${escapeHtml(getDisplayName(student))} · ${escapeHtml(student.profileLabel || student.importedInstrument || "")}</option>`)
    .join("");
  return `
    <section class="workspace-main">
      <div class="workspace-hero">
        <div>
          <p class="teacher-eyebrow">Kärtchen-Workspace</p>
          <div class="teacher-help-heading">
            <h2>Lehrkräfte-Kärtchen gestalten</h2>
            ${renderHelpTrigger("cards", "Hilfe zu Kärtchen")}
          </div>
          <p class="teacher-subline">Eigene Ziele anlegen, pausieren und bei Bedarf direkt an Lernende verleihen.</p>
        </div>
        <div class="detail-badges">
          <span>${cards.filter((card) => card.status === "active").length} aktiv</span>
          <span>${cards.filter((card) => card.status === "inactive").length} pausiert</span>
          <span>${cards.length} gesamt</span>
        </div>
      </div>

      <section class="detail-grid detail-grid-wide">
        <section class="detail-card">
          <h3>Übekategorien</h3>
          <p class="detail-note">Diese Kategorien erscheinen in der Lernenden-App beim Eintragen und stehen auch für Kategorien-Kärtchen als Auswahl bereit.</p>
          <form id="practice-categories-form">
            <label>
              <span>Kategorien</span>
              <textarea id="practice-categories-input" rows="5" placeholder="Eine Kategorie pro Zeile">${escapeHtml(practiceCategoriesText)}</textarea>
              <small>Jede Zeile ergibt eine eigene Kategorie.</small>
            </label>
            <div class="teacher-inline-actions">
              <button class="teacher-button teacher-button-primary" type="submit">Kategorien speichern</button>
              <button class="teacher-button" type="button" id="load-starter-card-set">Starter-Set mit 20 Kärtchen laden</button>
            </div>
          </form>
        </section>

        <form class="detail-card card-editor-form" id="card-form">
          <h3>${cardDraft.id ? "Karte bearbeiten" : "Neue Karte anlegen"}</h3>
          <input type="hidden" id="card-id" value="${escapeHtml(cardDraft.id)}" />
          <label>
            <span>Titel</span>
            <input id="card-title" type="text" maxlength="32" value="${escapeHtml(cardDraft.title)}" />
          </label>
          <label>
            <span>Beschreibung</span>
            <input id="card-description" type="text" maxlength="80" value="${escapeHtml(cardDraft.description)}" />
          </label>
          <div class="card-editor-grid">
            <label>
              <span>Zielbedingung</span>
              <select id="card-rule-type">
                ${cardRuleTypes
                  .map(
                    (ruleType) => `<option value="${ruleType}" ${cardDraft.rule.type === ruleType ? "selected" : ""}>${escapeHtml(getRuleTypeLabel(ruleType))}</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <label>
              <span>Zielwert</span>
              <input id="card-rule-value" type="number" min="0" max="999" value="${cardDraft.rule.value}" ${(cardDraft.rule.type === "morningEntryOnce" || cardDraft.rule.type === "none") ? "disabled" : ""} />
            </label>
          </div>
          <div class="card-editor-grid">
            <label>
              <span>Regel-Kategorie</span>
              <select id="card-rule-category" ${cardDraft.rule.type === "categoryUsed" ? "" : "disabled"}>
                <option value="">Kategorie wählen</option>
                ${categoryRuleOptions}
              </select>
              <small>Nur bei Zielbedingung <strong>Kategorie genutzt</strong> relevant.</small>
            </label>
            <div></div>
          </div>
          <article class="teacher-rule-helper">
            <div class="teacher-help-heading teacher-help-heading-inline">
              <strong>${escapeHtml(ruleGuidance.title)}</strong>
              ${renderHelpTrigger("card_rules", "Hilfe zu Zielbedingung und Zielwert")}
            </div>
            <p>${escapeHtml(ruleGuidance.text)}</p>
            <small>${escapeHtml(ruleGuidance.example)}</small>
          </article>
          <p class="detail-note"><strong>${escapeHtml(ruleMeaningText)}</strong></p>
          <div class="card-editor-grid">
            <label>
              <span>Farbwelt</span>
              <select id="card-accent">
                ${cardAccentOptions
                  .map((accent) => `<option value="${accent}" ${cardDraft.accent === accent ? "selected" : ""}>${escapeHtml(accent)}</option>`)
                  .join("")}
              </select>
            </label>
            <label>
              <span>Symbol</span>
              <input id="card-symbol" type="text" maxlength="2" value="${escapeHtml(cardDraft.symbol)}" />
            </label>
          </div>
          <div class="card-editor-grid">
            <label>
              <span>Seltenheit</span>
              <select id="card-rarity">
                ${cardRarityOptions
                  .map((rarity) => `<option value="${rarity}" ${cardDraft.rarity === rarity ? "selected" : ""}>${escapeHtml(rarity)}</option>`)
                  .join("")}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select id="card-status">
                <option value="active" ${cardDraft.status === "active" ? "selected" : ""}>Aktiv</option>
                <option value="inactive" ${cardDraft.status === "inactive" ? "selected" : ""}>Pausiert</option>
              </select>
            </label>
          </div>
          <div class="card-editor-grid">
            <label>
              <span>Zuweisung</span>
              <select id="card-assignment-type">
                <option value="all" ${cardDraft.assignment.type === "all" ? "selected" : ""}>Für alle</option>
                <option value="class" ${cardDraft.assignment.type === "class" ? "selected" : ""}>Für eine Klasse</option>
                <option value="student" ${cardDraft.assignment.type === "student" ? "selected" : ""}>Für eine Person</option>
              </select>
            </label>
            <label>
              <span>Zielgruppe</span>
              <select id="card-assignment-target" ${cardDraft.assignment.type === "all" ? "disabled" : ""}>
                ${
                  cardDraft.assignment.type === "class"
                    ? `<option value="">Klasse wählen</option>${classAssignmentOptions}`
                    : cardDraft.assignment.type === "student"
                      ? `<option value="">Unterricht wählen</option>${studentAssignmentOptions}`
                      : `<option value="">Nicht nötig</option>`
                }
              </select>
            </label>
          </div>
          <div class="teacher-inline-actions">
            <button class="teacher-button teacher-button-primary" type="submit">Karte speichern</button>
            <button class="teacher-button" type="button" id="reset-card-form">Neu beginnen</button>
            ${cardDraft.id ? `<button class="teacher-button" type="button" id="delete-card-button">Karte löschen</button>` : ""}
          </div>
          <p class="detail-note">Zielbedingung beschreibt <strong>was</strong> geprüft wird, Zielwert beschreibt <strong>ab welcher Zahl</strong> das Kärtchen freigeschaltet wird. Für Kärtchen ohne automatische Prüfung eignet sich die Zielbedingung <strong>Keine</strong>.</p>
        </form>

        <section class="detail-card">
          <h3>Kärtchen direkt verleihen</h3>
          ${
            activeCard
              ? `
                <form id="manual-award-form">
                  <input type="hidden" id="manual-award-card-id" value="${escapeHtml(activeCard.id)}" />
                  <label>
                    <span>Ausgewähltes Kärtchen</span>
                    <input type="text" readonly value="${escapeHtml(activeCard.title)}" />
                  </label>
                  <label>
                    <span>An diesen Unterricht verleihen</span>
                    <select id="manual-award-student-id">
                      <option value="">Unterricht wählen</option>
                      ${teacherState.students
                        .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"))
                        .map((student) => `<option value="${student.studentId}" ${manualAwardValues.studentId === student.studentId ? "selected" : ""}>${escapeHtml(getDisplayName(student))} · ${escapeHtml(student.profileLabel || student.importedInstrument || "Profil")}</option>`)
                        .join("")}
                    </select>
                  </label>
                  <label>
                    <span>Notiz der Lehrkraft</span>
                    <textarea id="manual-award-note" rows="3" maxlength="${CARD_AWARD_NOTE_MAX_LENGTH}" placeholder="Zum Beispiel: Tolle Konzentration in der Stunde.">${escapeHtml(manualAwardValues.note)}</textarea>
                  </label>
                  <p class="detail-note">Kurz und persönlich wirkt hier am besten. Bis zu ${CARD_AWARD_NOTE_MAX_LENGTH} Zeichen passen gut auf das Kärtchen in der Lernenden-App.</p>
                  <div class="teacher-inline-actions">
                    <button class="teacher-button teacher-button-primary" type="submit">Kärtchen direkt verleihen</button>
                  </div>
                </form>
              `
              : `<p class="empty-copy">Wähle zuerst ein Kärtchen aus der Bibliothek aus, um es direkt verleihen zu können.</p>`
          }
        </section>

        <section class="detail-card">
          <h3>Bereits direkt verliehen</h3>
          ${
            activeCard
              ? `
                <div class="teacher-award-summary">
                  <article class="teacher-award-summary-card">
                    <span>Direkt verliehen</span>
                    <strong>${awardedCards.length}</strong>
                  </article>
                  <article class="teacher-award-summary-card">
                    <span>Zuletzt</span>
                    <strong>${escapeHtml(latestAward ? formatTeacherDateTime(latestAward.awardedAt) : "Noch offen")}</strong>
                  </article>
                </div>
              `
              : ""
          }
          <div class="teacher-entry-list">
            ${
              activeCard
                ? (
                  awardedCards.length
                    ? awardedCards
                        .map(
                          (award) => `
                            <article class="teacher-entry-row teacher-award-row">
                              <div>
                                <strong>${escapeHtml(award.studentName)} · ${escapeHtml(award.profileLabel)}</strong>
                                <p class="teacher-award-meta">${escapeHtml(award.awardedAt ? `Verliehen am ${formatTeacherDateTime(award.awardedAt)}` : "Direkt verliehen")}</p>
                                <p class="teacher-award-note">${escapeHtml(award.note || "Ohne Notiz")}</p>
                              </div>
                              <div class="teacher-award-actions">
                                <span>${award.awardedAt ? escapeHtml(new Date(award.awardedAt).toLocaleDateString("de-DE")) : "Direkt verliehen"}</span>
                                <button class="teacher-button" type="button" data-revoke-award="${award.awardId}" data-revoke-card="${escapeHtml(activeCard.id)}">Zurücknehmen</button>
                              </div>
                            </article>
                          `,
                        )
                        .join("")
                    : `<p class="empty-copy">Dieses Kärtchen wurde noch nicht direkt verliehen.</p>`
                )
                : `<p class="empty-copy">Wähle ein Kärtchen aus, um seine direkten Verleihungen zu sehen.</p>`
            }
          </div>
        </section>
      </section>
    </section>
  `;
}

function renderMainWorkspace(students, cards) {
  if (teacherState.currentWorkspace === "overview") {
    return renderOverviewWorkspace();
  }

  if (teacherState.currentWorkspace === "week") {
    return renderWeekWorkspace();
  }

  if (teacherState.currentWorkspace === "classes") {
    return renderClassesWorkspace();
  }

  if (teacherState.currentWorkspace === "cards") {
    return renderCardsWorkspace(cards);
  }

  if (teacherState.currentWorkspace === "feedback") {
    return renderFeedbackWorkspace();
  }

  return renderStudentsWorkspace(students);
}

function renderTeacherApp() {
  const students = filteredStudents().sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"));
  const cards = [...teacherState.cardLibrary].sort((a, b) => a.title.localeCompare(b.title, "de"));
  const hasSidebarPane = !teacherState.sidebarCollapsed && teacherState.currentWorkspace !== "overview";
  const syncSummary = describeTeacherSyncState();

  if (teacherState.statusLine !== lastRenderedTeacherStatusLine) {
    teacherState.statusLineUpdatedAt = teacherState.statusLine === "Bereit." ? 0 : Date.now();
    lastRenderedTeacherStatusLine = teacherState.statusLine;
    persistTeacherState();
  }

  scheduleTeacherStatusLineReset();
  applyTeacherModalScrollLock();

  teacherRoot.innerHTML = `
    <div class="teacher-shell">
      <header class="teacher-topbar">
        <div>
          <p class="teacher-eyebrow">Lehrkräfte-Version</p>
          <div class="teacher-title-row">
            <h1>FleißTakt Lehrkräfte Studio</h1>
            ${renderTeacherIdentityLine()}
          </div>
          <p class="teacher-subline">Workspaces für Woche, Klassen, Lernende und Kärtchen</p>
        </div>
        <div class="teacher-actions">
          <div class="teacher-status-chip" role="status">${escapeHtml(teacherState.statusLine)}</div>
          <button class="teacher-button" type="button" id="open-teacher-settings">Einstellungen</button>
          <button class="teacher-button teacher-button-primary" type="button" id="sync-teacher-all">Alles synchronisieren</button>
          <button class="teacher-button teacher-button-subtle" type="button" id="import-teacher-sync">Nur vom Server laden</button>
          <label class="teacher-button teacher-button-primary" for="report-package-input">Berichtspakete importieren</label>
          <input id="report-package-input" type="file" accept="application/json,.json" multiple hidden />
        </div>
      </header>

      <main class="teacher-studio ${teacherState.sidebarCollapsed ? "is-sidebar-collapsed" : ""} ${hasSidebarPane ? "has-sidebar-pane" : "is-single-pane"}">
        ${renderWorkspaceRail()}
        ${renderSidebarPane(students, cards)}
        ${renderMainWorkspace(students, cards)}
      </main>

        ${teacherState.toast && !isAnyTeacherModalOpen() ? `<div class="teacher-toast" role="status">${escapeHtml(teacherState.toast)}</div>` : ""}

        <dialog class="teacher-settings-dialog" id="teacher-settings-dialog">
          <form method="dialog" class="teacher-settings-sheet" tabindex="-1">
          <div class="workspace-panel-head">
            <div>
              <p class="teacher-eyebrow">Einstellungen</p>
              <h2>Lehrkräfte-App</h2>
            </div>
          </div>

          ${teacherState.toast ? `<p class="teacher-modal-toast" role="status">${escapeHtml(teacherState.toast)}</p>` : ""}

          <section class="teacher-settings-block">
            <h3>Sync</h3>
            <p class="teacher-settings-copy">Lehrkräfte-Key aus dem WordPress-Plugin eintragen und Berichte, Klassen und Kärtchen per Knopfdruck laden.</p>
            <article class="teacher-sync-summary teacher-sync-summary-${escapeHtml(syncSummary.tone)}">
              <strong>${escapeHtml(syncSummary.title)}</strong>
              <p>${escapeHtml(syncSummary.text)}</p>
              <small>${teacherState.syncTeacherLabel ? `Verbunden als ${escapeHtml(teacherState.syncTeacherLabel)}.` : "Noch keine Serveridentität geladen."}${teacherState.lastServerSyncAt ? ` Letzter vollständiger Sync: ${escapeHtml(formatTeacherDateTime(teacherState.lastServerSyncAt))}.` : ""}</small>
            </article>
            <label>
              <span>Sync-Basis-URL</span>
              <input id="teacher-sync-base-url" type="text" value="${escapeHtml(teacherState.syncBaseUrl)}" />
            </label>
            <label>
              <span>Lehrkräfte-Key</span>
              <input id="teacher-sync-key" type="text" value="${escapeHtml(teacherState.syncTeacherKey)}" />
            </label>
            <div class="teacher-update-actions">
              <button class="teacher-button" type="button" id="save-teacher-sync-settings">Sync speichern</button>
              <button class="teacher-button" type="button" id="settings-sync-teacher-all">Alles synchronisieren</button>
              <button class="teacher-button teacher-button-subtle" type="button" id="settings-import-teacher-sync">Nur vom Server laden</button>
            </div>
            <p class="teacher-settings-copy">Alles synchronisieren sendet lokale Änderungen zum Server und lädt den aktuellen Stand zurück. Nur vom Server laden holt nur den Stand vom Server, ohne lokale Änderungen hochzuladen.</p>
          </section>

          <section class="teacher-settings-block">
            <h3>Backup</h3>
            <p class="teacher-settings-copy">Die Daten der Lehrkräfte-App können hier als Datei gesichert und später wieder eingespielt werden.</p>
            <div class="teacher-update-actions">
              <button class="teacher-button" type="button" id="export-teacher-backup">Backup exportieren</button>
              <label class="teacher-button" for="teacher-backup-input">Backup importieren</label>
              <input id="teacher-backup-input" type="file" accept="application/json,.json" hidden />
            </div>
          </section>

          <section class="teacher-settings-block">
            <h3>Updates</h3>
            <p class="teacher-settings-copy">FleißTakt läuft auch offline weiter. Für eine Update-Prüfung braucht das Gerät nur kurz eine Internet-Verbindung.</p>
            <p class="teacher-update-version">
              Version ${escapeHtml(teacherState.versionInfo.appVersion)} · Cache ${escapeHtml(teacherState.versionInfo.cacheVersion)}
            </p>
            <p class="teacher-update-status" data-state="${escapeHtml(teacherState.updateState)}">${escapeHtml(teacherState.updateStatus)}</p>
            <div class="teacher-update-actions">
              <button class="teacher-button" type="button" id="check-teacher-updates">Nach Updates suchen</button>
              <button class="teacher-button" type="button" id="reload-teacher-app">App neu laden</button>
            </div>
          </section>

          <div class="teacher-update-actions teacher-settings-close">
            <button class="teacher-button" type="button" id="close-teacher-settings">Schließen</button>
            </div>
          </form>
        </dialog>

        <dialog class="teacher-settings-dialog" id="profile-share-dialog">
          <form method="dialog" class="teacher-settings-sheet teacher-share-sheet" tabindex="-1">
            <div class="workspace-panel-head">
              <div>
                <p class="teacher-eyebrow">${escapeHtml(teacherState.profileShareEyebrow || "Kopplung")}</p>
                <h2>${escapeHtml(teacherState.profileShareTitle || "Freigabe")}</h2>
                <p class="teacher-settings-copy">${escapeHtml(teacherState.profileShareDescription || "Der QR-Code und der Link führen direkt zu dieser Freigabe.")}</p>
              </div>
              <button class="teacher-button" type="button" id="close-profile-share-dialog">Schließen</button>
            </div>
            ${teacherState.toast ? `<p class="teacher-modal-toast" role="status">${escapeHtml(teacherState.toast)}</p>` : ""}
            <div class="teacher-share-qr-wrap">
              ${
                teacherState.profileShareUrl
                  ? `<img class="teacher-share-qr" alt="QR-Code für Kopplung" src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&format=svg&data=${encodeURIComponent(teacherState.profileShareUrl)}" />`
                  : `<div class="teacher-share-qr teacher-share-qr-placeholder">Noch keine Kopplungsdaten geladen.</div>`
              }
            </div>
            <div class="teacher-settings-block">
              <label>
                <span>Freigabelink</span>
                <input id="profile-share-url" type="text" readonly value="${escapeHtml(teacherState.profileShareUrl)}" />
              </label>
              <p class="teacher-settings-copy">${escapeHtml(teacherState.profileShareHelp || "Dieser QR-Code und der Link öffnen FleißTakt mit den benötigten Daten.")}</p>
            </div>
            <div class="teacher-update-actions teacher-share-actions">
              <button class="teacher-button teacher-button-primary" type="button" id="copy-profile-share-url">Link kopieren</button>
              <button class="teacher-button" type="button" id="share-profile-package-from-dialog">Teilen</button>
              ${teacherState.profileShareAllowPackageDownload ? '<button class="teacher-button" type="button" id="download-profile-package-from-dialog">Profilpaket laden</button>' : ""}
            </div>
          </form>
        </dialog>

        <dialog class="teacher-settings-dialog" id="sync-progress-dialog">
          <form method="dialog" class="teacher-settings-sheet teacher-sync-sheet" tabindex="-1">
            <div class="workspace-panel-head">
              <div>
                <p class="teacher-eyebrow">Synchronisierung</p>
                <h2>${escapeHtml(teacherState.syncProgressTitle || "Serverabgleich")}</h2>
                <p class="teacher-settings-copy">${escapeHtml(teacherState.syncProgressMessage || "Die Schritte werden nacheinander ausgeführt.")}</p>
              </div>
            </div>
            <section class="teacher-settings-block">
              ${teacherState.toast ? `<p class="teacher-modal-toast teacher-sync-progress-toast" role="status">${escapeHtml(teacherState.toast)}</p>` : ""}
              <div class="teacher-sync-progress-list">
                ${
                  teacherState.syncProgressSteps.map((step) => `
                    <article class="teacher-sync-progress-item is-${escapeHtml(step.state)}">
                      <strong>${escapeHtml(step.label)}</strong>
                      <span>${escapeHtml(
                        step.state === "done"
                          ? "Fertig"
                          : step.state === "running"
                            ? "Läuft"
                            : step.state === "error"
                              ? "Fehler"
                              : "Wartet",
                      )}</span>
                    </article>
                  `).join("")
                }
              </div>
            </section>
            <div class="teacher-update-actions teacher-settings-close">
              <button class="teacher-button" type="button" id="close-sync-progress-dialog" ${teacherState.syncProgressState === "running" ? "disabled" : ""}>Schließen</button>
            </div>
          </form>
        </dialog>

        <dialog class="teacher-settings-dialog" id="teacher-help-dialog">
          <form method="dialog" class="teacher-settings-sheet teacher-help-sheet" tabindex="-1">
            <div class="workspace-panel-head">
              <div>
                <p class="teacher-eyebrow">${escapeHtml(getTeacherHelpTopic(teacherState.helpTopic).eyebrow)}</p>
                <h2>${escapeHtml(getTeacherHelpTopic(teacherState.helpTopic).title)}</h2>
              </div>
              <button class="teacher-button" type="button" id="close-teacher-help-dialog">Schließen</button>
            </div>
            <section class="teacher-settings-block">
              <p class="teacher-settings-copy">${escapeHtml(getTeacherHelpTopic(teacherState.helpTopic).text)}</p>
              ${
                getTeacherHelpTopic(teacherState.helpTopic).bullets.length
                  ? `
                    <ul class="teacher-help-list">
                      ${getTeacherHelpTopic(teacherState.helpTopic).bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                    </ul>
                  `
                  : ""
              }
            </section>
          </form>
        </dialog>

        <dialog class="teacher-settings-dialog" id="teacher-confirm-dialog">
          <form method="dialog" class="teacher-settings-sheet teacher-help-sheet" tabindex="-1">
            <div class="workspace-panel-head">
              <div>
                <p class="teacher-eyebrow">${teacherState.confirmDialogTone === "danger" ? "Sicherheitsabfrage" : "Bitte bestätigen"}</p>
                <h2>${escapeHtml(teacherState.confirmDialogTitle || "Bitte bestätigen")}</h2>
              </div>
            </div>
            <section class="teacher-settings-block">
              <p class="teacher-settings-copy">${escapeHtml(teacherState.confirmDialogMessage)}</p>
              ${teacherState.confirmDialogDetail ? `<p class="teacher-settings-copy">${escapeHtml(teacherState.confirmDialogDetail)}</p>` : ""}
            </section>
            <div class="teacher-update-actions teacher-settings-close">
              <button class="teacher-button" type="button" id="cancel-teacher-confirm">${escapeHtml(teacherState.confirmDialogCancelLabel)}</button>
              <button class="teacher-button ${teacherState.confirmDialogTone === "danger" ? "teacher-button-primary teacher-button-danger" : "teacher-button-primary"}" type="button" id="confirm-teacher-confirm">${escapeHtml(teacherState.confirmDialogConfirmLabel)}</button>
            </div>
          </form>
        </dialog>
      </div>
    `;

  bindTeacherEvents();
}

function bindTeacherEvents() {
  const settingsDialog = document.querySelector("#teacher-settings-dialog");
  const profileShareDialog = document.querySelector("#profile-share-dialog");
  const syncProgressDialog = document.querySelector("#sync-progress-dialog");
  const helpDialog = document.querySelector("#teacher-help-dialog");
  const confirmDialog = document.querySelector("#teacher-confirm-dialog");
  if (settingsDialog) {
    if (teacherState.settingsOpen && !settingsDialog.open) {
      settingsDialog.showModal();
    }

    if (teacherState.settingsOpen) {
      window.requestAnimationFrame(() => {
        const nextFocusTarget = teacherState.settingsFocusId
          ? settingsDialog.querySelector(`#${teacherState.settingsFocusId}`)
          : settingsDialog.querySelector(".teacher-settings-sheet");

        nextFocusTarget?.focus?.();
      });
    }

    settingsDialog.addEventListener("close", () => {
      if (teacherState.settingsOpen) {
        teacherState.settingsOpen = false;
        teacherState.settingsFocusId = "";
        applyTeacherModalScrollLock();
        renderTeacherApp();
      }
    });
  }

  if (profileShareDialog) {
    if (teacherState.profileShareOpen && !profileShareDialog.open) {
      profileShareDialog.showModal();
    }

    profileShareDialog.addEventListener("close", () => {
      if (teacherState.profileShareOpen) {
        closeProfileShareDialog();
      }
    });
  }

  if (syncProgressDialog) {
    if (teacherState.syncProgressOpen && !syncProgressDialog.open) {
      syncProgressDialog.showModal();
    }

    syncProgressDialog.addEventListener("close", () => {
      if (teacherState.syncProgressOpen && teacherState.syncProgressState !== "running") {
        closeSyncProgressDialog();
      }
    });
  }

  if (helpDialog) {
    if (teacherState.helpDialogOpen && !helpDialog.open) {
      helpDialog.showModal();
    }

    helpDialog.addEventListener("close", () => {
      if (teacherState.helpDialogOpen) {
        teacherState.helpDialogOpen = false;
        teacherState.helpTopic = "";
        applyTeacherModalScrollLock();
        renderTeacherApp();
      }
    });
  }

  if (confirmDialog) {
    if (teacherState.confirmDialogOpen && !confirmDialog.open) {
      confirmDialog.showModal();
    }

    confirmDialog.addEventListener("close", () => {
      if (teacherState.confirmDialogOpen) {
        closeTeacherConfirmDialog();
        renderTeacherApp();
      }
    });
  }

  settingsDialog?.querySelectorAll("button[id], input[id], select[id], textarea[id]").forEach((element) => {
    element.addEventListener("click", () => {
      teacherState.settingsFocusId = element.id || "";
    });
    element.addEventListener("focus", () => {
      teacherState.settingsFocusId = element.id || "";
    });
  });

  document.querySelector("#open-teacher-settings")?.addEventListener("click", () => {
    teacherState.settingsOpen = true;
    teacherState.settingsFocusId = "check-teacher-updates";
    applyTeacherModalScrollLock();
    renderTeacherApp();
  });

  document.querySelector("#close-teacher-settings")?.addEventListener("click", () => {
    teacherState.settingsOpen = false;
    teacherState.settingsFocusId = "";
    applyTeacherModalScrollLock();
    renderTeacherApp();
  });

  document.querySelector("#close-profile-share-dialog")?.addEventListener("click", () => {
    closeProfileShareDialog();
  });

  document.querySelector("#close-sync-progress-dialog")?.addEventListener("click", () => {
    if (teacherState.syncProgressState !== "running") {
      closeSyncProgressDialog();
    }
  });

  document.querySelector("#close-teacher-help-dialog")?.addEventListener("click", () => {
    teacherState.helpDialogOpen = false;
    teacherState.helpTopic = "";
    applyTeacherModalScrollLock();
    renderTeacherApp();
  });

  document.querySelector("#cancel-teacher-confirm")?.addEventListener("click", () => {
    closeTeacherConfirmDialog();
    document.querySelector("#teacher-confirm-dialog")?.close();
    renderTeacherApp();
  });

  document.querySelector("#confirm-teacher-confirm")?.addEventListener("click", () => {
    const action = pendingTeacherConfirmAction;
    closeTeacherConfirmDialog();
    document.querySelector("#teacher-confirm-dialog")?.close();
    renderTeacherApp();
    action?.();
  });

  document.querySelectorAll("[data-help-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.helpTopic = button.dataset.helpTopic || "";
      teacherState.helpDialogOpen = true;
      applyTeacherModalScrollLock();
      renderTeacherApp();
    });
  });

  document.querySelector("#copy-profile-share-url")?.addEventListener("click", async () => {
    if (!teacherState.profileShareUrl) {
      return;
    }

    try {
      await navigator.clipboard?.writeText?.(teacherState.profileShareUrl);
      teacherState.statusLine = "Freigabelink kopiert.";
      teacherState.toast = "Freigabelink in die Zwischenablage kopiert.";
    } catch {
      teacherState.statusLine = "Freigabelink konnte nicht kopiert werden.";
      teacherState.toast = "Bitte den Link manuell aus dem Feld kopieren.";
    }
    renderTeacherApp();
  });

  document.querySelector("#download-profile-package-from-dialog")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student) {
      return;
    }
    try {
      await downloadTeacherProfilePackage(student);
    } catch (error) {
      if (error?.message === "fehlender-teacher-key") {
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
      } else {
        teacherState.statusLine = "Profilpaket konnte nicht geladen werden.";
        teacherState.toast = error?.message || "Profilpaket gerade nicht verfügbar.";
      }
    }
    renderTeacherApp();
  });

  document.querySelector("#share-profile-package-from-dialog")?.addEventListener("click", async () => {
    if (!teacherState.profileShareUrl) {
      return;
    }
    const shareTitle = teacherState.profileShareTitle || "FleißTakt Freigabe";
    const shareText = teacherState.profileShareDescription || "FleißTakt Freigabe";
    const shareUrl = teacherState.profileShareUrl;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        teacherState.statusLine = "Freigabe geteilt.";
        teacherState.toast = "Freigabelink wurde geteilt.";
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        teacherState.statusLine = "Freigabelink kopiert.";
        teacherState.toast = "Freigabelink in die Zwischenablage kopiert.";
      } else {
        teacherState.statusLine = "Teilen nicht verfügbar.";
        teacherState.toast = "Bitte den Link manuell kopieren.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        teacherState.statusLine = "Freigabe konnte nicht geteilt werden.";
        teacherState.toast = "Bitte den Link kopieren oder manuell weitergeben.";
      }
    }
    renderTeacherApp();
  });

  const runTeacherSyncImport = async () => {
    setTeacherSyncState("running", "Aktueller Serverstand wird geladen...");
    try {
      const snapshot = await fetchTeacherSyncSnapshot();
      importTeacherSyncSnapshot(snapshot);
      teacherState.toast = "Serverdaten übernommen.";
      setTeacherSyncState("ok", "Der aktuelle Serverstand wurde geladen, ohne lokale Änderungen hochzuladen.", { markSynced: true });
    } catch (error) {
      if (error?.message === "fehlender-teacher-key") {
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
        setTeacherSyncState("pending", "Für den Serverabgleich fehlt noch ein Lehrkräfte-Key.");
      } else if (error?.message && !error.message.includes("teacher-sync-fehlgeschlagen")) {
        teacherState.statusLine = "Server-Sync fehlgeschlagen.";
        teacherState.toast = error.message;
        setTeacherSyncState("error", error.message);
      } else {
        teacherState.statusLine = "Server-Sync fehlgeschlagen.";
        teacherState.toast = "Serverdaten konnten nicht geladen werden.";
        setTeacherSyncState("error", "Serverdaten konnten nicht geladen werden.");
      }
    }
    persistTeacherState();
    renderTeacherApp();
  };

  const runTeacherCardsPush = async () => {
    try {
      const result = await pushTeacherCardsToServer();
      teacherState.statusLine = "Kärtchen mit dem Server synchronisiert.";
      teacherState.lastImportSummary = `${Number(result?.count) || 0} Kärtchen auf dem Server gespeichert.`;
      teacherState.toast = `${Number(result?.count) || 0} Kärtchen zum Server gespeichert.`;
      setTeacherSyncState("ok", "Die Kärtchenbibliothek wurde erfolgreich auf den Server übertragen.", { markSynced: true });
    } catch (error) {
      if (error?.message === "fehlender-teacher-key") {
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
        setTeacherSyncState("pending", "Die Kärtchenbibliothek wartet auf einen hinterlegten Lehrkräfte-Key.");
      } else if (error?.message && !error.message.includes("teacher-cards-fehlgeschlagen")) {
        teacherState.statusLine = "Kärtchen-Sync fehlgeschlagen.";
        teacherState.toast = error.message;
        setTeacherSyncState("error", error.message);
      } else {
        teacherState.statusLine = "Kärtchen-Sync fehlgeschlagen.";
        teacherState.toast = "Kärtchen konnten nicht auf den Server gespeichert werden.";
        setTeacherSyncState("error", "Kärtchen konnten nicht auf den Server gespeichert werden.");
      }
    }
    persistTeacherState();
    renderTeacherApp();
  };

  const runTeacherRosterPush = async () => {
    try {
      const result = await pushTeacherRosterToServer();
      teacherState.statusLine = "Stammdaten mit dem Server synchronisiert.";
      teacherState.lastImportSummary = `${Number(result?.studentCount) || 0} Unterrichte und ${Number(result?.classCount) || 0} Klassen auf dem Server gespeichert.`;
      teacherState.toast = `${Number(result?.studentCount) || 0} Unterrichte zum Server gespeichert.`;
      setTeacherSyncState("ok", "Lernende, Unterrichte und Klassen wurden erfolgreich auf den Server übertragen.", { markSynced: true });
    } catch (error) {
      if (error?.message === "fehlender-teacher-key") {
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
        setTeacherSyncState("pending", "Stammdaten warten auf einen hinterlegten Lehrkräfte-Key.");
      } else if (error?.message && !error.message.includes("teacher-roster-fehlgeschlagen")) {
        teacherState.statusLine = "Stammdaten-Sync fehlgeschlagen.";
        teacherState.toast = error.message;
        setTeacherSyncState("error", error.message);
      } else {
        teacherState.statusLine = "Stammdaten-Sync fehlgeschlagen.";
        teacherState.toast = "Klassen und Lernenden-Daten konnten nicht auf den Server gespeichert werden.";
        setTeacherSyncState("error", "Klassen und Lernenden-Daten konnten nicht auf den Server gespeichert werden.");
      }
    }
    persistTeacherState();
    renderTeacherApp();
  };

  const runTeacherFullSync = async () => {
    openSyncProgress("Alles synchronisieren", [
      { id: "roster", label: "Klassen und Lernenden-Daten zum Server senden" },
      { id: "cards", label: "Kärtchenbibliothek zum Server senden" },
      { id: "snapshot", label: "Aktuellen Serverstand zurückladen" },
    ]);
    setTeacherSyncState("running", "Stammdaten, Kärtchen und Serverstand werden gerade abgeglichen.");

    try {
      updateSyncProgress("roster", "running", "Stammdaten werden zum Server gesendet...");
      await pushTeacherRosterToServer();
      updateSyncProgress("roster", "done", "Stammdaten gespeichert. Kärtchen folgen als Nächstes...");

      updateSyncProgress("cards", "running", "Kärtchenbibliothek wird zum Server gesendet...");
      await pushTeacherCardsToServer();
      updateSyncProgress("cards", "done", "Kärtchen gespeichert. Serverstand wird jetzt geladen...");

      updateSyncProgress("snapshot", "running", "Aktueller Serverstand wird geladen...");
      const snapshot = await fetchTeacherSyncSnapshot();
      const importResult = importTeacherSyncSnapshot(snapshot, {
        preserveLocalCardsOnEmpty: true,
        preserveLocalClassesOnEmpty: true,
        preserveMissingLocalClasses: true,
      });
      updateSyncProgress("snapshot", "done", "Alle Bereiche wurden erfolgreich synchronisiert.");
      if (importResult.preservedLocalCards) {
        finishSyncProgress("success", "Der Serverstand wurde geladen. Die lokale Kärtchenbibliothek bleibt vorsorglich erhalten, weil der Server noch keine Karten zurückgemeldet hat.");
        teacherState.statusLine = "Serverstand geladen. Lokale Kärtchen vorsorglich beibehalten.";
        teacherState.toast = "Der Server hat direkt nach dem Kärtchen-Sync noch keine Karten zurückgemeldet. Die lokale Bibliothek bleibt deshalb vorerst erhalten.";
        setTeacherSyncState("ok", "Stammdaten und Kärtchen wurden übertragen. Die lokale Bibliothek bleibt vorsorglich erhalten, bis der Server die Karten vollständig zurückmeldet.", { markSynced: true });
      } else if (importResult.preservedLocalClasses || importResult.preservedMissingLocalClasses) {
        finishSyncProgress("success", "Der Serverstand wurde geladen. Die lokalen Klassen bleiben vorsorglich erhalten, weil der Server sie direkt nach dem Sync noch nicht vollständig zurückgemeldet hat.");
        teacherState.statusLine = "Serverstand geladen. Lokale Klassen vorsorglich beibehalten.";
        teacherState.toast = "Der Server hat direkt nach dem Klassen-Sync noch nicht alle Klassen zurückgemeldet. Die lokale Liste bleibt deshalb vorerst erhalten.";
        setTeacherSyncState("ok", "Stammdaten wurden übertragen. Die lokalen Klassen bleiben vorsorglich erhalten, bis der Server sie vollständig zurückmeldet.", { markSynced: true });
      } else {
        finishSyncProgress("success", "Stammdaten, Kärtchen und der aktuelle Serverstand sind jetzt synchron.");
        teacherState.statusLine = "Alle Bereiche mit dem Server synchronisiert.";
        teacherState.toast = "Stammdaten, Kärtchen und Serverstand sind jetzt synchron.";
        setTeacherSyncState("ok", "Alle lokalen Änderungen wurden gesendet und mit dem aktuellen Serverstand abgeglichen.", { markSynced: true });
      }
    } catch (error) {
      const runningStep = teacherState.syncProgressSteps.find((step) => step.state === "running");
      if (runningStep) {
        updateSyncProgress(runningStep.id, "error");
      }
      if (error?.message === "fehlender-teacher-key") {
        finishSyncProgress("error", "Lehrkräfte-Key fehlt. Bitte hinterlege zuerst den Zugang in den Einstellungen.");
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
        setTeacherSyncState("pending", "Ohne Lehrkräfte-Key kann gerade nichts mit dem Server abgeglichen werden.");
      } else if (error?.message) {
        finishSyncProgress("error", error.message);
        teacherState.statusLine = "Gesamtsync fehlgeschlagen.";
        teacherState.toast = error.message;
        setTeacherSyncState("error", error.message);
      } else {
        finishSyncProgress("error", "Nicht alle Bereiche konnten synchronisiert werden.");
        teacherState.statusLine = "Gesamtsync fehlgeschlagen.";
        teacherState.toast = "Nicht alle Bereiche konnten synchronisiert werden.";
        setTeacherSyncState("error", "Nicht alle Bereiche konnten synchronisiert werden.");
      }
    }
    persistTeacherState();
    renderTeacherApp();
  };

  document.querySelector("#save-teacher-sync-settings")?.addEventListener("click", () => {
    teacherState.syncBaseUrl = normalizeSyncBaseUrl(document.querySelector("#teacher-sync-base-url")?.value || DEFAULT_SYNC_BASE_URL);
    teacherState.syncTeacherKey = document.querySelector("#teacher-sync-key")?.value?.trim() || "";
    teacherState.statusLine = teacherState.syncTeacherKey ? "Sync-Zugang gespeichert." : "Sync-Zugang zurückgesetzt.";
    setTeacherSyncState(
      teacherState.syncTeacherKey ? teacherState.syncState || "idle" : "pending",
      teacherState.syncTeacherKey
        ? (teacherState.lastServerSyncAt ? `Serverzugang gespeichert. Letzter vollständiger Sync: ${formatTeacherDateTime(teacherState.lastServerSyncAt)}.` : "Serverzugang gespeichert. Der erste vollständige Sync kann jetzt gestartet werden.")
        : "Ohne Lehrkräfte-Key bleiben Änderungen lokal auf diesem Gerät.",
    );
    persistTeacherState();
    teacherState.toast = "Sync-Einstellungen gespeichert.";
    renderTeacherApp();
  });

  document.querySelector("#import-teacher-sync")?.addEventListener("click", async () => {
    await runTeacherSyncImport();
  });

  document.querySelector("#sync-teacher-all")?.addEventListener("click", async () => {
    await runTeacherFullSync();
  });

  document.querySelector("#settings-import-teacher-sync")?.addEventListener("click", async () => {
    teacherState.syncBaseUrl = normalizeSyncBaseUrl(document.querySelector("#teacher-sync-base-url")?.value || DEFAULT_SYNC_BASE_URL);
    teacherState.syncTeacherKey = document.querySelector("#teacher-sync-key")?.value?.trim() || "";
    persistTeacherState();
    await runTeacherSyncImport();
  });

  document.querySelector("#settings-sync-teacher-all")?.addEventListener("click", async () => {
    teacherState.syncBaseUrl = normalizeSyncBaseUrl(document.querySelector("#teacher-sync-base-url")?.value || DEFAULT_SYNC_BASE_URL);
    teacherState.syncTeacherKey = document.querySelector("#teacher-sync-key")?.value?.trim() || "";
    persistTeacherState();
    await runTeacherFullSync();
  });

  document.querySelector("#check-teacher-updates")?.addEventListener("click", async () => {
    await checkTeacherForUpdates();
  });

  document.querySelector("#reload-teacher-app")?.addEventListener("click", async () => {
    await performTeacherAppReload();
  });

  document.querySelector("#sidebar-toggle")?.addEventListener("click", () => {
    teacherState.sidebarCollapsed = !teacherState.sidebarCollapsed;
    persistTeacherState();
    renderTeacherApp();
  });

  document.querySelectorAll("[data-workspace]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.currentWorkspace = button.dataset.workspace;
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelectorAll("[data-feedback-round-id]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedFeedbackRoundId = Number(button.dataset.feedbackRoundId) || "";
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelector("#report-package-input")?.addEventListener("change", async (event) => {
    const files = [...(event.target.files || [])];
    if (files.length) {
      await importReportFiles(files);
    }
    event.target.value = "";
  });

  document.querySelector("#export-teacher-backup")?.addEventListener("click", () => {
    downloadFile({
      filename: `fleisstakt-lehrkraft-backup-${createDateStamp()}.json`,
      content: JSON.stringify(exportTeacherBackupPayload(), null, 2),
      mimeType: "application/json;charset=utf-8",
    });
    teacherState.statusLine = "Lehrkraft-Backup zuletzt exportiert.";
    teacherState.toast = "Lehrkraft-Backup exportiert.";
    renderTeacherApp();
  });

  document.querySelector("#teacher-backup-input")?.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      mergeTeacherBackup(parseTeacherBackup(await file.text()));
      teacherState.statusLine = "Lehrkraft-Backup zuletzt übernommen.";
      teacherState.toast = "Lehrkraft-Backup importiert.";
      teacherState.lastImportSummary = "Backup erfolgreich übernommen und Daten zusammengeführt.";
      persistTeacherState();
      renderTeacherApp();
    } catch (error) {
      teacherState.statusLine = "Der letzte Backup-Import ist fehlgeschlagen.";
      teacherState.toast = error?.message === "ungueltige-pruefsumme"
        ? "Backup ungültig oder verändert. Import verweigert."
        : "Backup-Datei unvollständig oder nicht lesbar.";
      renderTeacherApp();
    }

    event.target.value = "";
  });

  document.querySelectorAll("[data-class-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedClassId = button.dataset.classFilter;
      if (teacherState.currentWorkspace === "classes") {
        teacherState.selectedStudentId = "";
      }
      persistTeacherState();
      renderTeacherApp();
    });
  });

  const syncTeacherSettingsDraft = () => {
    teacherState.syncBaseUrl = document.querySelector("#teacher-sync-base-url")?.value || DEFAULT_SYNC_BASE_URL;
    teacherState.syncTeacherKey = document.querySelector("#teacher-sync-key")?.value || "";
    persistTeacherState();
  };

  ["#teacher-sync-base-url", "#teacher-sync-key"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", syncTeacherSettingsDraft);
    document.querySelector(selector)?.addEventListener("change", syncTeacherSettingsDraft);
  });

  document.querySelector("#class-name-input")?.addEventListener("input", (event) => {
    teacherState.classDraft = event.target.value || "";
    persistTeacherState();
  });

  document.querySelector("#class-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const nameInput = document.querySelector("#class-name-input");
    const name = nameInput?.value?.trim();
    if (!name) {
      return;
    }

    teacherState.classes = [...teacherState.classes, { id: createId("class"), name }].sort((a, b) =>
      a.name.localeCompare(b.name, "de"),
    );
    teacherState.classDraft = "";
    persistTeacherState();
    teacherState.toast = "Klasse angelegt.";
    renderTeacherApp();
    queueTeacherAutoSync({ roster: true });
  });

  document.querySelectorAll("[data-assign-student-to-class]").forEach((button) => {
    button.addEventListener("click", () => {
      const studentId = button.dataset.assignStudentToClass || "";
      const currentClass = selectedClass();
      if (!studentId || !currentClass) {
        return;
      }

      teacherState.students = teacherState.students.map((student) =>
        student.studentId === studentId
          ? normalizeTeacherStudent({
              ...student,
              classId: currentClass.id,
            })
          : student,
      );
      teacherState.statusLine = "Unterricht einer Klasse zugeordnet.";
      teacherState.toast = `${getDisplayName(teacherState.students.find((student) => student.studentId === studentId) || {})} gehört jetzt zu ${currentClass.name}.`;
      persistTeacherState();
      renderTeacherApp();
      queueTeacherAutoSync({ roster: true });
    });
  });

  document.querySelectorAll("[data-remove-student-from-class]").forEach((button) => {
    button.addEventListener("click", () => {
      const studentId = button.dataset.removeStudentFromClass || "";
      if (!studentId) {
        return;
      }

      const targetStudent = teacherState.students.find((student) => student.studentId === studentId);
      if (!targetStudent) {
        return;
      }

      teacherState.students = teacherState.students.map((student) =>
        student.studentId === studentId
          ? normalizeTeacherStudent({
              ...student,
              classId: "",
            })
          : student,
      );
      teacherState.statusLine = "Unterricht aus der Klasse entfernt.";
      teacherState.toast = `${getDisplayName(targetStudent)} ist jetzt keiner Klasse zugeordnet.`;
      persistTeacherState();
      renderTeacherApp();
      queueTeacherAutoSync({ roster: true });
    });
  });

  document.querySelector("#delete-class-button")?.addEventListener("click", () => {
    const currentClass = selectedClass();
    if (!currentClass) {
      return;
    }

    const assignedStudents = teacherState.students.filter((student) => student.classId === currentClass.id);
    openTeacherConfirmDialog(
      {
        tone: "danger",
        title: "Klasse löschen",
        message: assignedStudents.length
          ? `Klasse "${currentClass.name}" wirklich löschen?`
          : `Leere Klasse "${currentClass.name}" wirklich löschen?`,
        detail: assignedStudents.length
          ? `Dabei wird die Klassen-Zuordnung bei ${assignedStudents.length} Unterricht${assignedStudents.length === 1 ? "" : "en"} entfernt. Die betroffenen Unterrichte sind danach keiner Klasse mehr zugeordnet.`
          : "Die Klasse wird endgültig gelöscht.",
        confirmLabel: "Klasse löschen",
      },
      () => {
        teacherState.students = teacherState.students.map((student) =>
          student.classId === currentClass.id
            ? normalizeTeacherStudent({
                ...student,
                classId: "",
              })
            : student,
        );
        teacherState.classes = teacherState.classes.filter((item) => item.id !== currentClass.id);
        teacherState.selectedClassId = "all";
        teacherState.statusLine = "Klasse gelöscht.";
        teacherState.toast = assignedStudents.length
          ? `Klasse gelöscht. ${assignedStudents.length} Unterrichte sind jetzt keiner Klasse zugeordnet.`
          : "Leere Klasse gelöscht.";
        persistTeacherState();
        renderTeacherApp();
        queueTeacherAutoSync({ roster: true });
      },
    );
  });

  document.querySelectorAll("[data-card-id]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedCardId = button.dataset.cardId;
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelector("#new-card-button")?.addEventListener("click", () => {
    teacherState.selectedCardId = "";
    teacherState.cardFormDraft = null;
    persistTeacherState();
    renderTeacherApp();
  });

  const syncCardFormDraft = () => {
    const activeCard = teacherState.cardLibrary.find((card) => card.id === teacherState.selectedCardId) || null;
    teacherState.cardFormDraft = {
      contextId: getCurrentCardDraftContextId(activeCard),
      title: document.querySelector("#card-title")?.value || "",
      description: document.querySelector("#card-description")?.value || "",
      ruleType: document.querySelector("#card-rule-type")?.value || "entriesCountAtLeast",
      ruleValue: document.querySelector("#card-rule-value")?.value || "0",
      ruleCategory: document.querySelector("#card-rule-category")?.value || "",
      accent: document.querySelector("#card-accent")?.value || "gold",
      symbol: document.querySelector("#card-symbol")?.value || "✦",
      rarity: document.querySelector("#card-rarity")?.value || "Spezial",
      status: document.querySelector("#card-status")?.value || "active",
      assignmentType: document.querySelector("#card-assignment-type")?.value || "all",
      assignmentTargetId: document.querySelector("#card-assignment-target")?.value || "",
    };
    persistTeacherState();
  };

  document.querySelector("#card-rule-type")?.addEventListener("change", (event) => {
    const ruleValueInput = document.querySelector("#card-rule-value");
    const ruleCategorySelect = document.querySelector("#card-rule-category");
    if (!ruleValueInput) {
      return;
    }

    const ruleType = event.target.value;
    const isFixedValueRule = ruleType === "morningEntryOnce" || ruleType === "none";
    ruleValueInput.disabled = isFixedValueRule;
    ruleValueInput.value = ruleType === "morningEntryOnce" ? "1" : ruleType === "none" ? "0" : ruleValueInput.value || "5";
    if (ruleCategorySelect) {
      ruleCategorySelect.disabled = ruleType !== "categoryUsed";
      if (ruleType === "categoryUsed" && !ruleCategorySelect.value) {
        ruleCategorySelect.value = getEffectivePracticeCategories()[0] || "";
      }
      if (ruleType !== "categoryUsed") {
        ruleCategorySelect.value = "";
      }
    }
    syncCardFormDraft();
  });

  document.querySelector("#card-assignment-type")?.addEventListener("change", (event) => {
    const targetSelect = document.querySelector("#card-assignment-target");
    if (!targetSelect) {
      return;
    }

    const assignmentType = event.target.value;
    const options = assignmentType === "class"
      ? [`<option value="">Klasse wählen</option>${teacherState.classes
          .sort((a, b) => a.name.localeCompare(b.name, "de"))
          .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
          .join("")}`]
      : assignmentType === "student"
        ? [`<option value="">Person wählen</option>${teacherState.students
            .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"))
            .map((student) => `<option value="${student.studentId}">${escapeHtml(getDisplayName(student))} · ${escapeHtml(student.profileLabel || student.importedInstrument || "")}</option>`)
            .join("")}`]
        : [`<option value="">Nicht nötig</option>`];

    targetSelect.innerHTML = options.join("");
    targetSelect.disabled = assignmentType === "all";
    targetSelect.value = "";
    syncCardFormDraft();
  });

  document.querySelector("#reset-card-form")?.addEventListener("click", () => {
    teacherState.selectedCardId = "";
    teacherState.cardFormDraft = null;
    persistTeacherState();
    renderTeacherApp();
  });

  document.querySelector("#delete-card-button")?.addEventListener("click", () => {
    const cardId = document.querySelector("#card-id")?.value;
    if (!cardId) {
      return;
    }

    teacherState.cardLibrary = teacherState.cardLibrary.filter((card) => card.id !== cardId);
    teacherState.selectedCardId = "";
    if (teacherState.cardFormDraft?.contextId === cardId) {
      teacherState.cardFormDraft = null;
    }
    persistTeacherState();
    teacherState.toast = "Karte gelöscht.";
    renderTeacherApp();
    queueTeacherAutoSync({ cards: true });
  });

  document.querySelector("#card-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const cardId = document.querySelector("#card-id")?.value;
    const existing = teacherState.cardLibrary.find((card) => card.id === cardId) || null;
    const rule = normalizeCardRule({
      type: document.querySelector("#card-rule-type")?.value,
      value: document.querySelector("#card-rule-value")?.value,
      category: document.querySelector("#card-rule-category")?.value,
    });
    const assignmentType = document.querySelector("#card-assignment-type")?.value || "all";
    const assignmentTarget = assignmentType === "all"
      ? ""
      : (document.querySelector("#card-assignment-target")?.value || "");
    const draft = normalizeTeacherCard({
      id: existing?.id || undefined,
      title: document.querySelector("#card-title")?.value?.trim() || "Neues Kärtchen",
      description: document.querySelector("#card-description")?.value?.trim() || describeRule(rule),
      accent: document.querySelector("#card-accent")?.value,
      symbol: document.querySelector("#card-symbol")?.value?.trim() || "✦",
      rarity: document.querySelector("#card-rarity")?.value,
      status: document.querySelector("#card-status")?.value,
      awardCount: existing?.awardCount || 0,
      assignment: {
        type: assignmentType,
        targetId: assignmentTarget,
      },
      rule,
      createdAt: existing?.createdAt,
      updatedAt: new Date().toISOString(),
    });

    if (existing) {
      teacherState.cardLibrary = teacherState.cardLibrary.map((card) => (card.id === draft.id ? draft : card));
      teacherState.toast = "Karte aktualisiert.";
    } else {
      teacherState.cardLibrary = [draft, ...teacherState.cardLibrary];
      teacherState.toast = "Karte angelegt.";
    }

    teacherState.cardLibrary.sort((a, b) => a.title.localeCompare(b.title, "de"));
    teacherState.selectedCardId = draft.id;
    teacherState.cardFormDraft = null;
    persistTeacherState();
    renderTeacherApp();
    queueTeacherAutoSync({ cards: true });
  });

  [
    "#card-title",
    "#card-description",
    "#card-rule-type",
    "#card-rule-value",
    "#card-rule-category",
    "#card-accent",
    "#card-symbol",
    "#card-rarity",
    "#card-status",
    "#card-assignment-type",
    "#card-assignment-target",
  ].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", syncCardFormDraft);
    document.querySelector(selector)?.addEventListener("change", syncCardFormDraft);
  });

  document.querySelector("#practice-categories-input")?.addEventListener("input", (event) => {
    teacherState.practiceCategoriesDraft = event.target.value || "";
    persistTeacherState();
  });

  document.querySelector("#practice-categories-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    teacherState.practiceCategories = normalizePracticeCategories(document.querySelector("#practice-categories-input")?.value || "");
    teacherState.practiceCategoriesDraft = "";
    teacherState.toast = "Übekategorien aktualisiert.";
    teacherState.statusLine = "Übekategorien lokal gespeichert.";
    persistTeacherState();
    renderTeacherApp();
    queueTeacherAutoSync({ roster: true });
  });

  document.querySelector("#load-starter-card-set")?.addEventListener("click", () => {
    openTeacherConfirmDialog(
      {
        title: "Starter-Set laden",
        message: "Das Starter-Set mit 20 Kärtchen jetzt in die Bibliothek laden?",
        detail: "Bereits vorhandene Kärtchen bleiben erhalten.",
        confirmLabel: "Starter-Set laden",
      },
      () => {
        const existingIds = new Set(teacherState.cardLibrary.map((card) => card.id));
        const starterCards = buildStarterCardSet().filter((card) => !existingIds.has(card.id));
        teacherState.cardLibrary = [...teacherState.cardLibrary, ...starterCards].sort((a, b) => a.title.localeCompare(b.title, "de"));
        teacherState.selectedCardId = teacherState.selectedCardId || starterCards[0]?.id || teacherState.selectedCardId;
        teacherState.toast = `${starterCards.length} Starter-Kärtchen ergänzt.`;
        teacherState.statusLine = "Starter-Set geladen.";
        persistTeacherState();
        renderTeacherApp();
        queueTeacherAutoSync({ cards: true });
      },
    );
  });

  document.querySelector("#manual-award-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const cardId = document.querySelector("#manual-award-card-id")?.value?.trim() || "";
    const studentId = document.querySelector("#manual-award-student-id")?.value?.trim() || "";
    const note = (document.querySelector("#manual-award-note")?.value?.trim() || "").slice(0, CARD_AWARD_NOTE_MAX_LENGTH);
    if (!cardId || !studentId) {
      teacherState.toast = "Bitte zuerst Kärtchen und Unterricht auswählen.";
      renderTeacherApp();
      return;
    }

    try {
      await pushTeacherRosterToServer();
      await pushTeacherCardsToServer();
      await saveTeacherCardAwardOnServer("award", { cardId, studentId, note });
      const snapshot = await fetchTeacherSyncSnapshot();
      importTeacherSyncSnapshot(snapshot);
      teacherState.manualAwardDraft = null;
      teacherState.statusLine = "Kärtchen direkt verliehen.";
      teacherState.toast = "Das Kärtchen ist gespeichert und beim nächsten Sync für Lernende sichtbar.";
      persistTeacherState();
      renderTeacherApp();
    } catch (error) {
      teacherState.statusLine = "Kärtchen-Vergabe fehlgeschlagen.";
      teacherState.toast = error?.message || "Die direkte Vergabe konnte nicht gespeichert werden.";
      renderTeacherApp();
    }
  });

  const syncManualAwardDraft = () => {
    const cardId = document.querySelector("#manual-award-card-id")?.value || "";
    if (!cardId) {
      return;
    }
    teacherState.manualAwardDraft = {
      cardId,
      studentId: document.querySelector("#manual-award-student-id")?.value || "",
      note: document.querySelector("#manual-award-note")?.value || "",
    };
    persistTeacherState();
  };

  ["#manual-award-student-id", "#manual-award-note"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", syncManualAwardDraft);
    document.querySelector(selector)?.addEventListener("change", syncManualAwardDraft);
  });

  document.querySelectorAll("[data-revoke-award]").forEach((button) => {
    button.addEventListener("click", async () => {
      const awardId = Number(button.dataset.revokeAward || 0);
      const cardId = button.dataset.revokeCard || "";
      if (!awardId) {
        return;
      }

      openTeacherConfirmDialog(
        {
          tone: "danger",
          title: "Direkte Vergabe zurücknehmen",
          message: "Dieses direkt verliehene Kärtchen wirklich zurücknehmen?",
          detail: "Das Kärtchen verschwindet danach beim zugeordneten Unterricht wieder aus der direkten Vergabe.",
          confirmLabel: "Vergabe zurücknehmen",
        },
        async () => {
          try {
            await saveTeacherCardAwardOnServer("revoke", { awardId, cardId });
            const snapshot = await fetchTeacherSyncSnapshot();
            importTeacherSyncSnapshot(snapshot);
            teacherState.statusLine = "Direkt verliehenes Kärtchen entfernt.";
            teacherState.toast = "Die direkte Vergabe wurde zurückgenommen.";
            persistTeacherState();
            renderTeacherApp();
          } catch (error) {
            teacherState.statusLine = "Direkte Vergabe konnte nicht entfernt werden.";
            teacherState.toast = error?.message || "Das verliehene Kärtchen konnte nicht zurückgenommen werden.";
            renderTeacherApp();
          }
        },
      );
    });
  });

  document.querySelectorAll("[data-student-id]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedStudentId = button.dataset.studentId;
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelectorAll("[data-week-student-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextId = button.dataset.weekStudentId || "";
      teacherState.selectedWeekStudentId =
        teacherState.selectedWeekStudentId === nextId ? "" : nextId;
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelectorAll("[data-person-id]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedStudentId = button.dataset.studentId || "";
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelectorAll("[data-profile-id]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedStudentId = button.dataset.profileId || "";
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelectorAll("#new-student-button").forEach((button) => {
    button.addEventListener("click", () => {
      const nextStudent = createEmptyTeacherStudent();
      teacherState.students = [nextStudent, ...teacherState.students].sort((a, b) =>
        getDisplayName(a).localeCompare(getDisplayName(b), "de"),
      );
      teacherState.selectedStudentId = nextStudent.studentId;
      teacherState.currentWorkspace = "students";
      teacherState.statusLine = "Neue lernende Person angelegt.";
      teacherState.toast = "Bitte jetzt Stammdaten ergänzen und speichern.";
      persistTeacherState();
      renderTeacherApp();
    });
  });

  document.querySelector("#add-profile-button")?.addEventListener("click", () => {
    const activeStudent = selectedStudent();
    if (!activeStudent) {
      return;
    }

    const nextProfile = createSiblingTeacherProfile(activeStudent);
    teacherState.students = [nextProfile, ...teacherState.students].sort((a, b) =>
      getDisplayName(a).localeCompare(getDisplayName(b), "de"),
    );
    teacherState.selectedStudentId = nextProfile.studentId;
      teacherState.statusLine = "Neuer Unterricht angelegt.";
      teacherState.toast = "Bitte Instrument, Unterrichtsbezeichnung und Ziel ergänzen.";
    persistTeacherState();
    renderTeacherApp();
  });

  document.querySelector("#delete-profile-button")?.addEventListener("click", () => {
    const activeStudent = selectedStudent();
    if (!activeStudent) {
      return;
    }

    const samePersonProfiles = teacherState.students.filter((student) => getPersonId(student) === getPersonId(activeStudent));
    openTeacherConfirmDialog(
      {
        tone: "danger",
        title: "Unterricht löschen",
        message: samePersonProfiles.length > 1
          ? `Unterricht "${activeStudent.profileLabel || activeStudent.importedInstrument || "Unterricht"}" wirklich löschen?`
          : `Dieser Unterricht ist der letzte Unterricht von ${getDisplayName(activeStudent)}.`,
        detail: samePersonProfiles.length > 1
          ? "Die Daten dieses Unterrichts werden aus der Lehrkräfte-App entfernt."
          : "Wenn du fortfährst, wird die gesamte lernende Person mit diesem letzten Unterricht entfernt.",
        confirmLabel: samePersonProfiles.length > 1 ? "Unterricht löschen" : "Alles löschen",
      },
      () => {
        const nextProfiles = teacherState.students.filter((student) => student.studentId !== activeStudent.studentId);
        const sibling = samePersonProfiles.find((student) => student.studentId !== activeStudent.studentId);
        const fallback = nextProfiles[0] || null;

        teacherState.students = nextProfiles;
        if (teacherState.studentFormDraft?.studentId === activeStudent.studentId) {
          teacherState.studentFormDraft = null;
        }
        teacherState.selectedStudentId = sibling?.studentId || fallback?.studentId || "";
        teacherState.statusLine = "Unterricht entfernt.";
        teacherState.toast = samePersonProfiles.length > 1
          ? "Der ausgewählte Unterricht wurde gelöscht."
          : "Die lernende Person hatte nur diesen einen Unterricht und wurde vollständig entfernt.";
        persistTeacherState();
        renderTeacherApp();
        queueTeacherAutoSync({ roster: true });
      },
    );
  });

  document.querySelector("#student-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const studentId = document.querySelector("#student-id")?.value;
    if (!studentId) {
      return;
    }

    teacherState.students = teacherState.students.map((student) =>
      student.studentId === studentId
        ? normalizeTeacherStudent({
            ...student,
            importedDisplayName: document.querySelector("#student-display-name")?.value?.trim() || student.importedDisplayName || getDisplayName(student),
                  firstName: document.querySelector("#student-first-name")?.value?.trim() || "",
                  lastName: document.querySelector("#student-last-name")?.value?.trim() || "",
                  email: document.querySelector("#student-email")?.value?.trim() || "",
                  messengerId: document.querySelector("#student-messenger")?.value?.trim() || "",
                  classId: document.querySelector("#student-class-id")?.value || "",
    profileLabel: document.querySelector("#student-profile-label")?.value?.trim() || "Unterricht",
            importedInstrument: document.querySelector("#student-instrument")?.value?.trim() || "",
            importedGoal: Number(document.querySelector("#student-goal")?.value) || 15,
          })
        : student,
    );

    if (teacherState.studentFormDraft?.studentId === studentId) {
      teacherState.studentFormDraft = null;
    }

    persistTeacherState();
    teacherState.toast = "Lernende Person aktualisiert.";
    renderTeacherApp();
    queueTeacherAutoSync({ roster: true });
  });

  const syncStudentFormDraft = () => {
    const studentId = document.querySelector("#student-id")?.value || "";
    if (!studentId) {
      return;
    }

    teacherState.studentFormDraft = {
      studentId,
      importedDisplayName: document.querySelector("#student-display-name")?.value || "",
      firstName: document.querySelector("#student-first-name")?.value || "",
      lastName: document.querySelector("#student-last-name")?.value || "",
      email: document.querySelector("#student-email")?.value || "",
      messengerId: document.querySelector("#student-messenger")?.value || "",
      classId: document.querySelector("#student-class-id")?.value || "",
      profileLabel: document.querySelector("#student-profile-label")?.value || "",
      importedInstrument: document.querySelector("#student-instrument")?.value || "",
      importedGoal: document.querySelector("#student-goal")?.value || "15",
    };
    persistTeacherState();
  };

  [
    "#student-display-name",
    "#student-first-name",
    "#student-last-name",
    "#student-email",
    "#student-messenger",
    "#student-class-id",
    "#student-profile-label",
    "#student-instrument",
    "#student-goal",
  ].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", syncStudentFormDraft);
    document.querySelector(selector)?.addEventListener("change", syncStudentFormDraft);
  });

  document.querySelector("#download-profile-package")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student) {
      return;
    }

    try {
      await downloadTeacherProfilePackage(student);
    } catch (error) {
      if (error?.message === "fehlender-teacher-key") {
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
      } else {
        teacherState.statusLine = "Profilpaket konnte nicht geladen werden.";
        teacherState.toast = error?.message || "Profilpaket konnte nicht erzeugt werden.";
      }
    }
    renderTeacherApp();
  });

  document.querySelector("#share-learner-app")?.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "FleißTakt Lernenden-App",
          text: "Installiere zuerst die FleißTakt Lernenden-App und öffne sie einmal auf dem Gerät.",
          url: APP_SHARE_URL,
        });
        teacherState.statusLine = "Lernenden-App geteilt.";
        teacherState.toast = "Link zur Lernenden-App wurde geteilt.";
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(APP_SHARE_URL);
        teacherState.statusLine = "App-Link kopiert.";
        teacherState.toast = "Link zur Lernenden-App in die Zwischenablage kopiert.";
      } else {
        teacherState.statusLine = "Teilen nicht verfügbar.";
        teacherState.toast = "Bitte den App-Link manuell weitergeben.";
      }
    } catch (error) {
      teacherState.statusLine = "Lernenden-App konnte nicht geteilt werden.";
      teacherState.toast = error?.name === "AbortError" ? "Teilen wurde abgebrochen." : "Teilen gerade nicht möglich.";
    }
    renderTeacherApp();
  });

  document.querySelector("#show-learner-app-qr")?.addEventListener("click", () => {
    openLearnerAppShareDialog();
  });

  document.querySelector("#copy-student-id")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student?.studentId || !student?.connectCode) {
      return;
    }

    try {
      await navigator.clipboard?.writeText?.(student.studentId);
      teacherState.statusLine = "Lernenden-ID kopiert.";
      teacherState.toast = "Lernenden-ID in die Zwischenablage kopiert.";
    } catch {
      teacherState.statusLine = "Lernenden-ID konnte nicht kopiert werden.";
      teacherState.toast = "Kopieren gerade nicht möglich.";
    }
    renderTeacherApp();
  });

  document.querySelector("#copy-connect-code")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student?.studentId || !student?.connectCode) {
      return;
    }

    try {
      await navigator.clipboard?.writeText?.(student.connectCode);
      teacherState.statusLine = "Verbindungscode kopiert.";
      teacherState.toast = "Verbindungscode in die Zwischenablage kopiert.";
    } catch {
      teacherState.statusLine = "Verbindungscode konnte nicht kopiert werden.";
      teacherState.toast = "Kopieren gerade nicht möglich.";
    }
    renderTeacherApp();
  });

  document.querySelector("#share-connect-data")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student?.studentId || !student?.connectCode) {
      return;
    }

    const text = buildStudentConnectionText(student);
    const url = buildStudentConnectionUrl(student);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `FleißTakt Verbindung für ${getDisplayName(student)}`,
          text,
          url: url || undefined,
        });
        teacherState.statusLine = "Kopplungsdaten geteilt.";
        teacherState.toast = "Kopplungsdaten wurden geteilt.";
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        teacherState.statusLine = "Kopplungsdaten kopiert.";
        teacherState.toast = "Kopplungsdaten in die Zwischenablage kopiert.";
      } else {
        teacherState.statusLine = "Teilen nicht verfügbar.";
        teacherState.toast = "Teilen auf diesem Gerät nicht verfügbar.";
      }
    } catch (error) {
      teacherState.statusLine = "Kopplungsdaten konnten nicht geteilt werden.";
      teacherState.toast = error?.name === "AbortError" ? "Teilen wurde abgebrochen." : "Teilen gerade nicht möglich.";
    }
    renderTeacherApp();
  });

  document.querySelector("#share-profile-package")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student) {
      return;
    }

    try {
      await shareTeacherProfilePackage(student);
    } catch (error) {
      if (error?.message === "fehlender-teacher-key") {
        teacherState.statusLine = "Lehrkräfte-Key fehlt.";
        teacherState.toast = "Bitte zuerst Lehrkräfte-Key hinterlegen.";
      } else {
        teacherState.statusLine = "Profilpaket konnte nicht geteilt werden.";
        teacherState.toast = error?.message || "Teilen gerade nicht möglich.";
      }
    }
    renderTeacherApp();
  });

  document.querySelector("#show-profile-qr")?.addEventListener("click", async () => {
    const student = selectedStudent();
    if (!student?.studentId || !student?.connectCode) {
      teacherState.statusLine = "Kopplungsdaten fehlen.";
      teacherState.toast = "Bitte zuerst Lernenden-ID und Verbindungscode synchronisieren.";
      renderTeacherApp();
      return;
    }

    try {
      await openTeacherProfileQr(student);
    } catch (error) {
      teacherState.statusLine = "Kopplungs-QR konnte nicht geladen werden.";
      teacherState.toast = error?.message || "Kopplungsdaten konnten nicht angezeigt werden.";
      renderTeacherApp();
    }
  });

  document.querySelector("#merge-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const targetStudentId = document.querySelector("#merge-target-student-id")?.value;
    const sourceStudentId = document.querySelector("#merge-source-student-id")?.value;
    if (!targetStudentId || !sourceStudentId) {
      return;
    }

    if (mergeStudents(targetStudentId, sourceStudentId)) {
      persistTeacherState();
      teacherState.toast = "Lernende Personen zusammengeführt.";
      renderTeacherApp();
    }
  });

  if (teacherState.toast && !isAnyTeacherModalOpen()) {
    window.setTimeout(() => {
      if (!teacherState.toast || isAnyTeacherModalOpen()) {
        return;
      }
      teacherState.toast = "";
      renderTeacherApp();
    }, TEACHER_TOAST_TTL_MS);
  }
}

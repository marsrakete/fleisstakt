const STORAGE_KEY = "fleisstakt-state-v1";
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
const categories = ["Technik", "Stück", "Tonleiter", "Freies Spiel"];
const cardDefinitions = [
  {
    id: "warm-gespielt",
    title: "Warm gespielt",
    description: "3 Tage in Folge geübt",
    accent: "apricot",
    isUnlocked(stats) {
      return stats.streak >= 3;
    },
  },
  {
    id: "taktsicher",
    title: "Taktsicher",
    description: "60 Minuten in einer Woche",
    accent: "gold",
    isUnlocked(stats) {
      return stats.weekMinutes >= 60;
    },
  },
  {
    id: "morgenklang",
    title: "Morgenklang",
    description: "Vor 8 Uhr geübt",
    accent: "sky",
    isUnlocked(stats) {
      return stats.hasMorningEntry;
    },
  },
  {
    id: "buehnenmut",
    title: "Bühnenmut",
    description: "7 Einträge mit Notiz",
    accent: "mint",
    isUnlocked(stats) {
      return stats.notedEntryCount >= 7;
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
  category: categories[0],
  note: "",
  celebrate: false,
  celebrationText: "Neues Kärtchen vorbereitet. Weiter so!",
  profileName: "Mila",
  entries: [],
  profilePanel: "profil",
  goal: 15,
  installPrompt: null,
  installReady: false,
  prefersDesktopActions: window.matchMedia("(pointer:fine)").matches,
  reportRange: "week",
  settingsOpen: false,
  updateStatus: "Noch nicht geprüft.",
  updateState: "idle",
  updateReady: false,
  versionInfo: CURRENT_VERSION_INFO,
};
let serviceWorkerRegistration = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        serviceWorkerRegistration = registration;
        watchServiceWorker(registration);
      })
      .catch(() => {
        state.updateStatus = "Update-Prüfung auf diesem Gerät nicht verfügbar.";
      });
  });
}

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

function watchServiceWorker(registration) {
  if (registration.waiting) {
    markUpdateReady();
  }

  registration.addEventListener("updatefound", () => {
    state.updateState = "checking";
    state.updateStatus = "Neue Version wird geprüft...";
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
          state.updateStatus = "App ist auf dem aktuellen Stand.";
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

function hydrateState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.entries = [...defaultEntries];
      persistState();
      return;
    }

    const parsed = JSON.parse(raw);
    state.entries = Array.isArray(parsed.entries) ? parsed.entries : [...defaultEntries];
    state.instrument = parsed.instrument || instruments[0];
    state.profileName = parsed.profileName || "Mila";
    state.goal = Number(parsed.goal) || 15;
  } catch {
    state.entries = [...defaultEntries];
  }
}

function persistState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      entries: state.entries,
      instrument: state.instrument,
      profileName: state.profileName,
      goal: state.goal,
    }),
  );
}

function exportBackupPayload() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "FleißTakt",
    version: state.versionInfo.appVersion,
    data: {
      entries: state.entries,
      instrument: state.instrument,
      profileName: state.profileName,
      goal: state.goal,
      reportRange: state.reportRange,
    },
  };

  return {
    ...payload,
    checksum: createBackupChecksum(payload),
  };
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
  state.goal = Number(backup.goal) || 15;
  state.reportRange = backup.reportRange || "week";
  persistState();
}

function createBackupChecksum(payload) {
  const normalized = JSON.stringify(payload);
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `ft-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function getTodayKey() {
  return formatDateKey(new Date());
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
  const notedEntryCount = entries.filter((entry) => entry.note.trim()).length;
  const hasMorningEntry = entries.some((entry) => new Date(entry.savedAt).getHours() < 8);

  return {
    entries,
    weekTimeline,
    streak,
    todayMinutes,
    weekMinutes,
    notedEntryCount,
    hasMorningEntry,
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
  return cardDefinitions.map((card) => ({
    ...card,
    unlocked: card.isUnlocked(stats),
    statusLabel: card.isUnlocked(stats) ? "Ge&shy;sam&shy;melt" : "Bald frei",
    symbol:
      {
        "warm-gespielt": "♬",
        taktsicher: "✦",
        morgenklang: "☀",
        buehnenmut: "✺",
      }[card.id] || "♪",
    rarity:
      {
        "warm-gespielt": "Bronze",
        taktsicher: "Gold",
        morgenklang: "Silber",
        buehnenmut: "Spezial",
      }[card.id] || "Basis",
    progressText: cardProgressText(card.id, stats),
  }));
}

function cardProgressText(cardId, stats) {
  if (cardId === "warm-gespielt") {
    return `${Math.min(stats.streak, 3)}/3 Tage Serie`;
  }

  if (cardId === "taktsicher") {
    return `${Math.min(stats.weekMinutes, 60)}/60 Minuten diese Woche`;
  }

  if (cardId === "morgenklang") {
    return stats.hasMorningEntry ? "Vor 8 Uhr geschafft" : "Ein Morgen-Eintrag fehlt noch";
  }

  if (cardId === "buehnenmut") {
    return `${Math.min(stats.notedEntryCount, 7)}/7 Einträge mit Notiz`;
  }

  return "";
}

function nextCardProgress(stats) {
  const progressCandidates = [
    Math.min(100, Math.round((stats.streak / 3) * 100)),
    Math.min(100, Math.round((stats.weekMinutes / 60) * 100)),
    Math.min(100, Math.round((stats.notedEntryCount / 7) * 100)),
    stats.hasMorningEntry ? 100 : 20,
  ];

  return Math.max(...progressCandidates);
}

function nextCardName(cards) {
  const lockedCard = cards.find((card) => !card.unlocked);
  return lockedCard ? lockedCard.title : "Alle Kärtchen gesammelt";
}

function todayScreen() {
  const stats = getStats();
  const cards = getCards(stats);
  const progress = nextCardProgress(stats);

  return `
    <section class="screen screen-today">
      <div class="hero-panel">
        <p class="hero-kicker">Heute im Takt bleiben</p>
        <h2>Jeder Eintrag bringt ein neues Kärtchen näher.</h2>
        <p class="hero-copy">
          Schnell protokollieren, Serie halten und kleine Erfolgsmomente sammeln.
        </p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-nav="log">Übung eintragen</button>
          <button class="secondary-button" type="button" data-nav="cards">Kärtchen ansehen</button>
        </div>
      </div>

      <section class="daily-focus">
        <div>
          <p class="label">Heutiges Ziel</p>
          <strong>${state.goal} Minuten</strong>
        </div>
        <div>
          <p class="label">Serie</p>
          <strong>${stats.streak} Tage</strong>
        </div>
        <div>
          <p class="label">Diese Woche</p>
          <strong>${stats.weekMinutes} Minuten</strong>
        </div>
      </section>

      <section class="daily-focus">
        <div>
          <p class="label">Heute gespielt</p>
          <strong>${stats.todayMinutes} Minuten</strong>
        </div>
        <div>
          <p class="label">Einträge</p>
          <strong>${stats.entries.length}</strong>
        </div>
        <div>
          <p class="label">Notizen</p>
          <strong>${stats.notedEntryCount}</strong>
        </div>
      </section>

      <section class="progress-band">
        <div class="progress-copy">
          <p class="label">Nächstes Fleiß-Kärtchen</p>
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
  return `
    <section class="screen screen-log">
      <div class="section-head">
        <h2>Übung eintragen</h2>
        <p>In zwei Schritten erledigt.</p>
      </div>

      <label class="field">
        <span>Instrument</span>
        <select id="instrument-select">
          ${instruments
            .map(
              (item) => `
                <option value="${item}" ${state.instrument === item ? "selected" : ""}>${item}</option>
              `,
            )
            .join("")}
        </select>
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

  return `
    <section class="screen screen-cards">
      <div class="section-head">
        <h2>Fleiß-Kärtchen</h2>
        <p>Sammle kleine Etappensiege statt trockener Statistiken.</p>
      </div>
      <div class="daily-focus">
        <div>
          <p class="label">Freigeschaltet</p>
          <strong>${cards.filter((card) => card.unlocked).length}/${cards.length}</strong>
        </div>
        <div>
          <p class="label">Serie</p>
          <strong>${stats.streak} Tage</strong>
        </div>
        <div>
          <p class="label">Wochenzeit</p>
          <strong>${stats.weekMinutes} Min</strong>
        </div>
      </div>
      <section class="album-strip">
        ${cards
          .map(
            (card) => `
              <div class="album-chip ${card.unlocked ? "is-unlocked" : "is-locked"} accent-${card.accent}">
                <span>${card.symbol}</span>
                <strong>${card.title}</strong>
              </div>
            `,
          )
          .join("")}
      </section>
      <div class="card-grid">
        ${cards
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
                </div>
              </article>
            `,
          )
          .join("")}
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

  return `
    <section class="screen screen-profile">
      <div class="section-head">
        <h2>Profil</h2>
        <p>Profil fuer Lernende und eine ruhige Sicht fuer Eltern oder Lehrkraft.</p>
      </div>
      <div class="pill-row">
        <button class="pill ${state.profilePanel === "profil" ? "is-active" : ""}" type="button" data-panel="profil">
          Profil
        </button>
        <button class="pill ${state.profilePanel === "begleitung" ? "is-active" : ""}" type="button" data-panel="begleitung">
          Begleitung
        </button>
      </div>
      ${
        state.profilePanel === "profil"
          ? `
      <form class="settings-form" id="profile-form">
        <label class="field">
          <span>Name</span>
          <input id="profile-name" type="text" value="${escapeHtml(state.profileName)}" maxlength="24" />
        </label>
        <label class="field">
          <span>Hauptinstrument</span>
          <select id="profile-instrument">
            ${instruments
              .map(
                (item) => `
                  <option value="${item}" ${state.instrument === item ? "selected" : ""}>${item}</option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="field">
          <span>Tagesziel in Minuten</span>
          <input id="profile-goal" type="range" min="5" max="60" step="5" value="${state.goal}" />
          <strong class="range-value" id="goal-value">${state.goal} Minuten</strong>
        </label>
        <button class="primary-button" id="save-profile" type="submit">Profil speichern</button>
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
      </div>
      `
          : `
      <div class="profile-stack">
        <article class="profile-line">
          <span>Diese Woche</span>
          <strong>${stats.weekMinutes} Minuten</strong>
        </article>
        <article class="profile-line">
          <span>Regelmaessigkeit</span>
          <strong>${stats.streak} Tage Serie</strong>
        </article>
        <article class="profile-line">
          <span>Freigeschaltete Kärtchen</span>
          <strong>${getCards(stats).filter((card) => card.unlocked).length}</strong>
        </article>
        <article class="profile-line">
          <span>Letzte Eintraege</span>
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
            <p>${stats.streak >= 3 ? "Die Uebungsroutine wirkt gerade stabil." : "Eine kleine Erinnerung koennte heute helfen."}</p>
          </article>
          <article class="mentor-card">
            <strong>Fokus</strong>
            <p>${reportData.entries[0] ? `${reportData.entries[0].category} war zuletzt der Schwerpunkt.` : "Noch keine Eintraege im gewählten Zeitraum vorhanden."}</p>
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
  root.innerHTML = `
    <div class="app-shell">
      <div class="app-frame ${state.celebrate ? "is-celebrating" : ""}">
        <header class="topbar">
          <div>
            <p class="eyebrow">PWA Prototype</p>
            <h1>FleißTakt</h1>
          </div>
          <div class="topbar-actions">
            <button class="ghost-button ${state.installReady ? "" : "is-disabled"}" type="button" id="install-app">
              ${state.installReady ? "Installieren" : "Schon als App nutzbar"}
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

      <dialog class="settings-dialog" id="settings-dialog" ${state.settingsOpen ? "open" : ""}>
        <form method="dialog" class="settings-sheet">
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
            <p class="settings-copy">Alle Einträge und Profileinstellungen als Datei sichern oder wieder einspielen.</p>
            <div class="settings-actions">
              <button class="secondary-action" type="button" id="export-backup-button">Backup exportieren</button>
              <label class="secondary-action settings-file-label" for="backup-input">Backup importieren</label>
              <input id="backup-input" type="file" accept="application/json,.json" hidden />
            </div>
          </section>

          <section class="settings-block">
            <h3>Updates</h3>
            <p class="settings-copy" id="version-label">Version ${escapeHtml(state.versionInfo.appVersion)} · Cache ${escapeHtml(state.versionInfo.cacheVersion)}</p>
            <p class="settings-status" data-state="${state.updateState}">${escapeHtml(state.updateStatus)}</p>
            <div class="settings-actions">
              <button class="secondary-action" type="button" id="check-updates-button">Nach Updates suchen</button>
              ${state.updateReady ? `<button class="secondary-action" type="button" id="reload-app-button">App neu laden</button>` : ""}
            </div>
          </section>

          <div class="settings-actions settings-actions-close">
            <button class="secondary-action" type="button" id="close-settings">Schließen</button>
          </div>
        </form>
      </dialog>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
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

  const installButton = document.querySelector("#install-app");
  if (installButton) {
    installButton.addEventListener("click", async () => {
      await handleInstallPrompt();
    });
  }

  const settingsInstallButton = document.querySelector("#settings-install-app");
  if (settingsInstallButton) {
    settingsInstallButton.addEventListener("click", async () => {
      await handleInstallPrompt();
    });
  }

  const openSettingsButton = document.querySelector("#open-settings");
  if (openSettingsButton) {
    openSettingsButton.addEventListener("click", () => {
      state.settingsOpen = true;
      render();
    });
  }

  const closeSettingsButton = document.querySelector("#close-settings");
  if (closeSettingsButton) {
    closeSettingsButton.addEventListener("click", () => {
      state.settingsOpen = false;
      render();
    });
  }

  const exportBackupButton = document.querySelector("#export-backup-button");
  if (exportBackupButton) {
    exportBackupButton.addEventListener("click", () => {
      downloadFile({
        filename: `fleisstakt-backup-${createDateStamp()}.json`,
        content: JSON.stringify(exportBackupPayload(), null, 2),
        mimeType: "application/json;charset=utf-8",
      });
      state.celebrationText = "Backup exportiert.";
      state.celebrate = true;
      render();
      window.setTimeout(() => {
        state.celebrate = false;
        render();
      }, 1800);
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

  const checkUpdatesButton = document.querySelector("#check-updates-button");
  if (checkUpdatesButton) {
    checkUpdatesButton.addEventListener("click", async () => {
      if (!serviceWorkerRegistration) {
        state.updateState = "error";
        state.updateStatus = "Update-Prüfung auf diesem Gerät nicht verfügbar.";
        render();
        return;
      }

      state.updateState = "checking";
      state.updateStatus = "Suche nach Updates...";
      render();
      try {
        await serviceWorkerRegistration.update();
        window.setTimeout(() => {
          if (!state.updateReady) {
            state.updateState = "ok";
            state.updateStatus = "Keine neue Version gefunden.";
            render();
          }
        }, 1200);
      } catch {
        state.updateState = "error";
        state.updateStatus = "Update-Prüfung fehlgeschlagen.";
        render();
      }
    });
  }

  const reloadAppButton = document.querySelector("#reload-app-button");
  if (reloadAppButton) {
    reloadAppButton.addEventListener("click", () => {
      window.location.reload();
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

  const profileForm = document.querySelector("#profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.profileName = document.querySelector("#profile-name")?.value?.trim() || "Mila";
      state.instrument = document.querySelector("#profile-instrument")?.value || instruments[0];
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

  const shareSummaryButton = document.querySelector("#share-summary");
  if (shareSummaryButton) {
    shareSummaryButton.addEventListener("click", async () => {
      const summary = composeShortSummary();
      try {
        if (navigator.share) {
          await navigator.share({
            title: "FleißTakt Wochenbericht",
            text: summary,
          });
          state.celebrationText = "Wochenbericht geteilt.";
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(summary);
          state.celebrationText = "Wochenbericht in die Zwischenablage kopiert.";
        } else {
          state.celebrationText = "Teilen auf diesem Geraet nicht verfuegbar.";
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
          state.celebrationText = "Zwischenablage ist hier nicht verfuegbar.";
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
      const subject = encodeURIComponent(`FleißTakt Wochenbericht für ${state.profileName}`);
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
  const safeName = state.profileName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "") || "schueler";
  return `fleisstakt-wochenbericht-${safeName}-${createDateStamp()}.${extension}`;
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
    <title>FleißTakt Wochenbericht</title>
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
        <h2>Freigeschaltete Fleiß-Kärtchen</h2>
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
        Dieser Bericht soll Ueben sichtbar machen und positive Gespräche ueber Fortschritt, Regelmaessigkeit und naechste Schritte erleichtern.
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
    state.celebrationText = "Der Bericht konnte nicht in einem neuen Fenster geoeffnet werden.";
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

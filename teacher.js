const TEACHER_STORAGE_KEY = "fleisstakt-teacher-state-v1";
const TEACHER_APP_VERSION_INFO = Object.freeze(globalThis.APP_VERSION_INFO || {
  appVersion: "0.0.0",
  cacheVersion: "v0",
  label: "",
});

const teacherState = {
  classes: [],
  students: [],
  selectedClassId: "all",
  selectedStudentId: "",
  classDraft: "",
  toast: "",
  lastImportSummary: "Noch keine Berichtspakete importiert.",
  installPrompt: null,
  installReady: false,
};

const teacherRoot = document.querySelector("#teacher-root");
hydrateTeacherState();
renderTeacherApp();

function createId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createChecksum(payload) {
  const normalized = JSON.stringify(payload);
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `ft-${(hash >>> 0).toString(16).padStart(8, "0")}`;
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
    selectedClassId: "all",
    selectedStudentId: "",
    classDraft: "",
    toast: "",
    lastImportSummary: "Noch keine Berichtspakete importiert.",
    installPrompt: null,
    installReady: false,
  };
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
  teacherState.toast = "Lehrkraft-App installiert.";
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
    teacherState.selectedClassId = parsed.selectedClassId || "all";
    teacherState.selectedStudentId = parsed.selectedStudentId || "";
    teacherState.lastImportSummary = parsed.lastImportSummary || "Noch keine Berichtspakete importiert.";
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
      selectedClassId: teacherState.selectedClassId,
      selectedStudentId: teacherState.selectedStudentId,
      lastImportSummary: teacherState.lastImportSummary,
    }),
  );
}

function normalizeTeacherStudent(student) {
  return {
    studentId: student.studentId || createId("student"),
    importedDisplayName: student.importedDisplayName || student.profileName || "Unbekannt",
    importedInstrument: student.importedInstrument || student.instrument || "",
    importedGoal: Number(student.importedGoal ?? student.goal) || 0,
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
    reportsReceived: Number(student.reportsReceived) || 0,
    lastImportedAt: student.lastImportedAt || "",
  };
}

function getDisplayName(student) {
  const fullName = `${student.firstName} ${student.lastName}`.trim();
  return fullName || student.importedDisplayName || "Unbekannt";
}

function getClassName(classId) {
  if (!classId) {
    return "Ohne Klasse";
  }

  return teacherState.classes.find((item) => item.id === classId)?.name || "Ohne Klasse";
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
  teacherState.toast = rejected
    ? "Einige Berichtspakete wurden wegen ungültiger Prüfsumme oder Struktur abgelehnt."
    : "Berichtspakete erfolgreich importiert.";
  persistTeacherState();
  renderTeacherApp();
}

function exportTeacherBackupPayload() {
  const payload = {
    kind: "fleisstakt-teacher-backup",
    exportedAt: new Date().toISOString(),
    version: TEACHER_APP_VERSION_INFO.appVersion,
    data: {
      classes: teacherState.classes,
      students: teacherState.students,
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

  teacherState.students = [...studentMap.values()].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"));
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

function computeOverview() {
  const students = filteredStudents();
  const entries = students.flatMap((student) => student.entries);
  const uniqueClasses = new Set(teacherState.students.map((student) => student.classId).filter(Boolean));
  const recentImports = teacherState.students.filter((student) => student.lastImportedAt).length;

  return {
    studentCount: students.length,
    classCount: uniqueClasses.size,
    recentImports,
    totalEntries: entries.length,
    totalMinutes: entries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0),
  };
}

function renderTeacherApp() {
  const overview = computeOverview();
  const students = filteredStudents().sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "de"));
  const activeStudent = students.find((student) => student.studentId === teacherState.selectedStudentId) || students[0] || null;
  const classOptions = teacherState.classes
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map((item) => `<option value="${item.id}" ${activeStudent?.classId === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
    .join("");

  if (!teacherState.selectedStudentId && activeStudent) {
    teacherState.selectedStudentId = activeStudent.studentId;
  }

  teacherRoot.innerHTML = `
    <div class="teacher-shell">
      <header class="teacher-topbar">
        <div>
          <p class="teacher-eyebrow">Lehrkraft-Version</p>
          <h1>FleißTakt Klassenübersicht</h1>
          <p class="teacher-subline">Berichtspakete importieren, Klassen verwalten und Lernstände überblicken.</p>
        </div>
        <div class="teacher-actions">
          <button class="teacher-button" type="button" id="install-teacher-app">
            ${teacherState.installReady ? "Lehrkraft-App installieren" : "Installation prüfen"}
          </button>
          <label class="teacher-button teacher-button-primary" for="report-package-input">Berichtspakete importieren</label>
          <input id="report-package-input" type="file" accept="application/json,.json" multiple hidden />
          <button class="teacher-button" type="button" id="export-teacher-backup">Backup exportieren</button>
          <label class="teacher-button" for="teacher-backup-input">Backup importieren</label>
          <input id="teacher-backup-input" type="file" accept="application/json,.json" hidden />
        </div>
      </header>

      <section class="teacher-overview">
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
          <span>Minuten gesamt</span>
          <strong>${overview.totalMinutes}</strong>
        </article>
      </section>

      <p class="import-summary">${escapeHtml(teacherState.lastImportSummary)}</p>

      <main class="teacher-workspace">
        <aside class="teacher-sidebar">
          <section class="sidebar-panel">
            <div class="sidebar-head">
              <h2>Klassen</h2>
              <button class="teacher-link" type="button" data-class-filter="all">Alle</button>
            </div>
            <div class="class-list">
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
              <button class="teacher-button" type="submit">Klasse anlegen</button>
            </form>
          </section>

          <section class="sidebar-panel">
            <div class="sidebar-head">
              <h2>Lernende</h2>
              <span>${students.length}</span>
            </div>
            <div class="student-list">
              ${students.length
                ? students
                    .map(
                      (student) => `
                        <button class="student-row ${teacherState.selectedStudentId === student.studentId ? "is-active" : ""}" type="button" data-student-id="${student.studentId}">
                          <strong>${escapeHtml(getDisplayName(student))}</strong>
                          <span>${escapeHtml(getClassName(student.classId))}</span>
                          <small>${escapeHtml(student.latestReportLabel || "Noch kein Bericht")}</small>
                        </button>
                      `,
                    )
                    .join("")
                : `<p class="empty-copy">Noch keine Lernenden importiert.</p>`}
            </div>
          </section>
        </aside>

        <section class="teacher-main">
          ${
            activeStudent
              ? `
                <section class="detail-header">
                  <div>
                    <p class="teacher-eyebrow">Ausgewählte lernende Person</p>
                    <h2>${escapeHtml(getDisplayName(activeStudent))}</h2>
                    <p class="teacher-subline">ID ${escapeHtml(activeStudent.studentId)} · ${escapeHtml(activeStudent.importedInstrument || "Kein Instrument")} · Ziel ${activeStudent.importedGoal || 0} Minuten</p>
                  </div>
                  <div class="detail-badges">
                    <span>${escapeHtml(activeStudent.latestReportLabel || "Noch kein Bericht")}</span>
                    <span>${activeStudent.latestReportMinutes} Minuten</span>
                    <span>${activeStudent.latestReportStreak} Tage Serie</span>
                  </div>
                </section>

                <section class="detail-grid">
                  <form class="detail-card" id="student-form">
                    <h3>Stammdaten</h3>
                    <input type="hidden" id="student-id" value="${escapeHtml(activeStudent.studentId)}" />
                    <label>
                      <span>Vorname</span>
                      <input id="student-first-name" type="text" value="${escapeHtml(activeStudent.firstName)}" />
                    </label>
                    <label>
                      <span>Nachname</span>
                      <input id="student-last-name" type="text" value="${escapeHtml(activeStudent.lastName)}" />
                    </label>
                    <label>
                      <span>E-Mail</span>
                      <input id="student-email" type="text" value="${escapeHtml(activeStudent.email)}" />
                    </label>
                    <label>
                      <span>Messenger-ID</span>
                      <input id="student-messenger" type="text" value="${escapeHtml(activeStudent.messengerId)}" />
                    </label>
                    <label>
                      <span>Klasse</span>
                      <select id="student-class-id">
                        <option value="">Ohne Klasse</option>
                        ${classOptions}
                      </select>
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
                    <p class="detail-note">Importe mit ungültiger Prüfsumme werden automatisch abgelehnt. So lassen sich manipulierte Berichtspakete nicht übernehmen.</p>
                  </article>
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
                  <h3>Letzte Einträge</h3>
                  <div class="teacher-entry-list">
                    ${
                      activeStudent.entries.length
                        ? activeStudent.entries
                            .slice(0, 12)
                            .map(
                              (entry) => `
                                <article class="teacher-entry-row">
                                  <div>
                                    <strong>${escapeHtml(new Date(`${entry.date}T12:00:00`).toLocaleDateString("de-DE", {
                                      weekday: "short",
                                      day: "2-digit",
                                      month: "2-digit",
                                    }))}</strong>
                                    <p>${escapeHtml(entry.instrument)} · ${escapeHtml(entry.category)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ""}</p>
                                  </div>
                                  <span>${entry.minutes} Min</span>
                                </article>
                              `,
                            )
                            .join("")
                        : `<p class="empty-copy">Noch keine Einträge vorhanden.</p>`
                    }
                  </div>
                </section>
              `
              : `
                <section class="detail-card">
                  <h2>Noch keine Lernenden ausgewählt</h2>
                  <p class="empty-copy">Importiere ein oder mehrere FleißTakt-Berichtspakete, um die Lehrkraft-Ansicht zu füllen.</p>
                </section>
              `
          }
        </section>
      </main>

      ${teacherState.toast ? `<div class="teacher-toast" role="status">${escapeHtml(teacherState.toast)}</div>` : ""}
    </div>
  `;

  bindTeacherEvents();
}

function bindTeacherEvents() {
  document.querySelector("#install-teacher-app")?.addEventListener("click", async () => {
    if (!teacherState.installPrompt) {
      teacherState.toast = "Die Installation wird auf diesem Gerät gerade nicht angeboten.";
      renderTeacherApp();
      return;
    }

    const prompt = teacherState.installPrompt;
    prompt.prompt();
    try {
      await prompt.userChoice;
    } catch {
      // ignore aborted install
    }
    teacherState.installPrompt = null;
    teacherState.installReady = false;
    renderTeacherApp();
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
      teacherState.toast = "Lehrkraft-Backup importiert.";
      teacherState.lastImportSummary = "Backup erfolgreich übernommen.";
      persistTeacherState();
      renderTeacherApp();
    } catch (error) {
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
      teacherState.selectedStudentId = "";
      persistTeacherState();
      renderTeacherApp();
    });
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
  });

  document.querySelectorAll("[data-student-id]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedStudentId = button.dataset.studentId;
      persistTeacherState();
      renderTeacherApp();
    });
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
            firstName: document.querySelector("#student-first-name")?.value?.trim() || "",
            lastName: document.querySelector("#student-last-name")?.value?.trim() || "",
            email: document.querySelector("#student-email")?.value?.trim() || "",
            messengerId: document.querySelector("#student-messenger")?.value?.trim() || "",
            classId: document.querySelector("#student-class-id")?.value || "",
          })
        : student,
    );

    persistTeacherState();
    teacherState.toast = "Lernende Person aktualisiert.";
    renderTeacherApp();
  });

  if (teacherState.toast) {
    window.setTimeout(() => {
      if (!teacherState.toast) {
        return;
      }
      teacherState.toast = "";
      renderTeacherApp();
    }, 2200);
  }
}

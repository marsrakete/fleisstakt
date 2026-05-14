# Bug-Liste

Stand: 14.05.2026

Die Liste ist auf den aktuellen Projektstand bereinigt. Bereits umgesetzte Punkte stehen unten als erledigt, damit die offenen Baustellen klarer sichtbar bleiben.

## Offen

### 1. Neue Klasse erscheint nach dem Anlegen nicht in der Lehrkräfte-App

- Status: Offen
- Bereich: Klassen / Server-Sync
- Beobachtung:
  Nach dem Anlegen einer Klasse erscheint diese nicht in der Lehrkräfte-App, obwohl sie auf dem Server sichtbar ist.
- Erwartung:
  Eine neu angelegte Klasse sollte nach dem Speichern und spätestens nach dem Server-Sync direkt in der Lehrkräfte-App sichtbar sein.
- Reproduktion:
  1. In der Lehrkräfte-App eine neue Klasse anlegen.
  2. Speichern oder automatisch synchronisieren lassen.
  3. Prüfen, ob die Klasse in der Lehrkräfte-App erscheint.
  4. Gegenprobe im WordPress-Plugin: Dort ist die Klasse bereits sichtbar.
- Offene Fragen:
  - Wird die Klasse lokal nach dem Speichern nicht korrekt in den State übernommen?
  - Wird der Serverstand danach nicht vollständig zurück in die Lehrkräfte-App geladen?
  - Gibt es einen Filter, durch den die Klasse ausgeblendet wird?

### 2. Geänderte Kategorien landen auf dem Server, in der App bleiben aber nur Standard-Kategorien sichtbar

- Status: Offen
- Bereich: Kärtchen / Übekategorien / Server-Sync
- Beobachtung:
  Geänderte Kategorien werden offenbar zum Server synchronisiert, in der Lehrkräfte-App sind danach aber wieder nur die Standard-Kategorien sichtbar.
- Erwartung:
  Kategorien sollten nach dem Speichern und Synchronisieren sowohl auf dem Server als auch in der Lehrkräfte-App konsistent erhalten bleiben.
- Reproduktion:
  1. In der Lehrkräfte-App Kategorien ändern.
  2. Synchronisieren.
  3. App neu laden oder Serverstand erneut abrufen.
  4. Prüfen, ob die geänderten Kategorien weiter sichtbar sind.
- Offene Fragen:
  - Werden Kategorien serverseitig zwar gespeichert, aber beim Rückimport in der App ignoriert?
  - Überschreibt die App serverseitige Kategorien lokal wieder mit Standardwerten?
  - Gehören Kategorien global zum Server, zu einer Lehrkraft oder zu einem Unterricht?

## Erledigt

### 3. QR-Code-Verbindung: keine Kamera und kein Laden eines QR-Bildes möglich

- Status: Erledigt
- Bereich: Kopplung / QR-Code
- Ergebnis:
  Die Lernenden-App unterstützt jetzt QR-Erkennung sowohl über Kamera als auch über das Laden eines QR-Bildes. Dafür wird, falls nötig, `jsQR` als Fallback genutzt.
- Hinweis:
  Der praktische Gerätetest auf iPhone, Android und Desktop bleibt trotzdem sinnvoll, weil Kamera- und Browserverhalten je nach Plattform unterschiedlich sein können.

## Nächste Prüfung

1. Klassen-Anlage mit offenem Netzwerk-Log in der Lehrkräfte-App testen.
2. Kategorien ändern, synchronisieren und den zurückgeladenen Serverstand direkt prüfen.
3. QR-Verbindung in der Lernenden-App auf iPhone, Android und Desktop-Browser noch einmal als echter Gerätetest gegenprüfen.

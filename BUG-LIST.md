# Bug-Liste

Stand: 13.05.2026

## Lehrkräfte-App

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

## Lernenden-App

### 3. QR-Code-Verbindung: keine Kamera und kein Laden eines QR-Bildes möglich

- Status: Offen
- Bereich: Kopplung / QR-Code
- Beobachtung:
  In der Lernenden-App ist weder ein Kamerazugriff für das Scannen eines QR-Codes möglich noch funktioniert das Laden eines QR-Bildes aus der Galerie oder aus Dateien.
- Erwartung:
  Die Lernenden-App sollte eine QR-Verbindung entweder per Kamera oder per Auswahl eines QR-Bildes ermöglichen.
- Reproduktion:
  1. Lernenden-App öffnen.
  2. `Mit Lehrkraft verbinden` wählen.
  3. QR-Code-Scan starten.
  4. Prüfen, ob Kamera geöffnet wird.
  5. Alternativ prüfen, ob ein QR-Bild ausgewählt und verarbeitet werden kann.
- Offene Fragen:
  - Fehlt die Berechtigung für den Kamerazugriff?
  - Greift der QR-Scan in installierter PWA anders als im Browser?
  - Ist der Dateiupload zwar sichtbar, aber nicht korrekt an die QR-Auswertung angebunden?

## Nächste Prüfung

1. Klassen-Anlage mit offenem Netzwerk-Log in der Lehrkräfte-App testen.
2. Kategorien ändern, synchronisieren und den zurückgeladenen Serverstand direkt prüfen.
3. QR-Verbindung in der Lernenden-App getrennt auf iPhone, Android und Desktop-Browser testen.

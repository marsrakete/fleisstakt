# FleißTakt Pilot-Checkliste

Diese Checkliste ist für die erste echte Testphase gedacht.
Ziel ist nicht mehr, neue große Funktionen zu bauen, sondern das bestehende Produkt im Alltag sicher und verständlich zu erproben.

## Ziel des Piloten

- Prüfen, ob Lehrkräfte und Lernende FleißTakt ohne enge Begleitung benutzen können
- Prüfen, ob Kopplung, Synchronisation, Kärtchen und Berichte im Alltag stabil funktionieren
- Letzte fachliche, technische und sprachliche Stolperstellen vor einem breiteren Einsatz finden

## Rahmen klären

- Test-WordPress steht bereit und aktuelles Plugin ist installiert
- Plugin-Backup wurde einmal exportiert
- Lehrkräfte-App ist auf aktuellem Stand
- Lernenden-App ist auf aktuellem Stand
- Testgeräte stehen bereit
- Zuständigkeit ist klar: Wer pflegt Lehrkräfte, Lernende, Profile und Kärtchen?
- Rückmeldungen werden an einer festen Stelle gesammelt

## Test-Set anlegen

- 1 Lehrkraft mit 1 Lernprofil
- 1 Lehrkraft mit mehreren Lernprofilen
- 1 lernende Person mit 2 Profilen
- 1 Klasse mit mehreren Lernenden
- mindestens 3 regelbasierte Kärtchen
- mindestens 2 direkt verliehene Kärtchen mit Notiz

## Onboarding Lehrkräfte prüfen

- Lehrkräfte-App öffnet sauber
- Lehrkräfte-Key und Server-URL sind hinterlegt
- Eine neue lernende Person kann angelegt werden
- Ein neues Lernprofil kann angelegt werden
- `Alles synchronisieren` funktioniert ohne Fehler
- Lernenden-ID und Verbindungscode erscheinen danach
- Kopplungs-QR wird angezeigt
- Lernenden-App-Link kann geteilt werden

## Onboarding Lernende prüfen

- Lernenden-App lässt sich öffnen oder installieren
- Kopplung per QR-Code funktioniert
- Kopplung per Lernenden-ID und Verbindungscode funktioniert
- Nach der Kopplung werden Name, Instrument und Ziel geladen
- Der Sync-Status ist verständlich
- Der Bereich für Kärtchen zeigt einen plausiblen Anfangszustand

## Alltagsszenario prüfen

- Eintrag speichern funktioniert
- Automatischer Hintergrund-Sync nach einem Eintrag funktioniert
- Bericht erscheint in der Lehrkräfte-App
- Fortschritt wird in der Lernenden-App sichtbar
- Regelbasiertes Kärtchen wird bei erfüllter Bedingung freigeschaltet
- Direkt verliehenes Kärtchen erscheint nach dem Sync in der Lernenden-App
- Notiz der Lehrkraft wird gut lesbar angezeigt
- Die Lehrkraft sieht direkte Vergaben beim Lernprofil
- Die Lehrkraft sieht direkte Vergaben beim Kärtchen selbst

## Mehrprofiligkeit prüfen

- Eine lernende Person kann mehrere Lernprofile haben
- Die Lehrkraft sieht die Profile sauber getrennt
- Die Lernenden-App kann zwischen Profilen umschalten
- Eintrag, Bericht und Kärtchen bleiben am richtigen Lernprofil
- Ein direkt verliehenes Kärtchen erscheint nur beim richtigen Lernprofil

## Kärtchen prüfen

- Neue Kärtchen können angelegt werden
- Zielbedingung und Zielwert sind verständlich
- Kategorien-Regeln funktionieren
- `Keine` funktioniert für direkt verliehene Kärtchen ohne automatische Prüfung
- Kärtchen können für alle, für eine Klasse oder für eine Person zugewiesen werden
- Starter-Set mit 20 Kärtchen lässt sich laden
- Kärtchen bleiben nach dem Sync erhalten

## Synchronisation prüfen

- `Alles synchronisieren` in der Lehrkräfte-App funktioniert stabil
- `Nur vom Server laden` funktioniert stabil
- `Mit Server synchronisieren` in der Lernenden-App funktioniert stabil
- Automatischer Sync in beiden Apps funktioniert
- Sync-Status ist verständlich
- Ein Serverfehler wird sichtbar und verständlich gemeldet
- Nach erneutem Sync ist der Zustand wieder sauber

## Fehlerfälle prüfen

- Falscher Verbindungscode
- Keine Internetverbindung
- Server vorübergehend nicht erreichbar
- Doppelte Synchronisation kurz hintereinander
- Veraltete PWA ohne Reload
- Direktes Verleihen vor erfolgreicher Kopplung
- Gerätewechsel bei einer lernenden Person
- Import eines Plugin-Backups auf Testsystem

## Backup und Wiederherstellung prüfen

- Backup aus dem Plugin exportieren
- Backup auf zweitem WordPress importieren
- Lehrkräfte, Lernende, Profile, Kärtchen und Berichte sind danach vorhanden
- Direkte Vergaben sind danach vorhanden
- Kopplungsdaten funktionieren danach weiter

## Sprach- und UX-Prüfung

- Verstehen Lehrkräfte die Begriffe `Lernende`, `Lernprofil`, `Kärtchen`, `direkt verliehen`?
- Verstehen Lernende den Kopplungsablauf?
- Ist klar, wann synchronisiert wurde und wann nicht?
- Sind Zielbedingungen verständlich?
- Sind Fehlermeldungen verständlich?
- Gibt es noch unnötige Doppelwege oder Prototyp-Reste?

## Datenschutz und Betrieb

- HTTPS ist aktiv
- Zugriff auf WordPress-Admin ist sauber geregelt
- Backup-Routine ist geklärt
- Aufbewahrungsfrist für Berichte ist bewusst festgelegt
- Testdaten und Echtdaten werden nicht vermischt

## Pilot-Freigabe

Für die Pilotphase bereit, wenn:

- Onboarding für Lehrkräfte funktioniert
- Onboarding für Lernende funktioniert
- Sync in beiden Apps stabil läuft
- Kärtchen-Freischaltung funktioniert
- Direkte Vergabe funktioniert
- Mehrprofiligkeit funktioniert
- Backup und Wiederherstellung wurden einmal erfolgreich getestet
- Größere Verständnisschwierigkeiten wurden bereinigt

## Rückmeldungen dokumentieren

Bei jedem Testfall festhalten:

- Datum
- Gerät
- Browser oder PWA
- getesteter Ablauf
- Ergebnis
- aufgetretener Fehler
- Screenshot oder kurze Beschreibung
- Einschätzung: Blocker, wichtig, später

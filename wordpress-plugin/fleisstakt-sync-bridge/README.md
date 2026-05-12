# FleißTakt Sync Bridge

Aktuelle Plugin-Version: `0.24.3`

WordPress-Plugin für zentrale FleißTakt-Verwaltung mit:

- Lehrkräften
- Klassen
- Lernenden
- Instrument-Profilen
- Lehrkraft-Zuordnungen
- Kärtchenbibliothek
- direkte Kärtchen-Belohnungen mit Notiz
- signierten Berichtspaketen

Das Plugin ist auf den Server unter [https://schwoabamunzee.marsrakete.de/](https://schwoabamunzee.marsrakete.de/) zugeschnitten und arbeitet als zentrale Sync-Brücke zwischen Lernenden-App und Lehrkräfte-App.

## Sync-Sicherheit

Die beiden kritischen Schreibwege der Lehrkräfte-App laufen jetzt transaktional:

- `teacher-roster`
- `teacher-cards`

Das bedeutet:

- ein vollständiger Snapshot wird komplett übernommen
- oder bei einem Fehler vollständig zurückgerollt
- es bleibt kein halber Zwischenstand aus Stammdaten oder Kärtchen auf dem Server zurück

Berichte von Lernenden bleiben zusätzlich dedupliziert über `report_uuid` und Prüfsumme.

## Installation

1. Ordner `fleisstakt-sync-bridge` als ZIP verpacken.
2. In WordPress unter `Plugins -> Installieren -> Plugin hochladen` hochladen.
3. Aktivieren.
4. Im Menü `FleißTakt Sync` zuerst `Einstellungen` prüfen.
5. Danach Lehrkräfte, Klassen, Lernende, Profile und Zuordnungen anlegen.
6. Für jede Lehrkraft den `API-Key` in der Lehrkräfte-App hinterlegen.
7. Für jedes Profil Lernenden-ID und Verbindungscode in der Lehrkräfte-App anzeigen oder teilen.
8. Unter `Einstellungen` bei Bedarf ein komplettes Plugin-Backup exportieren oder auf einem anderen Server wieder importieren.

## Backup und Serverwechsel

Im Tab `Einstellungen` gibt es jetzt:

- `Backup exportieren`
- `Backup importieren`

Das Backup enthält:

- Einstellungen
- Lehrkräfte
- Klassen
- Lernende
- Profile
- Zuordnungen
- Kärtchen
- direkte Kärtchen-Belohnungen
- Berichte

Der Import ersetzt die aktuellen Plugin-Daten auf dem Zielserver vollständig. Deshalb verlangt das Plugin:

- eine Checkbox als Sicherheitsabfrage
- eine zusätzliche Browser-Bestätigung vor dem Import

Empfohlener Ablauf für einen Serverwechsel:

1. Auf dem alten Server `Backup exportieren`.
2. Plugin auf dem neuen WordPress-Server installieren.
3. Unter `Einstellungen` das Backup importieren.
4. Danach Lehrkräfte- und Lernenden-Apps wieder mit dem neuen Server testen.

## Empfohlene Reihenfolge im Backend

1. Lehrkraft anlegen
2. Klasse anlegen
3. Lernende anlegen
4. Instrument-Profil anlegen
5. Profil einer Lehrkraft zuordnen
6. Lernenden-ID und Verbindungscode in der Lehrkräfte-App abrufen
7. Profil in der Lernenden-App mit diesen Kopplungsdaten verbinden
8. Lehrkräfte-Key in der Lehrkräfte-App eintragen und Serverdaten laden

## REST-Endpunkte und URLs

- Lernenden-App Upload:
  `/wp-json/fleisstakt-sync/v1/report`
- Lernenden-App Sync:
  `/wp-json/fleisstakt-sync/v1/student-sync`
- Lernenden-App Erstkopplung:
  `/wp-json/fleisstakt-sync/v1/connect-profile`
- Lehrkräfte-App Sync:
  `/wp-json/fleisstakt-sync/v1/teacher-sync`
- Lehrkräfte-App Profilpaket:
  `/wp-json/fleisstakt-sync/v1/teacher-profile-package`
- Lehrkräfte-App Stammdaten speichern:
  `/wp-json/fleisstakt-sync/v1/teacher-roster`
- Lehrkräfte-App Kärtchen speichern:
  `/wp-json/fleisstakt-sync/v1/teacher-cards`
- Lehrkräfte-App direkte Kärtchen-Belohnung:
  `/wp-json/fleisstakt-sync/v1/teacher-card-awards`
- Öffentlicher Profilpaket-Link:
  `/wp-json/fleisstakt-sync/v1/profile-package`

Komplette Basis-URL für beide Apps:

- `https://schwoabamunzee.marsrakete.de/wp-json/fleisstakt-sync/v1`

## Header

Lernenden-App:

- `X-FleissTakt-Upload-Token`

Lehrkräfte-App:

- `X-FleissTakt-Teacher-Key`

## Datenhaltung

Das Plugin legt eigene WordPress-Tabellen an für:

- Lehrkräfte
- Klassen
- Lernende
- Instrument-Profile
- Lehrkraft-Zuordnungen
- Kärtchen
- direkte Kärtchen-Belohnungen
- Berichte

Berichte werden nicht als Datei in die Mediathek gelegt, sondern als geprüfte JSON-Datensätze in der Datenbank gespeichert.

## Deduplizierung

Doppelte Uploads werden serverseitig verhindert über:

- `report_uuid`
- Kombination aus `student_profile_id` und `checksum`

Wenn ein Bericht doppelt ankommt, liefert das Plugin `duplicate_ignored` zurück statt einen zweiten Datensatz anzulegen.

## Aufbewahrung

Die Berichte werden standardmäßig `180` Tage aufbewahrt. Die Frist ist im Tab `Einstellungen` anpassbar.

Im Plugin-Tab `Berichte` bedeutet `Gesendet` der Zeitstempel aus der Lernenden-App. `Empfangen` ist der Zeitpunkt, an dem WordPress den Bericht gespeichert hat.

## App-Integration

Lernenden-App:

- manueller Berichtsexport bleibt erhalten
- zusätzlich kann ein Bericht per Knopfdruck online gesendet werden
- zusätzlich kann die App Profil und Lehrkräfte-Kärtchen direkt vom Server synchronisieren
- die Erstkopplung läuft bevorzugt über Lernenden-ID und 4-stelligen Verbindungscode
- Profilpakete bleiben als Fallback erhalten

Lehrkräfte-App:

- manueller Import von Berichtspaketen bleibt erhalten
- Backup-Export und -Import bleiben erhalten
- zusätzlich kann die App Berichte, Klassen und Kärtchen direkt vom Server laden
- zusätzlich kann die App Kärtchen direkt an einzelne Lernprofile verleihen und mit Notiz versehen

## Release-Stand

`0.11.0`

- zentrale Verwaltung für Lehrkräfte, Klassen, Lernende und Instrument-Profile
- signierter Berichtsempfang per REST-API
- Lehrkräfte-Sync für Klassen, Berichte und Kärtchen
- Lehrkräfte-App kann Klassen und persönliche Daten der Lernenden direkt auf den Server speichern
- Lehrkräfte-App kann eigene Kärtchen direkt auf den Server speichern
- Kärtchen können für alle, für eine Klasse oder für eine einzelne Person zugewiesen werden
- WordPress-Admin zeigt und bearbeitet jetzt auch Vorname, Nachname, E-Mail und Messenger-ID der Lernenden
- WordPress-Admin kann Kärtchen jetzt ebenfalls gezielt für alle, für eine Klasse oder für eine einzelne Person zuweisen
- Profilpakete tragen im Dateinamen jetzt auch den Namen der Lernenden
- Lehrkräfte-App kann Profilpakete jetzt direkt vom Server laden, teilen und als QR-Code bereitstellen
- Plugin liefert dafür geschützte Lehrkräfte-Endpunkte und öffentliche Freigabelinks für einzelne Profilpakete
- Lernenden-App kann jetzt Profil und zugewiesene Lehrkräfte-Kärtchen direkt per `student-sync` vom Server nachladen
- Lehrkräfte können Kärtchen jetzt direkt als Belohnung an einzelne Lernprofile verleihen
- direkte Kärtchen-Belohnungen können eine Notiz der Lehrkraft enthalten
- Lernenden-App zeigt direkt verliehene Kärtchen sofort als erreicht an
- Plugin-Backups enthalten jetzt auch direkte Kärtchen-Belohnungen
- jedes Profil hat jetzt zusätzlich einen dauerhaften 4-stelligen Verbindungscode für die Erstkopplung
- Lernenden-App kann sich damit direkt per `connect-profile` an ein Lernprofil anbinden
- Lehrkräfte-App zeigt Lernenden-ID und Verbindungscode direkt an und kann diese Kopplungsdaten teilen
- Profilpakete für die Lernenden-App
- serverseitige Deduplizierung und Aufbewahrungslogik

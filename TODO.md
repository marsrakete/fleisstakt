# TODO

Stand: 14.05.2026

## Lernenden-App

### Kärtchen-Filter in der Lernenden-App

- Drei einfache Filteroptionen für die Chip-Ansicht prüfen:
  - `Alle`
  - `Schon geschafft`
  - `Als Nächstes`
- Ziel:
  Die Kärtchen-Ansicht für Lernende schneller lesbar machen, ohne wieder eine große Kartenwand aufzubauen.

### Freie Zeitwahl für den Übe-Timer

- Der Timer arbeitet aktuell mit vorbereiteten Zeiten im 2-Minuten-Raster.
- Eine freie Zeitwahl als kleines Popup oder Inline-Eingabe fehlt noch.
- Ziel:
  Flexible Dauerwahl ergänzen, ohne die Timer-Karte unnötig kompliziert zu machen.

## Server und Sync

### Server-Backup in der Lehrkräfte-App nur als Status sichtbar machen

- Lernenden-App kann Server-Backups bereits speichern und wiederherstellen.
- In der Lehrkräfte-App wäre als nächster sinnvoller Schritt nur ein Status hilfreich:
  - `Server-Backup vorhanden`
  - `zuletzt gespeichert am ...`
- Ziel:
  Lehrkräften Orientierung geben, ohne die Lehrkräfte-App zu einer zweiten Restore-Oberfläche zu machen.

### WordPress-Hosting für die Apps prüfen

- Idee:
  Lernenden-App und Lehrkräfte-App nicht nur über GitHub Pages, sondern optional direkt aus dem WordPress-Plugin ausliefern.
- Ziel:
  Eine zentrale Bereitstellung über die Schul- oder Studio-Website, ohne normales WordPress-Seiten-Rendering mit Theme, Header oder Footer.
- Technischer Ansatz:
  - Eigene Plugin-Routen für feste App-URLs bereitstellen, zum Beispiel `/fleisstakt/lernende` und `/fleisstakt/lehrkraft`.
  - Statische App-Dateien aus dem Plugin ausliefern, inklusive HTML, CSS, JS und Icons.
  - Keine Shortcode-Seiten für die eigentlichen Apps verwenden, damit WordPress nicht die normale Seitenausgabe rendert.
  - Asset-URLs stabil und versionsfähig halten, zum Beispiel über ein Plugin-Asset-Verzeichnis.
- Offene Fragen:
  - Welche Build- oder Release-Strategie ist am saubersten, wenn App und Plugin gemeinsam versioniert werden?
  - Sollen GitHub Pages und Plugin-Hosting parallel möglich bleiben?
  - Wie sollen Update-Prozesse für App-Dateien im Plugin organisiert werden?
  - Brauchen wir zusätzliche Schutzmechanismen oder Login-Regeln für die Lehrkräfte-App-Route?

## Dokumentation

### Praktische Testhinweise ergänzen

- Für README oder Checklisten noch kurze echte Testpfade ergänzen:
  - Timer mit Mitteilung auf Android
  - Timer auf iPhone oder iPad als Home-Bildschirm-App
  - Gerätewechsel mit lokalem Backup
  - Wiederherstellung aus Server-Backup
- Ziel:
  Die wichtigsten Alltagsfälle reproduzierbar dokumentieren.

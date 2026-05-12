# FleißTakt

FleißTakt ist eine einfache Übe-Begleitung für Musiklernende. Die App hilft dabei, tägliches Üben sichtbar zu machen und mit kleinen Erfolgsmomenten zu verbinden. Dazu kommen eine eigene Lehrkräfte-App und ein WordPress-Plugin als gemeinsame Zentrale.

## Projektinfos

- App für Lernende: [https://marsrakete.github.io/fleisstakt/](https://marsrakete.github.io/fleisstakt/)
- Lehrkräfte-App: [https://marsrakete.github.io/fleisstakt/teacher.html](https://marsrakete.github.io/fleisstakt/teacher.html)
- Repository: [https://github.com/marsrakete/fleisstakt](https://github.com/marsrakete/fleisstakt)
- Kontakt: [millux@marsrakete.de](mailto:millux@marsrakete.de)

## Idee

Musiklernende tragen nach dem Üben kurz ein:

- wie lange sie geübt haben
- an welchem Bereich sie gearbeitet haben
- optional eine kleine Notiz

Dafür bekommen sie Rückmeldung in Form von Fortschritt, Serien und Kärtchen-Zielen. Die App soll nicht kontrollierend wirken, sondern motivieren und das Gespräch über Üben erleichtern.

## Warum WordPress als Zentrale?

FleißTakt nutzt inzwischen ein eigenes WordPress-Plugin als Server-Zentrale. Das hat einen sehr praktischen Grund: WordPress ist weit verbreitet, auf vielen bestehenden Websites schon vorhanden und für viele Musikschulen, Lehrkräfte oder Träger technisch leichter zugänglich als ein komplett eigener Backend-Stack.

Vorteile dieser Entscheidung:

- große Verbreitung und bekannte Hosting-Umgebung
- einfacher Plugin-Upload auf bestehende WordPress-Installationen
- zentrale Datenhaltung für Lehrkräfte, Lernende, Profile, Berichte und Kärtchen
- Web-Administration ohne eigene Server-Oberfläche außerhalb von WordPress
- gute Basis für späteren Ausbau über mehrere Geräte und mehrere Lehrkräfte hinweg

WordPress ist hier also nicht das Produkt selbst, sondern die robuste und niedrigschwellige Infrastruktur darunter.

## Wie die Kommunikation jetzt funktioniert

FleißTakt arbeitet nicht mehr nur mit manuell ausgetauschten Berichtspaketen. Der Alltag läuft jetzt primär über den Server-Sync mit dem WordPress-Plugin.

```mermaid
flowchart LR
    A["Lernenden-App"] -->|Berichte und Profil-Sync| B["WordPress-Plugin"]
    C["Lehrkräfte-App"] -->|Klassen, Lernende, Profile, Kärtchen| B
    B -->|Profil, Ziele, Zuordnungen| A
    B -->|Übersichten und Berichte| C
```

Im laufenden Betrieb bedeutet das:

- Lernende synchronisieren ihre Einträge mit dem Server.
- Die Lernenden-App lädt Profil, Ziel-Kärtchen und Server-Stand wieder nach.
- Lehrkräfte synchronisieren Klassen, Lernende, Profile und Kärtchen mit demselben Server.
- Das WordPress-Plugin ist die gemeinsame Wahrheit für Unterrichtsbeziehungen und Zuweisungen.

Manuelle Exporte bleiben nur noch als Fallback oder für Sonderfälle sinnvoll, nicht mehr als Hauptweg.

## Mandantenfähigkeit

Sobald mehrere Lehrkräfte mit derselben Installation arbeiten, muss klar getrennt bleiben, wer welche Daten sehen und bearbeiten darf. Genau das meint hier Mandantenfähigkeit.

Warum das wichtig ist:

- eine Lehrkraft soll nur die eigenen Unterrichtsbeziehungen sehen
- mehrere Lehrkräfte können denselben WordPress-Server nutzen
- Lernende können mehreren Lehrkräften zugeordnet sein, zum Beispiel für verschiedene Instrumente
- Kärtchen, Berichte und Profile müssen pro Unterrichtskontext sauber getrennt bleiben

Das Plugin kann als Admin-Werkzeug alles sehen und pflegen. Im normalen Lehrkräfte-Alltag sorgt die Mandantenlogik aber dafür, dass die Lehrkräfte-App nur die passenden Daten lädt.

## Profile statt nur eine Person

In FleißTakt ist eine lernende Person nicht automatisch nur ein einziges Profil. Stattdessen trennt das System zwischen Person und Profil.

```mermaid
flowchart LR
    L["Lernende Person<br/>Mila Beispiel"] --> P1["Profil 1<br/>Klavier<br/>Ziel 20 Min"]
    L --> P2["Profil 2<br/>Violine<br/>Ziel 15 Min"]
    L --> P3["Profil 3<br/>Gesang<br/>Ziel 10 Min"]

    P1 --> T1["Lehrkraft A"]
    P2 --> T2["Lehrkraft B"]
    P3 --> T3["Lehrkraft C"]

    P1 --> C1["Klasse Mittwoch"]
    P2 --> C2["Klasse Freitag"]

    P1 --> S1["eigene Berichte<br/>eigene Kärtchen<br/>eigene Feedbacks"]
    P2 --> S2["eigene Berichte<br/>eigene Kärtchen<br/>eigene Feedbacks"]
    P3 --> S3["eigene Berichte<br/>eigene Kärtchen<br/>eigene Feedbacks"]
```

Kurz gesagt:

- Die `lernende Person` ist der Mensch selbst.
- Das `Profil` ist der konkrete Unterrichtskontext.
- Lehrkraft, Klasse, Ziele, Berichte und Feedback hängen am Profil, nicht direkt an der Person.

### Technische Sicht

```mermaid
flowchart TB
    ST["Student<br/>Personenstammdaten"] --> PR1["Profile<br/>Profil A"]
    ST --> PR2["Profile<br/>Profil B"]

    TE1["Teacher"] --> AS1["Assignment"]
    TE2["Teacher"] --> AS2["Assignment"]
    AS1 --> PR1
    AS2 --> PR2

    CL1["Class"] --> PR1
    CL2["Class"] --> PR2

    PR1 --> RE1["Reports"]
    PR1 --> CA1["Card Assignments"]
    PR1 --> FB1["Feedback Ballot"]

    PR2 --> RE2["Reports"]
    PR2 --> CA2["Card Assignments"]
    PR2 --> FB2["Feedback Ballot"]

    FR1["Feedback Round<br/>für Lehrkraft A"] --> FB1
    FR2["Feedback Round<br/>für Lehrkraft B"] --> FB2

    FB1 --> FA1["Feedback Answers<br/>anonym gespeichert"]
    FB2 --> FA2["Feedback Answers<br/>anonym gespeichert"]
```

Diese technische Sicht hilft bei drei wichtigen Regeln:

- `Assignments` verbinden Lehrkraft und Profil.
- `Reports`, `Kärtchen` und `Feedback-Berechtigung` laufen profilbezogen.
- Die eigentlichen `Feedback Answers` werden getrennt von der Personen-Zuordnung gespeichert, damit die Auswertung anonym bleibt.

Eine lernende Person ist der Mensch selbst:

- Vorname
- Nachname
- E-Mail
- Messenger-ID
- optionale externe ID

Ein Profil ist die konkrete Unterrichtsbeziehung:

- Instrument
- Profilbezeichnung
- Tagesziel
- zugeordnete Lehrkraft
- optionale Klasse
- Server-ID und Verbindungscode
- eigene Berichte und eigene Kärtchen-Ziele

Das ist wichtig, weil ein Lernender zum Beispiel gleichzeitig haben kann:

- Klavier bei Lehrkraft A
- Violine bei Lehrkraft B
- Gesang bei Lehrkraft C

Dann sind das drei getrennte Profile mit jeweils eigenem Kontext, eigener Synchronisation und eigenen Zielen.

## Kärtchen und Ziele

FleißTakt kennt weiterhin motivierende Ziel-Kärtchen. Diese können inzwischen nicht nur global existieren, sondern durch Lehrkräfte gezielt gepflegt und zugewiesen werden.

Dabei gilt:

- Kärtchen können in der Lehrkräfte-App erstellt werden
- Kärtchen werden über das WordPress-Plugin zentral gespeichert
- Zuweisungen können für alle, für eine Klasse oder individuell für ein einzelnes Profil gelten
- die Lernenden-App zeigt im verbundenen Modus nur die wirklich zugewiesenen Ziele

So bleibt die Motivation persönlich und passend zum jeweiligen Unterricht.

## Onboarding für Lehrkräfte

Der empfohlene Ablauf für Lehrkräfte ist jetzt:

1. WordPress-Plugin installieren und aktivieren.
2. Lehrkraft im Plugin anlegen oder mit bestehendem Kontext arbeiten.
3. In der Lehrkräfte-App Klassen und Lernende anlegen.
4. Für jede Unterrichtsbeziehung ein eigenes Profil anlegen.
5. Lehrkräfte-App mit dem Server synchronisieren.
6. Für jedes Profil `Lernenden-ID` und `Verbindungscode` anzeigen, kopieren oder teilen.
7. Optional eigene Kärtchen anlegen und passenden Profilen oder Klassen zuweisen.

Wichtig dabei:

- Eine Person kann mehrere Profile haben.
- Die Verteilung an Lernende läuft nicht mehr primär über Berichtspakete, sondern über die Server-Verbindung.
- Die Lehrkräfte-App ist die tägliche Arbeitsoberfläche, das Plugin die zentrale Administration und Datenhaltung.

## Onboarding für Lernende

Für Lernende ist der Einstieg jetzt deutlich einfacher:

1. Lernenden-App öffnen oder als PWA installieren.
2. In den Einstellungen `Mit Lehrkraft verbinden` öffnen.
3. `Lernenden-ID` und `Verbindungscode` eingeben.
4. Profil vom Server laden.
5. Danach normal üben, Einträge speichern und mit dem Server synchronisieren.

Nach dieser ersten Kopplung kennt die App:

- Anzeigename
- Instrument
- Profilbezeichnung
- Tagesziel
- Server-Zuordnung
- zugewiesene Ziel-Kärtchen

Danach genügt im Alltag der normale Server-Sync.

## Was die Lernenden-App im Alltag tut

Lernende:

- tragen Übezeit, Schwerpunkt und optional eine Notiz ein
- sehen Fortschritt, Serie und zugewiesene Ziel-Kärtchen
- synchronisieren ihre Daten mit dem WordPress-Server
- können mehrere Profile auf einem Gerät verwalten und umschalten

Im verbundenen Modus ist das Profil führend. Das bedeutet:

- Instrument und Profilkontext kommen vom Server
- nur zugewiesene Ziele werden angezeigt
- die Synchronisation läuft profilbezogen

## Was die Lehrkräfte-App im Alltag tut

Die Lehrkräfte-App ist die Arbeitsoberfläche für Unterricht und Verwaltung. Dort können Lehrkräfte:

- Klassen pflegen
- Lernende anlegen
- mehrere Profile pro lernender Person verwalten
- Kärtchen-Ziele erstellen
- Kärtchen Klassen oder einzelnen Profilen zuweisen
- Daten mit dem WordPress-Server synchronisieren
- Berichte und letzte Einträge als Gesprächsgrundlage nutzen

Die Lehrkräfte-App ist bewusst als eigene PWA getrennt von der Lernenden-App gedacht.

## Berichtswesen

FleißTakt bietet weiterhin Berichte für Woche, Monat und Gesamtzeitraum. Diese Berichte können in der App angesehen, geteilt, kopiert oder heruntergeladen werden.

Im neuen Zielbild gilt aber:

- Für die tägliche Zusammenarbeit ist der Server-Sync der Hauptweg.
- Manuelle Berichtspakete sind nur noch ein Fallback.
- Die Lehrkräfte-App bekommt ihre Sicht primär über die WordPress-Zentrale.

## Ziel im Unterricht

FleißTakt soll das Gespräch über Üben verbessern:

- weg von reiner Kontrolle
- hin zu sichtbarem Fortschritt
- hin zu mehr Eigenverantwortung der Lernenden
- hin zu kleinen, motivierenden Erfolgserlebnissen

## Ausbaustufen

FleißTakt kann schrittweise wachsen, ohne den einfachen Kern der App zu verlieren.

### Stufe 1: Solider Alltag

- Einträge bearbeiten und löschen
- Kalenderansicht zusätzlich zur Listenansicht
- bessere Routine-Logik für Ferien, Pausentage oder Unterrichtsausfälle
- stabiler Sync zwischen Lernenden-App, Lehrkräfte-App und WordPress

### Stufe 2: Mehr Motivation

- weitere Kärtchen-Ziele mit kleinen Themenwelten
- Sammelalbum mit Reihen, Seltenheit und sichtbarem Fortschritt
- kleine Feiermomente beim Freischalten
- Wochenziele und Monatsziele

### Stufe 3: Mehr Begleitung durch Lehrkräfte

- kommentierbare Rückblicke zu Woche oder Monat
- Fokus-Themen für die nächste Übephase
- Zielvereinbarungen zwischen Lernenden und Lehrkräften
- kurze Notizen für die nächste Unterrichtsstunde

### Stufe 4: Mehr Vernetzung

- mehrere Geräte pro Profil
- feinere Rechte und Rollen
- weitere Mandanten- und Organisationslogik für Musikschulen
- stärkere Einbindung von WordPress als zentrale Unterrichtsplattform

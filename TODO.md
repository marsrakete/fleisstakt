# TODO

## WordPress-Hosting fuer die Apps pruefen

- Idee: Lernenden-App und Lehrkraefte-App nicht nur ueber GitHub Pages, sondern optional direkt aus dem WordPress-Plugin ausliefern.
- Ziel: Eine zentrale Bereitstellung ueber die Schul-/Studio-Website, ohne normales WordPress-Seiten-Rendering mit Theme, Header oder Footer.
- Technischer Ansatz:
  - Eigene Plugin-Routen fuer feste App-URLs bereitstellen, z. B. `/fleisstakt/lernende` und `/fleisstakt/lehrkraft`.
  - Statische App-Dateien aus dem Plugin ausliefern, inklusive HTML, CSS, JS und Icons.
  - Keine Shortcode-Seiten fuer die eigentlichen Apps verwenden, damit WordPress nicht die normale Seitenausgabe rendert.
  - Asset-URLs stabil und versionsfaehig halten, z. B. ueber ein Plugin-Asset-Verzeichnis.
- Offene Fragen:
  - Welche Build-/Release-Strategie ist am saubersten, wenn App und Plugin gemeinsam versioniert werden?
  - Sollen GitHub Pages und Plugin-Hosting parallel moeglich bleiben?
  - Wie sollen Update-Prozesse fuer App-Dateien im Plugin organisiert werden?
  - Brauchen wir zusaetzliche Schutzmechanismen oder Login-Regeln fuer die Lehrkraefte-App-Route?

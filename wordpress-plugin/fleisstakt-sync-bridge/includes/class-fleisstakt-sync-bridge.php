<?php

if (!defined('ABSPATH')) {
  exit;
}

final class FleissTakt_Sync_Bridge {
  private const PLUGIN_VERSION_OPTION = 'fleisstakt_sync_bridge_plugin_version';
  private static ?FleissTakt_Sync_Bridge $instance = null;

  private FleissTakt_Sync_Bridge_Repository $repository;
  private FleissTakt_Sync_Bridge_Admin $admin;
  private FleissTakt_Sync_Bridge_Rest $rest;

  public static function instance(): FleissTakt_Sync_Bridge {
    if (!self::$instance) {
      self::$instance = new self();
    }

    return self::$instance;
  }

  public static function activate(): void {
    $repository = new FleissTakt_Sync_Bridge_Repository();
    $repository->install();
    $repository->ensure_default_settings();
    update_option(self::PLUGIN_VERSION_OPTION, FLEISSTAKT_SYNC_BRIDGE_VERSION);

    if (!wp_next_scheduled('fleisstakt_sync_bridge_cleanup_reports')) {
      wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'fleisstakt_sync_bridge_cleanup_reports');
    }
  }

  public static function deactivate(): void {
    wp_clear_scheduled_hook('fleisstakt_sync_bridge_cleanup_reports');
  }

  private function __construct() {
    $this->repository = new FleissTakt_Sync_Bridge_Repository();
    $this->admin = new FleissTakt_Sync_Bridge_Admin($this->repository);
    $this->rest = new FleissTakt_Sync_Bridge_Rest($this->repository);

    add_action('plugins_loaded', [$this, 'load_textdomain']);
    add_action('init', [$this, 'bootstrap']);
    add_action('admin_menu', [$this->admin, 'register_menu']);
    add_action('admin_init', [$this->admin, 'handle_actions']);
    add_action('rest_api_init', [$this->rest, 'register_routes']);
    add_action('fleisstakt_sync_bridge_cleanup_reports', [$this, 'cleanup_reports']);
    add_shortcode('fleisstakt_app_info', [$this, 'render_public_app_info_shortcode']);
    add_shortcode('fleisstakt_teacher_info', [$this, 'render_public_teacher_info_shortcode']);
    add_shortcode('fleisstakt_parent_info', [$this, 'render_public_parent_info_shortcode']);
  }

  public function load_textdomain(): void {
    load_plugin_textdomain('fleisstakt-sync-bridge', false, dirname(plugin_basename(FLEISSTAKT_SYNC_BRIDGE_FILE)) . '/languages');
  }

  public function bootstrap(): void {
    $stored_version = (string) get_option(self::PLUGIN_VERSION_OPTION, '');
    if ($stored_version !== FLEISSTAKT_SYNC_BRIDGE_VERSION) {
      $this->repository->install();
      $this->repository->ensure_default_settings();
      update_option(self::PLUGIN_VERSION_OPTION, FLEISSTAKT_SYNC_BRIDGE_VERSION);
      return;
    }

    $this->repository->ensure_default_settings();
  }

  public function cleanup_reports(): void {
    $settings = $this->repository->get_settings();
    $retention_days = max(30, (int) ($settings['retention_days'] ?? 180));
    $this->repository->cleanup_old_reports($retention_days);
  }

  public function render_public_app_info_shortcode($atts = []): string {
    $settings = $this->repository->get_settings();
    $app_url = esc_url($settings['learner_app_url'] ?? 'https://marsrakete.github.io/fleisstakt/');
    $site_label = esc_html($settings['site_label'] ?? get_bloginfo('name'));
    $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&format=svg&data=' . rawurlencode($app_url);

    ob_start();
    ?>
    <section class="fleisstakt-public-info" style="max-width:1180px;margin:0 auto;padding:0;color:#1f2a36;font-family:Georgia,'Times New Roman',serif">
      <div style="position:relative;overflow:hidden;border-radius:34px;background:
        radial-gradient(circle at top right, rgba(242,111,61,0.22), transparent 34%),
        radial-gradient(circle at bottom left, rgba(183,212,240,0.38), transparent 30%),
        linear-gradient(180deg, #fff8ef, #f3e7d8);
        border:1px solid rgba(24,34,47,0.08);
        box-shadow:0 24px 44px rgba(31,42,54,0.10)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0;align-items:stretch">
          <div style="display:grid;align-content:start;gap:18px;padding:38px 32px 34px">
            <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#8d644e">FleißTakt für Lernende</p>
            <h2 style="margin:0;font-size:clamp(2.4rem,5vw,4.4rem);line-height:0.94;letter-spacing:-0.03em;max-width:8ch">Einfach starten. Ruhig üben. Verbunden bleiben.</h2>
            <p style="margin:0;max-width:34rem;font-size:1.05rem;line-height:1.65;color:#4c5967">FleißTakt hilft Musiklernenden dabei, Übezeit sichtbar zu machen, kleine Fortschritte festzuhalten und mit der Lehrkraft verbunden zu bleiben, ohne dass die App nach Kontrolle aussieht.</p>
            <div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">
              <a href="<?php echo $app_url; ?>" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border-radius:999px;background:#f26f3d;color:#fff;text-decoration:none;font-weight:700;font-family:Arial,sans-serif">Lernenden-App öffnen</a>
              <span style="display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;border-radius:999px;background:rgba(255,255,255,0.74);border:1px solid rgba(24,34,47,0.08);font:600 0.95rem Arial,sans-serif"><?php echo $site_label; ?></span>
            </div>
            <div style="display:grid;gap:12px;padding-top:8px">
              <div style="display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start">
                <strong style="font:700 0.92rem Arial,sans-serif;color:#f26f3d">1</strong>
                <p style="margin:0;line-height:1.55;color:#42505e"><strong>App öffnen oder installieren.</strong> Am schnellsten per QR-Code oder direkt über den Link.</p>
              </div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start">
                <strong style="font:700 0.92rem Arial,sans-serif;color:#f26f3d">2</strong>
                <p style="margin:0;line-height:1.55;color:#42505e"><strong>Mit der Lehrkraft verbinden.</strong> In der App einfach <em>Mit Lehrkraft verbinden</em> wählen.</p>
              </div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start">
                <strong style="font:700 0.92rem Arial,sans-serif;color:#f26f3d">3</strong>
                <p style="margin:0;line-height:1.55;color:#42505e"><strong>Lernenden-ID und Verbindungscode eingeben</strong> oder direkt den Kopplungs-QR der Lehrkraft scannen.</p>
              </div>
            </div>
          </div>
          <aside style="display:grid;align-content:center;justify-items:center;gap:14px;padding:30px;background:linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.78));border-left:1px solid rgba(24,34,47,0.06)">
            <img src="<?php echo esc_url($qr_url); ?>" alt="QR-Code zur Lernenden-App" style="width:min(300px,100%);height:auto;border-radius:24px;background:#fff;padding:14px;box-shadow:0 14px 28px rgba(31,42,54,0.10)" />
            <p style="margin:0;text-align:center;max-width:22rem;line-height:1.55;color:#4d5a67">QR-Code mit dem Smartphone scannen oder den Link direkt auf dem Gerät öffnen.</p>
            <code style="display:block;max-width:100%;padding:12px 14px;border-radius:18px;background:#f5ede5;color:#5d4638;font:0.88rem Arial,sans-serif;overflow-wrap:anywhere"><?php echo esc_html($app_url); ?></code>
          </aside>
        </div>
      </div>

      <div style="display:grid;gap:18px;padding:24px 8px 0">
        <section style="display:grid;gap:12px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#8d644e;font-family:Arial,sans-serif">Was Lernende erwartet</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">
            <div style="padding:18px 4px 16px;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Kurze Einträge</strong>
              <p style="margin:0;line-height:1.55;color:#4d5a67">Minuten, Schwerpunkt und auf Wunsch eine kleine Notiz reichen völlig aus.</p>
            </div>
            <div style="padding:18px 4px 16px;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Sichtbarer Fortschritt</strong>
              <p style="margin:0;line-height:1.55;color:#4d5a67">Serien, Rückblicke und kleine Ziel-Kärtchen machen Üben greifbarer.</p>
            </div>
            <div style="padding:18px 4px 16px;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Ruhige Begleitung</strong>
              <p style="margin:0;line-height:1.55;color:#4d5a67">FleißTakt will motivieren, nicht kontrollieren. Der Ton bleibt bewusst freundlich und unaufgeregt.</p>
            </div>
          </div>
        </section>

        <section style="display:grid;gap:12px;padding-top:8px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#8d644e;font-family:Arial,sans-serif">Ablauf mit der Lehrkraft</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Vor dem ersten Unterricht</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Die Lehrkraft richtet das passende Profil ein und teilt Lernenden-ID plus Verbindungscode oder direkt den Kopplungs-QR.</p>
            </div>
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Nach der Verbindung</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Name, Profil, Instrument, Tagesziel und passende Kärtchen werden aus dem Profil auf das Gerät übernommen.</p>
            </div>
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Im Alltag</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Lernende üben wie gewohnt, tragen kurz ein und synchronisieren den Stand später mit dem Server.</p>
            </div>
          </div>
        </section>

        <section style="display:grid;gap:12px;padding-top:8px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#8d644e;font-family:Arial,sans-serif">Häufige Fragen</p>
          <div style="display:grid;gap:10px">
            <details style="padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <summary style="cursor:pointer;font:700 1rem Arial,sans-serif">Muss ich sofort ein Konto anlegen?</summary>
              <p style="margin:12px 0 0;line-height:1.6;color:#4d5a67">Nein. Für den Einstieg reicht die Verbindung mit Lernenden-ID und Verbindungscode aus dem Unterrichtskontext.</p>
            </details>
            <details style="padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <summary style="cursor:pointer;font:700 1rem Arial,sans-serif">Kann ich FleißTakt auf mehreren Geräten nutzen?</summary>
              <p style="margin:12px 0 0;line-height:1.6;color:#4d5a67">Für einen Gerätewechsel empfiehlt sich immer zuerst ein Backup oder die erneute Verbindung über die Lehrkraft.</p>
            </details>
            <details style="padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <summary style="cursor:pointer;font:700 1rem Arial,sans-serif">Was mache ich, wenn QR-Code oder Code nicht funktionieren?</summary>
              <p style="margin:12px 0 0;line-height:1.6;color:#4d5a67">Dann kann die Lehrkraft weiterhin ein Profilpaket als Fallback bereitstellen. Der normale Weg bleibt aber QR-Code oder Code-Eingabe.</p>
            </details>
          </div>
        </section>
      </div>
    </section>
    <?php
    return trim((string) ob_get_clean());
  }

  public function render_public_teacher_info_shortcode($atts = []): string {
    $settings = $this->repository->get_settings();
    $app_url = esc_url($settings['learner_app_url'] ?? 'https://marsrakete.github.io/fleisstakt/');
    $site_label = esc_html($settings['site_label'] ?? get_bloginfo('name'));
    $teacher_url = esc_url(trailingslashit($app_url) . 'teacher.html');

    ob_start();
    ?>
    <section class="fleisstakt-teacher-info" style="max-width:1180px;margin:0 auto;padding:0;color:#1f2a36;font-family:Georgia,'Times New Roman',serif">
      <div style="position:relative;overflow:hidden;border-radius:34px;background:
        radial-gradient(circle at top left, rgba(183,212,240,0.30), transparent 34%),
        radial-gradient(circle at bottom right, rgba(242,111,61,0.20), transparent 32%),
        linear-gradient(180deg, #f8fbff, #eee5d8);
        border:1px solid rgba(24,34,47,0.08);
        box-shadow:0 24px 44px rgba(31,42,54,0.10)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0;align-items:stretch">
          <div style="display:grid;align-content:start;gap:18px;padding:38px 32px 34px">
            <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#5b6e85">FleißTakt im Unterricht</p>
            <h2 style="margin:0;font-size:clamp(2.3rem,5vw,4.2rem);line-height:0.96;letter-spacing:-0.03em;max-width:10ch">Drei Bausteine. Ein ruhiger Unterrichtsfluss.</h2>
            <p style="margin:0;max-width:38rem;font-size:1.05rem;line-height:1.65;color:#4c5967">FleißTakt verbindet Lehrkräfte-App, WordPress-Plugin und Lernenden-App so, dass Profile, Ziele, Berichte und Rückmeldungen an einem Ort zusammenlaufen, ohne im Alltag kompliziert zu werden.</p>
            <div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">
              <a href="<?php echo $teacher_url; ?>" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border-radius:999px;background:#1f2a36;color:#fff;text-decoration:none;font-weight:700;font-family:Arial,sans-serif">Lehrkräfte-App öffnen</a>
              <span style="display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;border-radius:999px;background:rgba(255,255,255,0.74);border:1px solid rgba(24,34,47,0.08);font:600 0.95rem Arial,sans-serif"><?php echo $site_label; ?></span>
            </div>
          </div>
          <aside style="display:grid;gap:14px;align-content:center;padding:30px;border-left:1px solid rgba(24,34,47,0.06);background:linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.78))">
            <div style="display:grid;gap:12px">
              <div style="padding:16px 18px;border-radius:24px;background:#fff;border:1px solid rgba(24,34,47,0.08)">
                <strong style="display:block;margin-bottom:6px;font:700 1rem Arial,sans-serif">1. Lehrkräfte-App</strong>
                <p style="margin:0;line-height:1.55;color:#4d5a67">Klassen, Lernende, Profile, Kärtchen und Kopplungsdaten im Alltag pflegen.</p>
              </div>
              <div style="padding:16px 18px;border-radius:24px;background:#fff;border:1px solid rgba(24,34,47,0.08)">
                <strong style="display:block;margin-bottom:6px;font:700 1rem Arial,sans-serif">2. WordPress-Plugin</strong>
                <p style="margin:0;line-height:1.55;color:#4d5a67">Zentrale Datenhaltung für Zuordnungen, Berichte, Feedback und Verwaltung.</p>
              </div>
              <div style="padding:16px 18px;border-radius:24px;background:#fff;border:1px solid rgba(24,34,47,0.08)">
                <strong style="display:block;margin-bottom:6px;font:700 1rem Arial,sans-serif">3. Lernenden-App</strong>
                <p style="margin:0;line-height:1.55;color:#4d5a67">Einträge, Fortschritt, Kärtchen und Kopplung aus Sicht der Lernenden.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div style="display:grid;gap:18px;padding:24px 8px 0">
        <section style="display:grid;gap:12px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#5b6e85;font-family:Arial,sans-serif">Zusammenspiel</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Profile anlegen</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">In der Lehrkräfte-App entstehen pro Unterrichtskontext eigene Profile, zum Beispiel Klavier, Violine oder Gesang.</p>
            </div>
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Mit dem Plugin synchronisieren</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Das Plugin speichert Lehrkräfte, Profile, Klassen, Ziele und Rückmeldungen als gemeinsame Wahrheit.</p>
            </div>
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Lernende koppeln</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Über Lernenden-ID und Verbindungscode oder direkt per QR-Code kommt das richtige Profil aufs Gerät.</p>
            </div>
            <div style="padding:22px;border-radius:26px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <strong style="display:block;margin-bottom:10px;font:700 1.02rem Arial,sans-serif">Im Unterricht nutzen</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Berichte, Kärtchen und Feedback lassen sich später wieder in der Lehrkräfte-App oder im Plugin auswerten.</p>
            </div>
          </div>
        </section>

        <section style="display:grid;gap:12px;padding-top:8px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#5b6e85;font-family:Arial,sans-serif">Typischer Ablauf</p>
          <div style="display:grid;gap:12px">
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#1f2a36">Schritt 1</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Lehrkraft legt in der Lehrkräfte-App die lernende Person und das passende Profil an und synchronisiert beides mit dem Plugin.</p>
            </div>
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#1f2a36">Schritt 2</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Die Lernenden-App wird installiert und über Verbindungscode oder QR mit genau diesem Profil gekoppelt.</p>
            </div>
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#1f2a36">Schritt 3</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Lernende tragen ihr Üben ein, Ziele und Kärtchen werden sichtbar und die Daten laufen beim nächsten Sync wieder zurück.</p>
            </div>
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10);border-bottom:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#1f2a36">Schritt 4</strong>
              <p style="margin:0;line-height:1.6;color:#4d5a67">Lehrkräfte nutzen Berichte, letzte Einträge und anonymes Feedback als Gesprächsgrundlage im Unterricht.</p>
            </div>
          </div>
        </section>

        <section style="display:grid;gap:12px;padding-top:8px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#5b6e85;font-family:Arial,sans-serif">Warum dieses Modell?</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
            <div style="padding:20px 0;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Klare Unterrichtskontexte</strong>
              <p style="margin:0;line-height:1.55;color:#4d5a67">Eine Person kann mehrere Profile haben. Dadurch bleiben Instrumente, Lehrkräfte und Ziele sauber getrennt.</p>
            </div>
            <div style="padding:20px 0;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Weniger Medienbruch</strong>
              <p style="margin:0;line-height:1.55;color:#4d5a67">Nicht alles läuft über Dateien. Alltagssync, Kopplung und Rückmeldungen passieren über denselben Server.</p>
            </div>
            <div style="padding:20px 0;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Ausbaufähig</strong>
              <p style="margin:0;line-height:1.55;color:#4d5a67">Das Plugin kann später weitere Rollen, Rechte, Auswertungen und Organisationslogik aufnehmen, ohne den App-Kern zu verkomplizieren.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
    <?php
    return trim((string) ob_get_clean());
  }

  public function render_public_parent_info_shortcode($atts = []): string {
    $settings = $this->repository->get_settings();
    $app_url = esc_url($settings['learner_app_url'] ?? 'https://marsrakete.github.io/fleisstakt/');
    $site_label = esc_html($settings['site_label'] ?? get_bloginfo('name'));
    $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=280x280&format=svg&data=' . rawurlencode($app_url);

    ob_start();
    ?>
    <section class="fleisstakt-parent-info" style="max-width:1180px;margin:0 auto;padding:0;color:#24313d;font-family:Georgia,'Times New Roman',serif">
      <div style="position:relative;overflow:hidden;border-radius:34px;background:
        radial-gradient(circle at top right, rgba(214,233,223,0.44), transparent 34%),
        radial-gradient(circle at bottom left, rgba(255,231,210,0.48), transparent 30%),
        linear-gradient(180deg, #fbfaf5, #efe6d8);
        border:1px solid rgba(24,34,47,0.08);
        box-shadow:0 24px 44px rgba(31,42,54,0.10)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0;align-items:stretch">
          <div style="display:grid;align-content:start;gap:18px;padding:38px 32px 34px">
            <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#6d7d68">FleißTakt für Eltern</p>
            <h2 style="margin:0;font-size:clamp(2.2rem,5vw,4rem);line-height:0.96;letter-spacing:-0.03em;max-width:11ch">Üben begleiten, ohne Druck aufzubauen.</h2>
            <p style="margin:0;max-width:38rem;font-size:1.05rem;line-height:1.7;color:#52606d">FleißTakt hilft dabei, kleine Übemomente sichtbar zu machen. Die App soll nicht kontrollieren, sondern ein ruhiger Gesprächsanlass zwischen Kind, Elternhaus und Unterricht sein.</p>
            <div style="display:flex;flex-wrap:wrap;gap:12px;padding-top:4px">
              <a href="<?php echo $app_url; ?>" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border-radius:999px;background:#506f59;color:#fff;text-decoration:none;font-weight:700;font-family:Arial,sans-serif">Lernenden-App öffnen</a>
              <span style="display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;border-radius:999px;background:rgba(255,255,255,0.74);border:1px solid rgba(24,34,47,0.08);font:600 0.95rem Arial,sans-serif"><?php echo $site_label; ?></span>
            </div>
          </div>
          <aside style="display:grid;align-content:center;justify-items:center;gap:14px;padding:30px;background:linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.78));border-left:1px solid rgba(24,34,47,0.06)">
            <img src="<?php echo esc_url($qr_url); ?>" alt="QR-Code zur Lernenden-App" style="width:min(300px,100%);height:auto;border-radius:24px;background:#fff;padding:14px;box-shadow:0 14px 28px rgba(31,42,54,0.10)" />
            <p style="margin:0;text-align:center;max-width:22rem;line-height:1.55;color:#52606d">Die App kann direkt geöffnet oder per QR-Code auf dem Smartphone gestartet werden.</p>
            <code style="display:block;max-width:100%;padding:12px 14px;border-radius:18px;background:#f2ede6;color:#5d554d;font:0.88rem Arial,sans-serif;overflow-wrap:anywhere"><?php echo esc_html($app_url); ?></code>
          </aside>
        </div>
      </div>

      <div style="display:grid;gap:18px;padding:24px 8px 0">
        <section style="display:grid;gap:12px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#6d7d68;font-family:Arial,sans-serif">Was FleißTakt im Alltag tut</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
            <div style="padding:20px 0;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Kleine Einträge statt großer Hürden</strong>
              <p style="margin:0;line-height:1.6;color:#52606d">Nach dem Üben reichen oft schon Minuten, Schwerpunkt und eine kurze Notiz.</p>
            </div>
            <div style="padding:20px 0;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Fortschritt wird sichtbarer</strong>
              <p style="margin:0;line-height:1.6;color:#52606d">Serien, Rückblicke und Kärtchen helfen dabei, kleine Schritte wertzuschätzen.</p>
            </div>
            <div style="padding:20px 0;border-top:1px solid rgba(24,34,47,0.12)">
              <strong style="display:block;margin-bottom:8px;font:700 1rem Arial,sans-serif">Gespräche werden leichter</strong>
              <p style="margin:0;line-height:1.6;color:#52606d">Die App kann helfen, über Üben konkreter und entspannter zu sprechen.</p>
            </div>
          </div>
        </section>

        <section style="display:grid;gap:12px;padding-top:8px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#6d7d68;font-family:Arial,sans-serif">So läuft der Einstieg</p>
          <div style="display:grid;gap:12px">
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#24313d">Schritt 1</strong>
              <p style="margin:0;line-height:1.6;color:#52606d">Die Lehrkraft richtet das passende Profil ein und gibt Lernenden-ID plus Verbindungscode oder einen Kopplungs-QR weiter.</p>
            </div>
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#24313d">Schritt 2</strong>
              <p style="margin:0;line-height:1.6;color:#52606d">Die Lernenden-App wird geöffnet und mit genau diesem Unterrichtsprofil verbunden.</p>
            </div>
            <div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;padding:16px 0;border-top:1px solid rgba(24,34,47,0.10);border-bottom:1px solid rgba(24,34,47,0.10)">
              <strong style="font:700 0.95rem Arial,sans-serif;color:#24313d">Schritt 3</strong>
              <p style="margin:0;line-height:1.6;color:#52606d">Danach kann das Kind Übemomente eintragen und bei Bedarf mit dem Server synchronisieren.</p>
            </div>
          </div>
        </section>

        <section style="display:grid;gap:12px;padding-top:8px">
          <p style="margin:0;font-size:0.78rem;letter-spacing:0.16em;text-transform:uppercase;color:#6d7d68;font-family:Arial,sans-serif">Häufige Fragen</p>
          <div style="display:grid;gap:10px">
            <details style="padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <summary style="cursor:pointer;font:700 1rem Arial,sans-serif">Muss jeden Tag geübt werden?</summary>
              <p style="margin:12px 0 0;line-height:1.6;color:#52606d">Nein. FleißTakt soll Üben sichtbar machen, nicht zusätzlichen Druck aufbauen. Auch kleine Einheiten sind wertvoll.</p>
            </details>
            <details style="padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <summary style="cursor:pointer;font:700 1rem Arial,sans-serif">Kann ein Kind mehrere Profile haben?</summary>
              <p style="margin:12px 0 0;line-height:1.6;color:#52606d">Ja. Das ist sinnvoll, wenn verschiedene Instrumente oder unterschiedliche Lehrkräfte im Spiel sind.</p>
            </details>
            <details style="padding:16px 18px;border-radius:22px;background:rgba(255,255,255,0.66);border:1px solid rgba(24,34,47,0.08)">
              <summary style="cursor:pointer;font:700 1rem Arial,sans-serif">Ist das eine Kontroll-App?</summary>
              <p style="margin:12px 0 0;line-height:1.6;color:#52606d">Nein. Die Idee ist eine freundliche Übe-Begleitung mit sichtbaren kleinen Fortschritten und weniger Reibung im Alltag.</p>
            </details>
          </div>
        </section>
      </div>
    </section>
    <?php
    return trim((string) ob_get_clean());
  }
}

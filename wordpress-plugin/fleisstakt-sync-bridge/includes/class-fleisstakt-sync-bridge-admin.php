<?php

if (!defined('ABSPATH')) {
  exit;
}

class FleissTakt_Sync_Bridge_Admin {
  private FleissTakt_Sync_Bridge_Repository $repository;

  public function __construct(FleissTakt_Sync_Bridge_Repository $repository) {
    $this->repository = $repository;
  }

  public function register_menu(): void {
    add_menu_page(
      'FleißTakt Sync Bridge',
      'FleißTakt Sync',
      'manage_options',
      'fleisstakt-sync-bridge',
      [$this, 'render_page'],
      'dashicons-welcome-learn-more',
      58
    );
  }

  public function handle_actions(): void {
    if (!is_admin()) {
      return;
    }

    if (empty($_GET['page']) || $_GET['page'] !== 'fleisstakt-sync-bridge') {
      return;
    }

    if (!current_user_can('manage_options')) {
      return;
    }

    if (!empty($_GET['fleisstakt_download_profile_package'])) {
      check_admin_referer('fleisstakt_download_profile_package');
      $this->download_profile_package((int) $_GET['fleisstakt_download_profile_package']);
    }

    if (!empty($_GET['fleisstakt_export_backup'])) {
      check_admin_referer('fleisstakt_export_backup');
      $this->download_backup();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST['fleisstakt_action'])) {
      return;
    }

    check_admin_referer('fleisstakt_sync_bridge_action', 'fleisstakt_nonce');

    $action = sanitize_key((string) $_POST['fleisstakt_action']);

    switch ($action) {
      case 'save_teacher':
        $id = (int) ($_POST['teacher_id'] ?? 0);
        $payload = [
          'display_name' => sanitize_text_field((string) ($_POST['display_name'] ?? '')),
          'email' => sanitize_email((string) ($_POST['email'] ?? '')),
          'status' => sanitize_text_field((string) ($_POST['status'] ?? 'active')),
          'regenerate_api_key' => !empty($_POST['regenerate_api_key']),
        ];
        if ($id) {
          $this->repository->update_teacher($id, $payload);
        } else {
          $this->repository->create_teacher($payload);
        }
        $this->redirect_with_notice('teacher_saved');
        break;

      case 'delete_teacher':
        $this->repository->delete_teacher((int) ($_POST['teacher_id'] ?? 0));
        $this->redirect_with_notice('teacher_deleted');
        break;

      case 'save_class':
        $id = (int) ($_POST['class_id'] ?? 0);
        $payload = [
          'class_name' => sanitize_text_field((string) ($_POST['class_name'] ?? '')),
          'status' => sanitize_text_field((string) ($_POST['status'] ?? 'active')),
        ];
        if ($id) {
          $this->repository->update_class($id, $payload);
        } else {
          $this->repository->create_class($payload);
        }
        $this->redirect_with_notice('class_saved');
        break;

      case 'delete_class':
        $this->repository->delete_class((int) ($_POST['class_id'] ?? 0));
        $this->redirect_with_notice('class_deleted');
        break;

      case 'save_student':
        $id = (int) ($_POST['student_id'] ?? 0);
        $payload = [
          'external_student_id' => sanitize_text_field((string) ($_POST['external_student_id'] ?? '')),
          'first_name' => sanitize_text_field((string) ($_POST['first_name'] ?? '')),
          'last_name' => sanitize_text_field((string) ($_POST['last_name'] ?? '')),
          'display_name' => sanitize_text_field((string) ($_POST['display_name'] ?? '')),
          'email' => sanitize_email((string) ($_POST['email'] ?? '')),
          'messenger_id' => sanitize_text_field((string) ($_POST['messenger_id'] ?? '')),
          'status' => sanitize_text_field((string) ($_POST['status'] ?? 'active')),
        ];
        if ($id) {
          $this->repository->update_student($id, $payload);
        } else {
          $this->repository->create_student($payload);
        }
        $this->redirect_with_notice('student_saved');
        break;

      case 'delete_student':
        $this->repository->delete_student((int) ($_POST['student_id'] ?? 0));
        $this->redirect_with_notice('student_deleted');
        break;

      case 'save_profile':
        $id = (int) ($_POST['profile_id'] ?? 0);
        $payload = [
          'student_id' => (int) ($_POST['student_id'] ?? 0),
          'class_id' => (int) ($_POST['class_id'] ?? 0),
          'instrument' => sanitize_text_field((string) ($_POST['instrument'] ?? '')),
          'profile_label' => sanitize_text_field((string) ($_POST['profile_label'] ?? '')),
          'goal_minutes' => (int) ($_POST['goal_minutes'] ?? 15),
          'status' => sanitize_text_field((string) ($_POST['status'] ?? 'active')),
          'camera_debug_enabled' => !empty($_POST['camera_debug_enabled']),
          'regenerate_upload_token' => !empty($_POST['regenerate_upload_token']),
        ];
        if ($id) {
          $this->repository->update_profile($id, $payload);
        } else {
          $this->repository->create_profile($payload);
        }
        $this->redirect_with_notice('profile_saved');
        break;

      case 'delete_profile':
        $this->repository->delete_profile((int) ($_POST['profile_id'] ?? 0));
        $this->redirect_with_notice('profile_deleted');
        break;

      case 'save_assignment':
        $this->repository->save_assignment([
          'teacher_id' => (int) ($_POST['teacher_id'] ?? 0),
          'student_profile_id' => (int) ($_POST['student_profile_id'] ?? 0),
          'role_label' => sanitize_text_field((string) ($_POST['role_label'] ?? 'Lehrkraft')),
          'is_primary' => !empty($_POST['is_primary']),
        ]);
        $this->redirect_with_notice('assignment_saved');
        break;

      case 'delete_assignment':
        $this->repository->delete_assignment((int) ($_POST['assignment_id'] ?? 0));
        $this->redirect_with_notice('assignment_deleted');
        break;

      case 'save_card':
        $id = (int) ($_POST['card_id'] ?? 0);
        $assignment_type = sanitize_text_field((string) ($_POST['assignment_type'] ?? 'all'));
        if (!in_array($assignment_type, ['all', 'class', 'student'], true)) {
          $assignment_type = 'all';
        }
        $payload = [
          'teacher_id' => (int) ($_POST['teacher_id'] ?? 0),
          'title' => sanitize_text_field((string) ($_POST['title'] ?? '')),
          'description' => sanitize_text_field((string) ($_POST['description'] ?? '')),
          'rule_type' => sanitize_text_field((string) ($_POST['rule_type'] ?? 'entriesCountAtLeast')),
          'rule_value' => (int) ($_POST['rule_value'] ?? 0),
          'rule_meta' => [
            'category' => sanitize_text_field((string) ($_POST['rule_category'] ?? '')),
          ],
          'assignment_type' => $assignment_type,
          'assignment_target' => $assignment_type === 'all'
            ? ''
            : sanitize_text_field((string) ($_POST['assignment_target'] ?? '')),
          'accent' => sanitize_text_field((string) ($_POST['accent'] ?? 'gold')),
          'symbol' => sanitize_text_field((string) ($_POST['symbol'] ?? '✦')),
          'rarity' => sanitize_text_field((string) ($_POST['rarity'] ?? 'Basis')),
          'status' => sanitize_text_field((string) ($_POST['status'] ?? 'active')),
        ];
        if ($id) {
          $this->repository->update_card($id, $payload);
        } else {
          $this->repository->create_card($payload);
        }
        $this->redirect_with_notice('card_saved');
        break;

      case 'delete_card':
        $this->repository->delete_card((int) ($_POST['card_id'] ?? 0));
        $this->redirect_with_notice('card_deleted');
        break;

      case 'delete_report':
        $this->repository->delete_report((int) ($_POST['report_id'] ?? 0));
        $this->redirect_with_notice('report_deleted');
        break;

      case 'save_feedback_round':
        try {
          $this->repository->create_feedback_round([
            'teacher_id' => (int) ($_POST['teacher_id'] ?? 0),
            'title' => sanitize_text_field((string) ($_POST['title'] ?? '')),
            'min_results_count' => (int) ($_POST['min_results_count'] ?? 5),
            'allow_low_anonymity' => !empty($_POST['allow_low_anonymity']),
            'starts_at' => sanitize_text_field((string) ($_POST['starts_at'] ?? '')),
            'ends_at' => sanitize_text_field((string) ($_POST['ends_at'] ?? '')),
            'status' => sanitize_text_field((string) ($_POST['status'] ?? 'active')),
          ]);
          $this->redirect_with_notice('feedback_round_saved');
        } catch (Throwable $exception) {
          $code = $exception->getMessage();
          $this->redirect_with_notice('feedback_round_failed', ['fleisstakt_error' => $code]);
        }
        break;

      case 'delete_feedback_round':
        $this->repository->delete_feedback_round((int) ($_POST['round_id'] ?? 0));
        $this->redirect_with_notice('feedback_round_deleted');
        break;

      case 'save_settings':
        $this->repository->update_settings([
          'retention_days' => max(30, (int) ($_POST['retention_days'] ?? 180)),
          'site_label' => sanitize_text_field((string) ($_POST['site_label'] ?? get_bloginfo('name'))),
          'sync_base_url' => untrailingslashit(esc_url_raw((string) ($_POST['sync_base_url'] ?? site_url('wp-json/fleisstakt-sync/v1')))),
          'learner_app_url' => esc_url_raw((string) ($_POST['learner_app_url'] ?? 'https://marsrakete.github.io/fleisstakt/')),
          'default_practice_categories' => preg_split('/\r?\n|,/', (string) ($_POST['default_practice_categories'] ?? '')),
        ]);
        $this->redirect_with_notice('settings_saved');
        break;

      case 'import_backup':
        if (empty($_POST['confirm_backup_import'])) {
          $this->redirect_with_notice('backup_import_confirmation_missing');
        }

        if (empty($_FILES['backup_file']['tmp_name']) || !is_uploaded_file((string) $_FILES['backup_file']['tmp_name'])) {
          $this->redirect_with_notice('backup_import_missing_file');
        }

        $raw = file_get_contents((string) $_FILES['backup_file']['tmp_name']);
        $payload = json_decode((string) $raw, true);
        if (!is_array($payload)) {
          $this->redirect_with_notice('backup_import_invalid');
        }

        try {
          $this->repository->import_backup_payload($payload);
        } catch (Throwable $exception) {
          $code = $exception->getMessage();
          if (!in_array($code, ['ungueltige-pruefsumme', 'ungueltiges-backup-format', 'ungueltige-backup-daten'], true)) {
            $code = 'backup-import-fehlgeschlagen';
          }
          $this->redirect_with_notice('backup_import_failed', ['fleisstakt_error' => $code]);
        }

        $this->redirect_with_notice('backup_imported');
        break;
    }
  }

  public function render_page(): void {
    $tab = sanitize_key((string) ($_GET['tab'] ?? 'overview'));

    $teachers = [];
    $classes = [];
    $students = [];
    $profiles = [];
    $assignments = [];
    $cards = [];
    $card_awards = [];
    $reports = [];
    $feedback_overview = [];
    $settings = $this->repository->get_settings();

    switch ($tab) {
      case 'teachers':
        $teachers = $this->repository->list_teachers();
        break;
      case 'classes':
        $classes = $this->repository->list_classes();
        break;
      case 'students':
        $students = $this->repository->list_students();
        break;
      case 'profiles':
        $profiles = $this->repository->list_profiles();
        $students = $this->repository->list_students();
        $classes = $this->repository->list_classes();
        break;
      case 'assignments':
        $assignments = $this->repository->list_assignments();
        $teachers = $this->repository->list_teachers();
        $profiles = $this->repository->list_profiles();
        break;
      case 'cards':
        $cards = $this->repository->list_cards();
        $card_awards = $this->repository->list_card_awards();
        $teachers = $this->repository->list_teachers();
        $classes = $this->repository->list_classes();
        $profiles = $this->repository->list_profiles();
        break;
      case 'reports':
        $students = $this->repository->list_students();
        $profiles = $this->repository->list_profiles();
        $classes = $this->repository->list_classes();
        $reports = $this->repository->list_reports([
          'student_id' => (int) ($_GET['report_student'] ?? 0),
          'profile_id' => (int) ($_GET['report_profile'] ?? 0),
          'class_id' => (int) ($_GET['report_class'] ?? 0),
        ]);
        break;
      case 'feedback':
        $teachers = $this->repository->list_teachers();
        $feedback_overview = $this->repository->get_feedback_admin_overview();
        break;
      case 'overview':
      default:
        $teachers = $this->repository->list_teachers();
        $classes = $this->repository->list_classes();
        $students = $this->repository->list_students();
        $profiles = $this->repository->list_profiles();
        $assignments = $this->repository->list_assignments();
        $cards = $this->repository->list_cards();
        $card_awards = $this->repository->list_card_awards();
        $reports = $this->repository->list_reports();
        $feedback_overview = $this->repository->get_feedback_admin_overview();
        break;
    }

    $active_teachers = array_values(array_filter($teachers, static fn(array $teacher): bool => ($teacher['status'] ?? 'active') === 'active'));

    $edit_teacher = !empty($_GET['edit_teacher']) ? $this->repository->get_teacher((int) $_GET['edit_teacher']) : null;
    $edit_class = !empty($_GET['edit_class']) ? $this->repository->get_class((int) $_GET['edit_class']) : null;
    $edit_student = !empty($_GET['edit_student']) ? $this->repository->get_student((int) $_GET['edit_student']) : null;
    $edit_profile = !empty($_GET['edit_profile']) ? $this->repository->get_profile((int) $_GET['edit_profile']) : null;
    $edit_card = !empty($_GET['edit_card']) ? $this->repository->get_card((int) $_GET['edit_card']) : null;

    $tabs = [
      'overview' => 'Übersicht',
      'teachers' => 'Lehrkräfte',
      'classes' => 'Klassen',
      'students' => 'Lernende',
      'profiles' => 'Unterrichte',
      'assignments' => 'Zuordnungen',
      'cards' => 'Kärtchen',
      'feedback' => 'Feedback',
      'reports' => 'Berichte',
      'settings' => 'Einstellungen',
    ];

    echo '<div class="wrap">';
    echo '<h1>FleißTakt Sync Bridge</h1>';
    echo '<p>Zentrale Verwaltung für Lehrkräfte, Lernende, Unterrichte, Kärtchen und Berichte.</p>';
    $this->render_admin_notice();
    settings_errors('fleisstakt_sync_bridge');
    echo '<nav class="nav-tab-wrapper">';
    foreach ($tabs as $key => $label) {
      $class = $tab === $key ? ' nav-tab-active' : '';
      echo '<a class="nav-tab' . esc_attr($class) . '" href="' . esc_url(admin_url('admin.php?page=fleisstakt-sync-bridge&tab=' . $key)) . '">' . esc_html($label) . '</a>';
    }
    echo '</nav>';

    switch ($tab) {
      case 'teachers':
        $this->render_teachers_tab($teachers, $edit_teacher);
        break;
      case 'classes':
        $this->render_classes_tab($classes, $edit_class);
        break;
      case 'students':
        $this->render_students_tab($students, $edit_student);
        break;
      case 'profiles':
        $this->render_profiles_tab($profiles, $students, $classes, $edit_profile);
        break;
      case 'assignments':
        $this->render_assignments_tab($assignments, $teachers, $profiles);
        break;
      case 'cards':
        $this->render_cards_tab($cards, $card_awards, $teachers, $classes, $profiles, $edit_card);
        break;
      case 'reports':
        $this->render_reports_tab($reports, $students, $profiles, $classes);
        break;
      case 'feedback':
        $this->render_feedback_tab($feedback_overview, $active_teachers);
        break;
      case 'settings':
        $this->render_settings_tab($settings);
        break;
      case 'overview':
      default:
        $this->render_overview_tab($teachers, $classes, $students, $profiles, $assignments, $cards, $card_awards, $reports, $feedback_overview, $settings);
        break;
    }

    echo '</div>';
  }

  private function render_overview_tab(array $teachers, array $classes, array $students, array $profiles, array $assignments, array $cards, array $card_awards, array $reports, array $feedback_overview, array $settings): void {
    echo '<h2>Übersicht</h2>';
    echo '<p>Dieses Plugin ist die zentrale Verwaltungs- und Serverstelle für FleißTakt. Hier werden Lehrkräfte, Lernende, Unterrichte, Kärtchen und Berichte dauerhaft gehalten. Der normale Alltag mit Lernenden, Unterrichten und Kärtchen läuft anschließend in der Lehrkräfte-App.</p>';
    echo '<table class="widefat striped" style="max-width:960px"><tbody>';
    $feedback_round_count = 0;
    foreach ($feedback_overview as $teacher_feedback) {
      $feedback_round_count += count($teacher_feedback['rounds'] ?? []);
    }
    $rows = [
      'Lehrkräfte' => count($teachers),
      'Klassen' => count($classes),
      'Lernende' => count($students),
      'Unterrichte' => count($profiles),
      'Zuordnungen' => count($assignments),
      'Kärtchen' => count($cards),
      'Feedback-Runden' => $feedback_round_count,
      'Berichte' => count($reports),
      'Shortcodes' => '[fleisstakt_app_info], [fleisstakt_teacher_info], [fleisstakt_parent_info]',
      'Sync-URL' => $settings['sync_base_url'] ?? '',
    ];
    foreach ($rows as $label => $value) {
      echo '<tr><th style="width:220px">' . esc_html($label) . '</th><td>' . esc_html((string) $value) . '</td></tr>';
    }
    echo '</tbody></table>';
    echo '<h3>Server und Sync</h3>';
    echo '<table class="widefat striped" style="max-width:960px"><tbody>';
    $sync_rows = [
      'Plugin-Version' => defined('FLEISSTAKT_SYNC_BRIDGE_VERSION') ? FLEISSTAKT_SYNC_BRIDGE_VERSION : '',
      'Server-URL' => $settings['sync_base_url'] ?? '',
      'Lernenden-App' => $settings['learner_app_url'] ?? '',
      'Berichtsaufbewahrung' => (int) ($settings['retention_days'] ?? 180) . ' Tage',
      'Startvorgabe für Übekategorien' => implode(' · ', $settings['default_practice_categories'] ?? []),
      'Direkt verliehene Kärtchen' => count($card_awards),
    ];
    foreach ($sync_rows as $label => $value) {
      echo '<tr><th style="width:220px">' . esc_html($label) . '</th><td>' . esc_html((string) $value) . '</td></tr>';
    }
    echo '</tbody></table>';
    echo '<h3>Onboarding in 4 Schritten</h3>';
    echo '<ol style="max-width:960px;line-height:1.6">';
    echo '<li>Lehrkraft im Plugin anlegen und Serverkontext prüfen.</li>';
    echo '<li>Lehrkräfte-App installieren und dort den Lehrkräfte-Key aus dem Plugin hinterlegen.</li>';
    echo '<li>Lernende, Unterrichte und Kärtchen in der Lehrkräfte-App pflegen und einmal vollständig synchronisieren.</li>';
    echo '<li>Lernende koppeln das Gerät per QR-Code oder mit Lernenden-ID und Verbindungscode.</li>';
    echo '</ol>';
    echo '<p>Profilpakete bleiben nur als Fallback für Ausnahmefälle gedacht.</p>';
    echo '<h3>Zuletzt direkt verliehen</h3>';
    if (!$card_awards) {
      echo '<p>Noch keine direkt verliehenen Kärtchen vorhanden.</p>';
      return;
    }

    echo '<table class="widefat striped" style="max-width:1100px"><thead><tr><th>Kärtchen</th><th>Unterricht</th><th>Lehrkraft</th><th>Notiz</th><th>Verliehen am</th></tr></thead><tbody>';
    foreach (array_slice($card_awards, 0, 5) as $award) {
      $learner_label = trim((string) ($award['student_display_name'] ?? ''));
      $profile_bits = array_filter([
        $award['profile_label'] ?? '',
        $award['instrument'] ?? '',
      ], static fn($value): bool => (string) $value !== '');
      if ($profile_bits) {
        $learner_label .= ' · ' . implode(' · ', $profile_bits);
      }
      echo '<tr>';
      echo '<td>' . esc_html((string) ($award['card_title'] ?? '')) . '</td>';
      echo '<td>' . esc_html($learner_label) . '</td>';
      echo '<td>' . esc_html((string) ($award['teacher_name'] ?? '')) . '</td>';
      echo '<td>' . esc_html($this->format_award_note((string) ($award['note'] ?? ''))) . '</td>';
      echo '<td>' . esc_html($this->format_datetime((string) ($award['awarded_at'] ?? ''))) . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_feedback_tab(array $feedback_overview, array $teachers): void {
    echo '<h2>Feedback</h2>';
    echo '<p>Hier siehst du die anonymen Unterrichts-Rückmeldungen aus dem System. Ergebnisse werden nur angezeigt, wenn genügend Antworten vorliegen.</p>';

    echo '<h3>Neue Feedback-Runde starten</h3>';
    if (!$teachers) {
      echo '<p>Bitte zuerst mindestens eine aktive Lehrkraft anlegen.</p>';
    } else {
      $teacher_options = [];
      foreach ($teachers as $teacher) {
        $teacher_options[(string) $teacher['id']] = $teacher['display_name'];
      }

      $this->render_form_start('save_feedback_round');
      echo '<table class="form-table"><tbody>';
      $this->render_select_row('Lehrkraft', 'teacher_id', $teacher_options, (string) array_key_first($teacher_options));
      $this->render_text_row('Titel', 'title', 'Rückmeldung Sommer 2026');
      $this->render_text_row('Start', 'starts_at', gmdate('Y-m-d 00:00:00'));
      $this->render_text_row('Ende', 'ends_at', gmdate('Y-m-d 23:59:59', strtotime('+30 days')));
      $this->render_number_row('Mindestanzahl für Auswertung', 'min_results_count', 5, 1, 1000);
      echo '<tr><th>Test-Ausnahme</th><td><label><input type="checkbox" name="allow_low_anonymity" value="1" /> Ich weiß, was ich tue. Werte unter 3 sind nur für Tests gedacht und heben den Anonymitätsschutz praktisch auf.</label><p class="description">Ohne diese Bestätigung setzt das Plugin die Mindestanzahl automatisch auf mindestens 3.</p></td></tr>';
      $this->render_select_row('Status', 'status', [
        'active' => 'Aktiv',
        'draft' => 'Entwurf',
        'closed' => 'Beendet',
      ], 'active');
      echo '<tr><th>Fragenset</th><td>Festes 5-Fragen-Set zur Unterrichtsrückmeldung. Eigene Fragen folgen später.</td></tr>';
      echo '</tbody></table>';
      submit_button('Feedback-Runde anlegen');
      echo '</form>';
    }

    if (!$feedback_overview) {
      echo '<p>Noch keine Feedback-Runden vorhanden. Lege hier bei Bedarf die erste Runde pro Lehrkraft manuell an.</p>';
      return;
    }

    foreach ($feedback_overview as $teacher_feedback) {
      echo '<h3>' . esc_html($teacher_feedback['teacherName'] ?? 'Lehrkraft') . '</h3>';
      if (!empty($teacher_feedback['teacherEmail'])) {
        echo '<p><code>' . esc_html((string) $teacher_feedback['teacherEmail']) . '</code></p>';
      }

      foreach (($teacher_feedback['rounds'] ?? []) as $round) {
        echo '<table class="widefat striped" style="margin:12px 0 20px;max-width:1100px"><tbody>';
        $summary_rows = [
          'Runde' => $round['title'] ?? 'Feedbackrunde',
          'Status' => !empty($round['resultsVisible']) ? 'Auswertung sichtbar' : 'Noch gesperrt',
          'Teilnahme' => (int) ($round['responseCount'] ?? 0) . ' von ' . (int) ($round['eligibleCount'] ?? 0),
          'Mindestanzahl' => (int) ($round['minResultsCount'] ?? 5),
          'Gesamtzufriedenheit' => !empty($round['resultsVisible'])
            ? number_format((float) ($round['summary']['overallAverage'] ?? 0), 1, ',', '.')
            : 'Noch verborgen',
          'Zeitraum' => $this->format_feedback_period($round['startsAt'] ?? '', $round['endsAt'] ?? ''),
        ];

        foreach ($summary_rows as $label => $value) {
          echo '<tr><th style="width:220px">' . esc_html($label) . '</th><td>' . esc_html((string) $value) . '</td></tr>';
        }
        echo '<tr><th>Aktionen</th><td>' . $this->delete_inline_form('delete_feedback_round', 'round_id', (int) ($round['roundId'] ?? 0), 'Runde löschen') . '</td></tr>';
        echo '</tbody></table>';

        if (empty($round['resultsVisible'])) {
          echo '<p class="description">Die Fragen-Auswertung erscheint erst, wenn genügend anonyme Rückmeldungen vorliegen.</p>';
          continue;
        }

        echo '<table class="widefat striped" style="max-width:1100px;margin-bottom:28px">';
        echo '<thead><tr><th>Frage</th><th>Durchschnitt</th><th>Antworten</th><th>Verteilung 1-5</th></tr></thead><tbody>';
        foreach (($round['questions'] ?? []) as $question) {
          $distribution = [];
          foreach ([1, 2, 3, 4, 5] as $value) {
            $distribution[] = $value . ': ' . (int) ($question['distribution'][(string) $value] ?? $question['distribution'][$value] ?? 0);
          }

          echo '<tr>';
          echo '<td>' . esc_html((string) ($question['label'] ?? '')) . '</td>';
          echo '<td>' . esc_html(number_format((float) ($question['average'] ?? 0), 1, ',', '.')) . '</td>';
          echo '<td>' . esc_html((string) (int) ($question['count'] ?? 0)) . '</td>';
          echo '<td>' . esc_html(implode(' · ', $distribution)) . '</td>';
          echo '</tr>';
        }
        echo '</tbody></table>';
      }
    }
  }

  private function render_teachers_tab(array $teachers, ?array $edit_teacher): void {
    echo '<h2>Lehrkräfte</h2>';
    $this->render_form_start('save_teacher');
    echo '<input type="hidden" name="teacher_id" value="' . esc_attr((string) ($edit_teacher['id'] ?? 0)) . '" />';
    echo '<table class="form-table"><tbody>';
    $this->render_text_row('Name', 'display_name', $edit_teacher['display_name'] ?? '');
    $this->render_text_row('E-Mail', 'email', $edit_teacher['email'] ?? '');
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_teacher['status'] ?? 'active');
    echo '<tr><th>API-Key neu erzeugen</th><td><label><input type="checkbox" name="regenerate_api_key" value="1" /> Nur setzen, wenn die Lehrkräfte-App einen neuen Schlüssel bekommen soll.</label></td></tr>';
    echo '</tbody></table>';
    submit_button($edit_teacher ? 'Lehrkraft aktualisieren' : 'Lehrkraft anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Lehrkräfte</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Name</th><th>E-Mail</th><th>API-Key</th><th>Status</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($teachers as $teacher) {
      echo '<tr>';
      echo '<td>' . esc_html($teacher['display_name']) . '</td>';
      echo '<td>' . esc_html($teacher['email']) . '</td>';
      echo '<td><code>' . esc_html($teacher['api_key']) . '</code></td>';
      echo '<td>' . esc_html($teacher['status']) . '</td>';
      echo '<td>' . $this->edit_link('teachers', 'edit_teacher', (int) $teacher['id']) . ' ' . $this->delete_inline_form('delete_teacher', 'teacher_id', (int) $teacher['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_classes_tab(array $classes, ?array $edit_class): void {
    echo '<h2>Klassen</h2>';
    echo '<p>Klassen werden im Alltag meist in der Lehrkräfte-App angelegt und dann zum Server synchronisiert. Hier im Plugin siehst du zusätzlich, welche Lehrkräfte, Lernenden und Unterrichte an einer Klasse hängen.</p>';
    $this->render_form_start('save_class');
    echo '<input type="hidden" name="class_id" value="' . esc_attr((string) ($edit_class['id'] ?? 0)) . '" />';
    echo '<table class="form-table"><tbody>';
    $this->render_text_row('Klassenname', 'class_name', $edit_class['class_name'] ?? '');
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_class['status'] ?? 'active');
    echo '</tbody></table>';
    submit_button($edit_class ? 'Klasse aktualisieren' : 'Klasse anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Klassen</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Name</th><th>Lehrkräfte</th><th>Lernende</th><th>Unterrichte</th><th>Status</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($classes as $class) {
      echo '<tr>';
      echo '<td>' . esc_html($class['class_name']) . '</td>';
      echo '<td>' . esc_html((string) (($class['teacher_names'] ?? '') !== '' ? $class['teacher_names'] : 'Noch nicht zugeordnet')) . '</td>';
      echo '<td>' . esc_html((string) (int) ($class['student_count'] ?? 0)) . '</td>';
      echo '<td>' . esc_html((string) (int) ($class['profile_count'] ?? 0)) . '</td>';
      echo '<td>' . esc_html($class['status']) . '</td>';
      echo '<td>' . $this->edit_link('classes', 'edit_class', (int) $class['id']) . ' ' . $this->delete_inline_form('delete_class', 'class_id', (int) $class['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_students_tab(array $students, ?array $edit_student): void {
    echo '<h2>Lernende</h2>';
    echo '<p>Hier werden die Stammdaten der Person gepflegt. Instrument, Tagesziel, Lernenden-ID und Verbindungscode gehören erst zum jeweiligen Profil.</p>';
    $this->render_form_start('save_student');
    echo '<input type="hidden" name="student_id" value="' . esc_attr((string) ($edit_student['id'] ?? 0)) . '" />';
    echo '<table class="form-table"><tbody>';
    $this->render_text_row('Optionale externe ID', 'external_student_id', $edit_student['external_student_id'] ?? '');
    $this->render_text_row('Vorname', 'first_name', $edit_student['first_name'] ?? '');
    $this->render_text_row('Nachname', 'last_name', $edit_student['last_name'] ?? '');
    $this->render_text_row('Anzeigename', 'display_name', $edit_student['display_name'] ?? '');
    $this->render_text_row('E-Mail', 'email', $edit_student['email'] ?? '');
    $this->render_text_row('Messenger-ID', 'messenger_id', $edit_student['messenger_id'] ?? '');
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_student['status'] ?? 'active');
    echo '</tbody></table>';
    submit_button($edit_student ? 'Lernende aktualisieren' : 'Lernende anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Lernende</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Anzeigename</th><th>Vorname</th><th>Nachname</th><th>E-Mail</th><th>Messenger-ID</th><th>Externe ID (optional)</th><th>Status</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($students as $student) {
      echo '<tr>';
      echo '<td>' . esc_html($student['display_name']) . '</td>';
      echo '<td>' . esc_html($student['first_name']) . '</td>';
      echo '<td>' . esc_html($student['last_name']) . '</td>';
      echo '<td>' . esc_html($student['email']) . '</td>';
      echo '<td>' . esc_html($student['messenger_id']) . '</td>';
      echo '<td>' . esc_html($student['external_student_id']) . '</td>';
      echo '<td>' . esc_html($student['status']) . '</td>';
      echo '<td>' . $this->edit_link('students', 'edit_student', (int) $student['id']) . ' ' . $this->delete_inline_form('delete_student', 'student_id', (int) $student['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_profiles_tab(array $profiles, array $students, array $classes, ?array $edit_profile): void {
    echo '<h2>Unterrichte</h2>';
    echo '<p>Ein Unterricht steht für genau einen Lernweg, also zum Beispiel <em>Klavier bei Frau Beispiel</em> oder <em>Violine bei Herrn Beispiel</em>. Lernenden-ID, Verbindungscode und Upload-Token hängen immer an diesem Unterricht. Die zuständige Lehrkraft wird nicht hier im Formular gesetzt, sondern über den Tab <em>Zuordnungen</em> verknüpft.</p>';
    $this->render_form_start('save_profile');
    echo '<input type="hidden" name="profile_id" value="' . esc_attr((string) ($edit_profile['id'] ?? 0)) . '" />';
    echo '<table class="form-table"><tbody>';
    $student_options = [];
    foreach ($students as $student) {
      $student_options[(string) $student['id']] = $student['display_name'];
    }
    $class_options = ['0' => 'Ohne Klasse'];
    foreach ($classes as $class) {
      $class_options[(string) $class['id']] = $class['class_name'];
    }
    $this->render_select_row('Lernende', 'student_id', $student_options, (string) ($edit_profile['student_id'] ?? ''));
    $this->render_select_row('Klasse', 'class_id', $class_options, (string) ($edit_profile['class_id'] ?? '0'));
    $this->render_text_row('Instrument', 'instrument', $edit_profile['instrument'] ?? '');
    $this->render_text_row(
      'Unterrichtsbezeichnung',
      'profile_label',
      $edit_profile['profile_label'] ?? '',
      'Zum Beispiel: Klavier, Violine oder Klavier Mittwoch.'
    );
    $this->render_number_row('Tagesziel in Minuten', 'goal_minutes', (int) ($edit_profile['goal_minutes'] ?? 15), 5, 240);
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_profile['status'] ?? 'active');
    echo '<tr><th>Kamera-Debug</th><td><label><input type="checkbox" name="camera_debug_enabled" value="1"' . checked(!empty($edit_profile['camera_debug_enabled']), true, false) . ' /> Scanner-Debug in der Lernenden-App für diesen Unterricht anzeigen.</label><p class="description">Hilfreich für Kamera- und QR-Probleme. Die Debug-Anzeige erscheint nur bei diesem Unterricht.</p></td></tr>';
    echo '<tr><th>Kopplung dieses Unterrichts zurücksetzen</th><td><label><input type="checkbox" name="regenerate_upload_token" value="1" /> Nur im Ausnahmefall setzen, wenn dieser Unterricht auf Geräten neu gekoppelt werden soll.</label><p class="description">Dabei wird intern ein neuer technischer Schlüssel für die Serverkopplung erzeugt. Danach sollten Lernenden-ID und Verbindungscode erneut über die Lehrkräfte-App weitergegeben werden.</p></td></tr>';
    echo '</tbody></table>';
    submit_button($edit_profile ? 'Unterricht aktualisieren' : 'Unterricht anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Unterrichte</h3>';
    echo '<p>Im Alltag reicht meist die Lernenden-ID plus Verbindungscode aus der Lehrkräfte-App. Das Profilpaket ist der Ausnahmeweg für Sonderfälle oder Geräte, bei denen die direkte Kopplung nicht klappt. Die Spalte <em>Zugeordnete Lehrkräfte</em> kommt aus dem Tab <em>Zuordnungen</em>.</p>';
    echo '<table class="widefat striped"><thead><tr><th>Lernende</th><th>Unterricht</th><th>Klasse</th><th>Zugeordnete Lehrkräfte</th><th>Zuordnungen</th><th>Lernenden-ID</th><th>Upload-Token</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($profiles as $profile) {
      $download_url = wp_nonce_url(
        admin_url('admin.php?page=fleisstakt-sync-bridge&tab=profiles&fleisstakt_download_profile_package=' . (int) $profile['id']),
        'fleisstakt_download_profile_package'
      );
      $assignment_url = admin_url('admin.php?page=fleisstakt-sync-bridge&tab=assignments&student_profile_id=' . (int) $profile['id']);
      echo '<tr>';
      echo '<td>' . esc_html($profile['student_display_name']) . '</td>';
      echo '<td>' . esc_html($profile['profile_label']) . ' · ' . esc_html($profile['instrument']) . '</td>';
      echo '<td>' . esc_html((string) ($profile['class_name'] ?? 'Ohne Klasse')) . '</td>';
      echo '<td>' . esc_html((string) (($profile['teacher_names'] ?? '') !== '' ? $profile['teacher_names'] : 'Noch nicht zugeordnet')) . '</td>';
      echo '<td>' . esc_html((string) (int) ($profile['assignment_count'] ?? 0)) . ' <a class="button button-small" href="' . esc_url($assignment_url) . '">Zuordnungen bearbeiten</a></td>';
      echo '<td><code>' . esc_html($profile['app_student_id']) . '</code></td>';
      echo '<td><code>' . esc_html($profile['upload_token']) . '</code></td>';
      echo '<td>' . $this->edit_link('profiles', 'edit_profile', (int) $profile['id']) . ' <a class="button button-secondary" href="' . esc_url($download_url) . '">Ausnahmeweg: Profilpaket</a> ' . $this->delete_inline_form('delete_profile', 'profile_id', (int) $profile['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_assignments_tab(array $assignments, array $teachers, array $profiles): void {
    echo '<h2>Lehrkraft-Zuordnungen</h2>';
    $this->render_form_start('save_assignment');
    echo '<table class="form-table"><tbody>';
    $teacher_options = [];
    foreach ($teachers as $teacher) {
      $teacher_options[(string) $teacher['id']] = $teacher['display_name'];
    }
    $profile_options = [];
    foreach ($profiles as $profile) {
      $profile_options[(string) $profile['id']] = $profile['student_display_name'] . ' · ' . $profile['profile_label'];
    }
    $preselected_profile_id = sanitize_text_field((string) ($_GET['student_profile_id'] ?? ''));
    $this->render_select_row('Lehrkraft', 'teacher_id', $teacher_options, '');
    $this->render_select_row('Unterricht', 'student_profile_id', $profile_options, $preselected_profile_id);
    $this->render_text_row('Rollenbezeichnung', 'role_label', 'Lehrkraft');
    echo '<tr><th>Primär</th><td><label><input type="checkbox" name="is_primary" value="1" checked /> Primäre Zuständigkeit</label></td></tr>';
    echo '</tbody></table>';
    submit_button('Zuordnung speichern');
    echo '</form>';

    echo '<h3>Vorhandene Zuordnungen</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Lehrkraft</th><th>Unterricht</th><th>Rolle</th><th>Primär</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($assignments as $assignment) {
      echo '<tr>';
      echo '<td>' . esc_html($assignment['teacher_name']) . '</td>';
      echo '<td>' . esc_html($assignment['student_display_name']) . ' · ' . esc_html($assignment['profile_label']) . ' · ' . esc_html($assignment['instrument']) . '</td>';
      echo '<td>' . esc_html($assignment['role_label']) . '</td>';
      echo '<td>' . (!empty($assignment['is_primary']) ? 'Ja' : 'Nein') . '</td>';
      echo '<td>' . $this->delete_inline_form('delete_assignment', 'assignment_id', (int) $assignment['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_cards_tab(array $cards, array $card_awards, array $teachers, array $classes, array $profiles, ?array $edit_card): void {
    echo '<h2>Kärtchenbibliothek</h2>';
    echo '<p>Kärtchen können automatisch über Zielbedingungen freigeschaltet oder später direkt mit persönlicher Notiz verliehen werden. Für Kärtchen ohne automatische Prüfung eignet sich der Regeltyp <strong>Keine</strong>.</p>';
    $settings = $this->repository->get_settings();
    $practice_categories = $settings['default_practice_categories'] ?? FleissTakt_Sync_Bridge_Repository::DEFAULT_PRACTICE_CATEGORIES;
    foreach ($teachers as $teacher) {
      $teacher_categories = preg_split('/\r?\n|,/', (string) ($teacher['practice_categories'] ?? ''));
      foreach ($teacher_categories as $category) {
        $category = sanitize_text_field((string) $category);
        if ($category !== '' && !in_array($category, $practice_categories, true)) {
          $practice_categories[] = $category;
        }
      }
    }
    $edit_rule_meta = json_decode((string) ($edit_card['rule_meta'] ?? ''), true);
    $edit_rule_category = is_array($edit_rule_meta) ? (string) ($edit_rule_meta['category'] ?? '') : '';
    $this->render_form_start('save_card');
    echo '<input type="hidden" name="card_id" value="' . esc_attr((string) ($edit_card['id'] ?? 0)) . '" />';
    echo '<table class="form-table"><tbody>';
    $teacher_options = ['0' => 'Global'];
    foreach ($teachers as $teacher) {
      $teacher_options[(string) $teacher['id']] = $teacher['display_name'];
    }
    $this->render_select_row('Besitzer', 'teacher_id', $teacher_options, (string) ($edit_card['teacher_id'] ?? '0'));
    $this->render_text_row('Titel', 'title', $edit_card['title'] ?? '');
    $this->render_text_row('Beschreibung', 'description', $edit_card['description'] ?? '');
    $this->render_select_row('Regeltyp', 'rule_type', [
      'none' => 'Keine',
      'streakAtLeast' => 'Serie',
      'dayMinutesAtLeast' => 'Tagesminuten',
      'weekMinutesAtLeast' => 'Wochenminuten',
      'monthMinutesAtLeast' => 'Monatsminuten',
      'notedEntriesAtLeast' => 'Einträge mit Notiz',
      'categoryUsed' => 'Kategorie genutzt',
      'categoriesCountAtLeast' => 'Mehrere Kategorien',
      'morningEntryOnce' => 'Morgen-Eintrag',
      'entriesCountAtLeast' => 'Eintragsanzahl',
      'weekEntriesAtLeast' => 'Wochen-Einträge',
      'daysPracticedAtLeast' => 'Übetage',
    ], $edit_card['rule_type'] ?? 'entriesCountAtLeast');
    $this->render_number_row('Zielwert', 'rule_value', (int) ($edit_card['rule_value'] ?? 5), 0, 999);
    $rule_category_options = ['' => 'Nicht nötig'];
    foreach ($practice_categories as $category) {
      $rule_category_options[(string) $category] = (string) $category;
    }
    $this->render_select_row('Regel-Kategorie', 'rule_category', $rule_category_options, $edit_rule_category);
    echo '<tr><th></th><td><p class="description">Bei "Keine" wird das Kärtchen nicht automatisch freigeschaltet. Es eignet sich für direkt verliehene Kärtchen mit persönlicher Notiz.</p></td></tr>';
    echo '<tr><th>Regelhilfe</th><td><p class="description">Zielbedingung beschreibt, <strong>was</strong> geprüft wird. Zielwert beschreibt, <strong>ab welcher Zahl</strong> das Kärtchen freigeschaltet wird. Beispiel: <em>Wochenminuten + 60</em> bedeutet insgesamt 60 Minuten in einer Woche, nicht 60 einzelne Einträge.</p></td></tr>';
    $assignment_type = $edit_card['assignment_type'] ?? 'all';
    if (!in_array($assignment_type, ['all', 'class', 'student'], true)) {
      $assignment_type = 'all';
    }
    $assignment_target = (string) ($edit_card['assignment_target'] ?? '');
    $assignment_type_options = [
      'all' => 'Für alle',
      'class' => 'Für eine Klasse',
      'student' => 'Für eine Person',
    ];
    $this->render_select_row('Zielgruppe', 'assignment_type', $assignment_type_options, $assignment_type);
    $assignment_target_options = ['' => 'Nicht nötig / später auswählen'];
    foreach ($classes as $class) {
      $assignment_target_options[(string) $class['class_uuid']] = 'Klasse · ' . $class['class_name'];
    }
    foreach ($profiles as $profile) {
      $assignment_target_options[(string) $profile['app_student_id']] = 'Person · ' . $profile['student_display_name'] . ' · ' . $profile['profile_label'] . ' · ' . $profile['instrument'];
    }
    $this->render_select_row('Zielobjekt', 'assignment_target', $assignment_target_options, $assignment_target);
    echo '<tr><th></th><td><p class="description">Bei "Für alle" wird dieses Feld ignoriert. Für Klassen nutzt das Plugin die Klassen-ID, für einzelne Personen die App-ID des zugehörigen Unterrichts.</p></td></tr>';
    $this->render_text_row('Farbwelt', 'accent', $edit_card['accent'] ?? 'gold');
    $this->render_text_row('Symbol', 'symbol', $edit_card['symbol'] ?? '✦');
    $this->render_text_row('Seltenheit', 'rarity', $edit_card['rarity'] ?? 'Basis');
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_card['status'] ?? 'active');
    echo '</tbody></table>';
    submit_button($edit_card ? 'Kärtchen aktualisieren' : 'Kärtchen anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Kärtchen</h3>';
    $selected_card_uuid = sanitize_text_field((string) ($_GET['award_card'] ?? ($edit_card['card_uuid'] ?? '')));
    $selected_teacher_id = sanitize_text_field((string) ($_GET['award_teacher'] ?? ''));
    $selected_profile_id = sanitize_text_field((string) ($_GET['award_profile'] ?? ''));
    $class_labels = [];
    foreach ($classes as $class) {
      $class_labels[(string) $class['class_uuid']] = $class['class_name'];
    }
    $profile_labels = [];
    foreach ($profiles as $profile) {
      $profile_labels[(string) $profile['app_student_id']] = $profile['student_display_name'] . ' · ' . $profile['profile_label'] . ' · ' . $profile['instrument'];
    }
    echo '<table class="widefat striped"><thead><tr><th>Titel</th><th>Besitzer</th><th>Regel</th><th>Zielgruppe</th><th>Direkt verliehen</th><th>Status</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($cards as $card) {
      $assignment_label = 'Für alle';
      if (($card['assignment_type'] ?? 'all') === 'class') {
        $assignment_label = 'Klasse: ' . ($class_labels[(string) ($card['assignment_target'] ?? '')] ?? ((string) ($card['assignment_target'] ?? '')));
      } elseif (($card['assignment_type'] ?? 'all') === 'student') {
        $assignment_label = 'Person: ' . ($profile_labels[(string) ($card['assignment_target'] ?? '')] ?? ((string) ($card['assignment_target'] ?? '')));
      }
      echo '<tr>';
      echo '<td>' . esc_html($card['title']) . '</td>';
      echo '<td>' . esc_html($card['teacher_name'] ?: 'Global') . '</td>';
      $rule_meta = json_decode((string) ($card['rule_meta'] ?? ''), true);
      $rule_type = (string) ($card['rule_type'] ?? '');
      $rule_type_labels = [
        'none' => 'Keine Zielbedingung',
        'streakAtLeast' => 'Serie',
        'dayMinutesAtLeast' => 'Tagesminuten',
        'weekMinutesAtLeast' => 'Wochenminuten',
        'monthMinutesAtLeast' => 'Monatsminuten',
        'notedEntriesAtLeast' => 'Einträge mit Notiz',
        'categoryUsed' => 'Kategorie genutzt',
        'categoriesCountAtLeast' => 'Mehrere Kategorien',
        'morningEntryOnce' => 'Morgen-Eintrag',
        'entriesCountAtLeast' => 'Eintragsanzahl',
        'weekEntriesAtLeast' => 'Wochen-Einträge',
        'daysPracticedAtLeast' => 'Übetage',
      ];
      $rule_label = $rule_type_labels[$rule_type] ?? $rule_type;
      if ($rule_type === 'categoryUsed' && !empty($rule_meta['category'])) {
        $rule_label .= ' · ' . sanitize_text_field((string) $rule_meta['category']);
      }
      if ($rule_type !== 'none') {
        $rule_label .= ' · ' . (int) $card['rule_value'];
      }
      echo '<td>' . esc_html($rule_label) . '</td>';
      echo '<td>' . esc_html($assignment_label) . '</td>';
      echo '<td>' . (int) ($card['award_count'] ?? 0) . '</td>';
      echo '<td>' . esc_html($card['status']) . '</td>';
      $award_link = admin_url(
        'admin.php?page=fleisstakt-sync-bridge&tab=cards&edit_card=' . (int) $card['id'] . '&award_card=' . rawurlencode((string) ($card['card_uuid'] ?? ''))
      );
      echo '<td>' . $this->edit_link('cards', 'edit_card', (int) $card['id']) . ' <a class="button button-secondary" href="' . esc_url($award_link) . '">Vergaben</a> ' . $this->delete_inline_form('delete_card', 'card_id', (int) $card['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';

    $filtered_awards = array_values(array_filter($card_awards, function (array $award) use ($selected_card_uuid, $selected_teacher_id, $selected_profile_id): bool {
      if ($selected_card_uuid !== '' && (string) ($award['card_uuid'] ?? '') !== $selected_card_uuid) {
        return false;
      }
      if ($selected_teacher_id !== '' && (string) ($award['teacher_id'] ?? '') !== $selected_teacher_id) {
        return false;
      }
      if ($selected_profile_id !== '' && (string) ($award['app_student_id'] ?? '') !== $selected_profile_id) {
        return false;
      }
      return true;
    }));

    echo '<h3>' . esc_html($selected_card_uuid !== '' ? 'Vergabeverlauf für das ausgewählte Kärtchen' : 'Direkte Vergaben im Überblick') . '</h3>';
    echo '<p>Hier siehst du direkt verliehene Kärtchen mit Unterricht, Lehrkraft, Notiz und Verleihzeit. Über die Filter lässt sich der Verlauf schnell eingrenzen.</p>';
    echo '<form method="get" style="margin:12px 0 16px">';
    echo '<input type="hidden" name="page" value="fleisstakt-sync-bridge" />';
    echo '<input type="hidden" name="tab" value="cards" />';
    if (!empty($edit_card['id'])) {
      echo '<input type="hidden" name="edit_card" value="' . esc_attr((string) $edit_card['id']) . '" />';
    }
    echo '<table class="form-table" style="max-width:960px"><tbody>';
    $award_card_options = ['' => 'Alle Kärtchen'];
    foreach ($cards as $card) {
      $award_card_options[(string) ($card['card_uuid'] ?? '')] = (string) ($card['title'] ?? 'Kärtchen');
    }
    $award_teacher_options = ['' => 'Alle Lehrkräfte'];
    foreach ($teachers as $teacher) {
      $award_teacher_options[(string) $teacher['id']] = (string) $teacher['display_name'];
    }
    $award_profile_options = ['' => 'Alle Unterrichte'];
    foreach ($profiles as $profile) {
      $award_profile_options[(string) $profile['app_student_id']] = $this->build_profile_label($profile);
    }
    $this->render_select_row('Kärtchen', 'award_card', $award_card_options, $selected_card_uuid);
    $this->render_select_row('Lehrkraft', 'award_teacher', $award_teacher_options, $selected_teacher_id);
    $this->render_select_row('Unterricht', 'award_profile', $award_profile_options, $selected_profile_id);
    echo '</tbody></table>';
    submit_button('Filter anwenden', 'secondary', '', false);
    echo ' <a class="button button-secondary" href="' . esc_url(admin_url('admin.php?page=fleisstakt-sync-bridge&tab=cards')) . '">Filter zurücksetzen</a>';
    echo '</form>';

    if (!$card_awards) {
    echo '<p>Noch keine direkt verliehenen Kärtchen vorhanden.</p>';
      return;
    }

    if (!$filtered_awards) {
      echo '<p>Für diese Auswahl gibt es noch keine direkten Vergaben.</p>';
      return;
    }

    echo '<p><strong>' . esc_html((string) count($filtered_awards)) . '</strong> passende direkte Vergaben gefunden.</p>';
    echo '<table class="widefat striped"><thead><tr><th>Kärtchen</th><th>Unterricht</th><th>Lehrkraft</th><th>Notiz</th><th>Verliehen am</th></tr></thead><tbody>';
    foreach (array_slice($filtered_awards, 0, 50) as $award) {
      echo '<tr>';
      echo '<td>' . esc_html((string) ($award['card_title'] ?? '')) . '</td>';
      echo '<td>' . esc_html($this->build_profile_label($award)) . '</td>';
      echo '<td>' . esc_html((string) ($award['teacher_name'] ?? '')) . '</td>';
      echo '<td>' . esc_html($this->format_award_note((string) ($award['note'] ?? ''))) . '</td>';
      echo '<td>' . esc_html($this->format_datetime((string) ($award['awarded_at'] ?? ''))) . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_reports_tab(array $reports, array $students, array $profiles, array $classes): void {
    $selected_student_id = sanitize_text_field((string) ($_GET['report_student'] ?? ''));
    $selected_profile_id = sanitize_text_field((string) ($_GET['report_profile'] ?? ''));
    $selected_class_id = sanitize_text_field((string) ($_GET['report_class'] ?? ''));

    $student_options = ['' => 'Alle Lernenden'];
    foreach ($students as $student) {
      $student_options[(string) $student['id']] = (string) ($student['display_name'] ?? '');
    }

    $profile_options = ['' => 'Alle Unterrichte'];
    foreach ($profiles as $profile) {
      $profile_options[(string) $profile['id']] = $this->build_profile_label($profile);
    }

    $class_options = ['' => 'Alle Klassen'];
    foreach ($classes as $class) {
      $class_options[(string) $class['id']] = (string) ($class['class_name'] ?? '');
    }

    echo '<h2>Berichte</h2>';
    echo '<p><strong>Gesendet</strong> ist der Zeitpunkt aus der Lernenden-App. <strong>Empfangen</strong> zeigt, wann WordPress den Bericht tatsächlich gespeichert hat.</p>';
    echo '<form method="get" style="margin:12px 0 16px 0">';
    echo '<input type="hidden" name="page" value="fleisstakt-sync-bridge" />';
    echo '<input type="hidden" name="tab" value="reports" />';
    echo '<table class="form-table"><tbody><tr>';
    echo '<td style="padding-right:12px;vertical-align:top">';
    echo '<label><strong>Lernende</strong><br />';
    echo '<select name="report_student">';
    foreach ($student_options as $value => $label) {
      echo '<option value="' . esc_attr((string) $value) . '"' . selected($selected_student_id, (string) $value, false) . '>' . esc_html((string) $label) . '</option>';
    }
    echo '</select></label></td>';
    echo '<td style="padding-right:12px;vertical-align:top">';
    echo '<label><strong>Unterricht</strong><br />';
    echo '<select name="report_profile">';
    foreach ($profile_options as $value => $label) {
      echo '<option value="' . esc_attr((string) $value) . '"' . selected($selected_profile_id, (string) $value, false) . '>' . esc_html((string) $label) . '</option>';
    }
    echo '</select></label></td>';
    echo '<td style="padding-right:12px;vertical-align:top">';
    echo '<label><strong>Klasse</strong><br />';
    echo '<select name="report_class">';
    foreach ($class_options as $value => $label) {
      echo '<option value="' . esc_attr((string) $value) . '"' . selected($selected_class_id, (string) $value, false) . '>' . esc_html((string) $label) . '</option>';
    }
    echo '</select></label></td>';
    echo '<td style="vertical-align:bottom">';
    submit_button('Filtern', 'secondary', '', false);
    echo ' <a class="button" href="' . esc_url(admin_url('admin.php?page=fleisstakt-sync-bridge&tab=reports')) . '">Zurücksetzen</a>';
    echo '</td>';
    echo '</tr></tbody></table>';
    echo '</form>';
    echo '<table class="widefat striped"><thead><tr><th>Unterricht</th><th>Zeitraum</th><th>Minuten</th><th>Gesendet</th><th>Empfangen</th><th>Inhalt</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($reports as $report) {
      $content_html = $this->render_report_content_preview((string) ($report['payload_json'] ?? ''));
      echo '<tr>';
      echo '<td>' . esc_html($report['student_display_name']) . ' · ' . esc_html($report['profile_label']) . ' · ' . esc_html($report['instrument']) . '</td>';
      echo '<td>' . esc_html($report['report_label']) . '</td>';
      echo '<td>' . (int) $report['report_minutes'] . '</td>';
      echo '<td>' . esc_html($this->format_datetime((string) ($report['exported_at'] ?? ''))) . '</td>';
      echo '<td>' . esc_html($this->format_datetime((string) ($report['received_at'] ?? ''))) . '</td>';
      echo '<td>' . $content_html . '</td>';
      echo '<td>' . $this->delete_inline_form('delete_report', 'report_id', (int) $report['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_report_content_preview(string $payload_json): string {
    $decoded = json_decode($payload_json, true);
    if (!is_array($decoded)) {
      return '<span>Kein lesbarer Inhalt</span>';
    }

    $report = is_array($decoded['report'] ?? null) ? $decoded['report'] : [];
    $entries = is_array($report['entries'] ?? null) ? $report['entries'] : [];
    $unlocked_cards = is_array($report['unlockedCards'] ?? null) ? $report['unlockedCards'] : [];
    $minutes = (int) ($report['minutes'] ?? 0);
    $streak = (int) ($report['streak'] ?? 0);
    $noted_count = (int) ($report['notedCount'] ?? 0);
    $unique_days = (int) ($report['uniqueDaysCount'] ?? 0);

    ob_start();
    echo '<details style="min-width:280px">';
    echo '<summary>Einträge und Kennzahlen ansehen</summary>';
    echo '<div style="margin-top:8px">';
    echo '<p><strong>Überblick:</strong> ' . esc_html((string) count($entries)) . ' Einträge · ' . esc_html((string) $minutes) . ' Minuten · ' . esc_html((string) $streak) . ' Tage Serie · ' . esc_html((string) $unique_days) . ' Übetage · ' . esc_html((string) $noted_count) . ' Einträge mit Notiz</p>';

    if ($unlocked_cards) {
      $card_titles = array_values(array_filter(array_map(
        static fn($card): string => trim((string) ($card['title'] ?? '')),
        $unlocked_cards
      )));
      if ($card_titles) {
        echo '<p><strong>Freigeschaltete Kärtchen:</strong> ' . esc_html(implode(', ', $card_titles)) . '</p>';
      }
    }

    if ($entries) {
      echo '<table class="widefat striped" style="margin-top:8px"><thead><tr><th>Datum</th><th>Minuten</th><th>Schwerpunkt</th><th>Notiz</th></tr></thead><tbody>';
      foreach ($entries as $entry) {
        echo '<tr>';
        echo '<td>' . esc_html((string) ($entry['date'] ?? '—')) . '</td>';
        echo '<td>' . esc_html((string) ((int) ($entry['minutes'] ?? 0))) . '</td>';
        echo '<td>' . esc_html((string) ($entry['category'] ?? '—')) . '</td>';
        echo '<td>' . esc_html($this->format_award_note((string) ($entry['note'] ?? ''))) . '</td>';
        echo '</tr>';
      }
      echo '</tbody></table>';
    } else {
      echo '<p>Keine Einträge im Bericht enthalten.</p>';
    }

    echo '</div>';
    echo '</details>';
    return (string) ob_get_clean();
  }

  private function render_settings_tab(array $settings): void {
    echo '<h2>Einstellungen</h2>';
    echo '<p>Hier legst du den Serverkontext fest, den beide PWAs verwenden. Änderungen an Basis-URL, Lernenden-App-URL oder an der Startvorgabe für neue Lehrkräfte wirken sich direkt auf Kopplung und Synchronisation aus.</p>';
    $this->render_form_start('save_settings');
    echo '<table class="form-table"><tbody>';
    $this->render_text_row('Seitenlabel', 'site_label', $settings['site_label'] ?? get_bloginfo('name'));
    $this->render_text_row('Sync-Basis-URL', 'sync_base_url', $settings['sync_base_url'] ?? trailingslashit(site_url('wp-json/fleisstakt-sync/v1')));
    $this->render_text_row('URL der Lernenden-App', 'learner_app_url', $settings['learner_app_url'] ?? 'https://marsrakete.github.io/fleisstakt/', 'Diese URL wird für die öffentliche Einstiegsseite und den App-QR verwendet.');
    $this->render_number_row('Berichte aufbewahren (Tage)', 'retention_days', (int) ($settings['retention_days'] ?? 180), 30, 3650);
    echo '<tr><th>Startvorgabe für Übekategorien</th><td><textarea name="default_practice_categories" rows="8" class="large-text">' . esc_textarea(implode("\n", $settings['default_practice_categories'] ?? FleissTakt_Sync_Bridge_Repository::DEFAULT_PRACTICE_CATEGORIES)) . '</textarea><p class="description">Eine Kategorie pro Zeile. Neue Lehrkräfte starten mit dieser Vorgabe und können ihre eigene Liste danach in der Lehrkräfte-App anpassen.</p></td></tr>';
    echo '</tbody></table>';
    submit_button('Einstellungen speichern');
    echo '</form>';

    echo '<hr />';
    echo '<h2>Einfügungen und Shortcodes</h2>';
    echo '<table class="widefat striped" style="max-width:1100px"><thead><tr><th>Shortcode</th><th>Zweck</th><th>Typischer Einsatz</th></tr></thead><tbody>';
    echo '<tr><td><code>[fleisstakt_app_info]</code></td><td>Öffentliche Einstiegsseite für Lernende</td><td>App-QR, Kurz-Erklärung und erste Schritte</td></tr>';
    echo '<tr><td><code>[fleisstakt_teacher_info]</code></td><td>Öffentliche Seite für Lehrkräfte</td><td>Zusammenspiel von Lehrkräfte-App, Plugin und Lernenden-App</td></tr>';
    echo '<tr><td><code>[fleisstakt_parent_info]</code></td><td>Öffentliche Seite für Eltern</td><td>Ruhige Erklärung, wie FleißTakt im Alltag begleitet</td></tr>';
    echo '</tbody></table>';
    echo '<p>Lege in WordPress eine normale Seite an und füge dort einfach den gewünschten Shortcode ein.</p>';
    echo '<p>Für den Alltag reicht meist eine öffentliche Lernenden-Seite mit App-QR und kurzem Kopplungs-Hinweis. Die eigentliche Profilzuordnung erfolgt trotzdem immer im Plugin und in der Lehrkräfte-App.</p>';

    $backup_export_url = wp_nonce_url(
      admin_url('admin.php?page=fleisstakt-sync-bridge&tab=settings&fleisstakt_export_backup=1'),
      'fleisstakt_export_backup'
    );

    echo '<hr />';
    echo '<h2>Backup</h2>';
    echo '<p>Mit diesem Backup lässt sich das komplette Plugin auf einen anderen WordPress-Server umziehen oder nach einem Wechsel wiederherstellen.</p>';
    echo '<p><a class="button button-secondary" href="' . esc_url($backup_export_url) . '">Backup exportieren</a></p>';

    $this->render_form_start('import_backup', true);
    echo '<table class="form-table"><tbody>';
    echo '<tr><th>Backup-Datei</th><td><input type="file" name="backup_file" accept="application/json,.json" required /></td></tr>';
    echo '<tr><th>Sicherheitsabfrage</th><td><label><input type="checkbox" name="confirm_backup_import" value="1" required /> Ich weiß, dass der Import die aktuellen Plugin-Daten auf diesem Server vollständig ersetzt.</label><p class="description">Vor dem Import am besten zuerst ein frisches Backup dieses Servers exportieren.</p></td></tr>';
    echo '</tbody></table>';
    submit_button('Backup importieren', 'delete', 'submit', false, [
      'onclick' => "return window.confirm('Wirklich dieses Backup importieren? Die aktuellen Plugin-Daten auf diesem Server werden dabei vollständig ersetzt.');",
    ]);
    echo '</form>';
  }

  private function format_feedback_period(string $starts_at, string $ends_at): string {
    $start = $starts_at ? strtotime($starts_at) : false;
    $end = $ends_at ? strtotime($ends_at) : false;
    if (!$start && !$end) {
      return 'Offen';
    }
    if ($start && $end) {
      return wp_date('d.m.Y', $start) . ' bis ' . wp_date('d.m.Y', $end);
    }
    if ($start) {
      return 'Ab ' . wp_date('d.m.Y', $start);
    }
    return 'Bis ' . wp_date('d.m.Y', $end);
  }

  private function format_datetime(string $value): string {
    if ($value === '') {
      return '—';
    }

    $timestamp = strtotime($value);
    if (!$timestamp) {
      return $value;
    }

    return wp_date('d.m.Y H:i', $timestamp);
  }

  private function format_award_note(string $note): string {
    $note = trim($note);
    return $note !== '' ? $note : 'Ohne Notiz';
  }

  private function build_profile_label(array $profile_or_award): string {
    $label = trim((string) ($profile_or_award['student_display_name'] ?? ''));
    $parts = array_filter([
      $profile_or_award['profile_label'] ?? '',
      $profile_or_award['instrument'] ?? '',
      $profile_or_award['app_student_id'] ?? '',
    ], static fn($value): bool => (string) $value !== '');
    if ($parts) {
      $label .= ($label !== '' ? ' · ' : '') . implode(' · ', $parts);
    }
    return $label;
  }

  private function render_form_start(string $action, bool $multipart = false): void {
    echo '<form method="post"' . ($multipart ? ' enctype="multipart/form-data"' : '') . '>';
    wp_nonce_field('fleisstakt_sync_bridge_action', 'fleisstakt_nonce');
    echo '<input type="hidden" name="fleisstakt_action" value="' . esc_attr($action) . '" />';
  }

  private function render_text_row(string $label, string $name, string $value, string $help = ''): void {
    echo '<tr><th>' . esc_html($label) . '</th><td>';
    echo '<input class="regular-text" type="text" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" />';
    if ($help !== '') {
      echo '<p class="description">' . esc_html($help) . '</p>';
    }
    echo '</td></tr>';
  }

  private function render_number_row(string $label, string $name, int $value, int $min, int $max): void {
    echo '<tr><th>' . esc_html($label) . '</th><td><input type="number" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '" min="' . esc_attr((string) $min) . '" max="' . esc_attr((string) $max) . '" /></td></tr>';
  }

  private function render_select_row(string $label, string $name, array $options, string $selected): void {
    echo '<tr><th>' . esc_html($label) . '</th><td><select name="' . esc_attr($name) . '">';
    foreach ($options as $value => $label_text) {
      echo '<option value="' . esc_attr((string) $value) . '"' . selected((string) $selected, (string) $value, false) . '>' . esc_html((string) $label_text) . '</option>';
    }
    echo '</select></td></tr>';
  }

  private function edit_link(string $tab, string $param, int $id): string {
    return '<a class="button button-secondary" href="' . esc_url(admin_url('admin.php?page=fleisstakt-sync-bridge&tab=' . $tab . '&' . $param . '=' . $id)) . '">Bearbeiten</a>';
  }

  private function delete_inline_form(string $action, string $field_name, int $id, string $label): string {
    ob_start();
    ?>
    <form method="post" style="display:inline-block;margin-left:4px">
      <?php wp_nonce_field('fleisstakt_sync_bridge_action', 'fleisstakt_nonce'); ?>
      <input type="hidden" name="fleisstakt_action" value="<?php echo esc_attr($action); ?>" />
      <input type="hidden" name="<?php echo esc_attr($field_name); ?>" value="<?php echo esc_attr((string) $id); ?>" />
      <button type="submit" class="button button-link-delete"><?php echo esc_html($label); ?></button>
    </form>
    <?php
    return trim((string) ob_get_clean());
  }

  private function download_profile_package(int $profile_id): void {
    $package = $this->repository->build_profile_package($profile_id);
    if (!$package) {
      wp_die('Profilpaket nicht gefunden.');
    }

    $display_name = sanitize_file_name((string) ($package['displayName'] ?? 'schueler'));
    $app_student_id = sanitize_file_name((string) ($package['appStudentId'] ?? 'profil'));
    $filename = 'fleisstakt-profile-' . ($display_name ?: 'schueler') . '-' . ($app_student_id ?: 'profil') . '.json';

    nocache_headers();
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo wp_json_encode($package, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
  }

  private function download_backup(): void {
    $backup = $this->repository->export_backup_payload();
    $filename = 'fleisstakt-plugin-backup-' . wp_date('Ymd-His') . '.json';

    nocache_headers();
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo wp_json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
  }

  private function redirect_with_notice(string $notice, array $extra_args = []): void {
    $redirect = add_query_arg(
      array_merge([
        'page' => 'fleisstakt-sync-bridge',
        'tab' => sanitize_key((string) ($_GET['tab'] ?? 'overview')),
        'fleisstakt_notice' => $notice,
      ], $extra_args),
      admin_url('admin.php')
    );
    wp_safe_redirect($redirect);
    exit;
  }

  private function render_admin_notice(): void {
    $notice = sanitize_key((string) ($_GET['fleisstakt_notice'] ?? ''));
    if (!$notice) {
      return;
    }

    $messages = [
      'teacher_saved' => ['success', 'Lehrkraft gespeichert.'],
      'teacher_deleted' => ['success', 'Lehrkraft gelöscht.'],
      'class_saved' => ['success', 'Klasse gespeichert.'],
      'class_deleted' => ['success', 'Klasse gelöscht.'],
      'student_saved' => ['success', 'Lernende gespeichert.'],
      'student_deleted' => ['success', 'Lernende gelöscht.'],
      'profile_saved' => ['success', 'Unterricht gespeichert.'],
      'profile_deleted' => ['success', 'Unterricht gelöscht.'],
      'assignment_saved' => ['success', 'Zuordnung gespeichert.'],
      'assignment_deleted' => ['success', 'Zuordnung gelöscht.'],
      'card_saved' => ['success', 'Kärtchen gespeichert.'],
      'card_deleted' => ['success', 'Kärtchen gelöscht.'],
      'feedback_round_saved' => ['success', 'Feedback-Runde angelegt.'],
      'feedback_round_deleted' => ['success', 'Feedback-Runde gelöscht.'],
      'report_deleted' => ['success', 'Bericht gelöscht.'],
      'settings_saved' => ['success', 'Einstellungen gespeichert.'],
      'backup_imported' => ['success', 'Backup importiert. Die Plugin-Daten wurden vollständig wiederhergestellt.'],
      'backup_import_confirmation_missing' => ['error', 'Bitte die Sicherheitsabfrage für den Backup-Import bestätigen.'],
      'backup_import_missing_file' => ['error', 'Bitte zuerst eine Backup-Datei auswählen.'],
      'backup_import_invalid' => ['error', 'Die Backup-Datei ist unvollständig oder nicht lesbar.'],
    ];

    if ($notice === 'backup_import_failed') {
      $error_code = sanitize_key((string) ($_GET['fleisstakt_error'] ?? ''));
      $message = 'Der Backup-Import ist fehlgeschlagen.';
      if ($error_code === 'ungueltige-pruefsumme') {
        $message = 'Die Backup-Datei wurde abgelehnt, weil die Prüfsumme nicht stimmt.';
      } elseif ($error_code === 'ungueltiges-backup-format') {
        $message = 'Die Datei ist kein gültiges FleißTakt-Plugin-Backup.';
      } elseif ($error_code === 'ungueltige-backup-daten') {
        $message = 'Die Backup-Datei enthält nicht alle erforderlichen Daten.';
      }
      $messages[$notice] = ['error', $message];
    }

    if ($notice === 'feedback_round_failed') {
      $error_code = sanitize_key((string) ($_GET['fleisstakt_error'] ?? ''));
      $message = 'Die Feedback-Runde konnte nicht angelegt werden.';
      if ($error_code === 'ungueltige-lehrkraft') {
        $message = 'Bitte eine gültige aktive Lehrkraft auswählen.';
      } elseif ($error_code === 'feedback-titel-fehlt') {
        $message = 'Bitte einen Titel für die Feedback-Runde angeben.';
      } elseif ($error_code === 'feedback-zeitraum-ungueltig') {
        $message = 'Das Enddatum muss nach dem Startdatum liegen.';
      } elseif ($error_code === 'feedback-minimalwert-bestaetigung-fehlt') {
        $message = 'Für Mindestanzahlen unter 3 bitte ausdrücklich "Ich weiß, was ich tue" bestätigen.';
      }
      $messages[$notice] = ['error', $message];
    }

    if (empty($messages[$notice])) {
      return;
    }

    [$type, $message] = $messages[$notice];
    echo '<div class="notice notice-' . esc_attr($type) . ' is-dismissible"><p>' . esc_html($message) . '</p></div>';
  }
}

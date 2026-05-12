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
          'practice_categories' => preg_split('/\r?\n|,/', (string) ($_POST['practice_categories'] ?? '')),
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
        $teachers = $this->repository->list_teachers();
        $classes = $this->repository->list_classes();
        $profiles = $this->repository->list_profiles();
        break;
      case 'reports':
        $reports = $this->repository->list_reports();
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
      'profiles' => 'Profile',
      'assignments' => 'Zuordnungen',
      'cards' => 'Kärtchen',
      'feedback' => 'Feedback',
      'reports' => 'Berichte',
      'settings' => 'Einstellungen',
    ];

    echo '<div class="wrap">';
    echo '<h1>FleißTakt Sync Bridge</h1>';
    echo '<p>Zentrale Verwaltung für Lehrkräfte, Lernende, Instrument-Profile, Kärtchen und Berichte.</p>';
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
        $this->render_cards_tab($cards, $teachers, $classes, $profiles, $edit_card);
        break;
      case 'reports':
        $this->render_reports_tab($reports);
        break;
      case 'feedback':
        $this->render_feedback_tab($feedback_overview, $active_teachers);
        break;
      case 'settings':
        $this->render_settings_tab($settings);
        break;
      case 'overview':
      default:
        $this->render_overview_tab($teachers, $classes, $students, $profiles, $assignments, $cards, $reports, $feedback_overview, $settings);
        break;
    }

    echo '</div>';
  }

  private function render_overview_tab(array $teachers, array $classes, array $students, array $profiles, array $assignments, array $cards, array $reports, array $feedback_overview, array $settings): void {
    echo '<h2>Übersicht</h2>';
    echo '<table class="widefat striped" style="max-width:960px"><tbody>';
    $feedback_round_count = 0;
    foreach ($feedback_overview as $teacher_feedback) {
      $feedback_round_count += count($teacher_feedback['rounds'] ?? []);
    }
    $rows = [
      'Lehrkräfte' => count($teachers),
      'Klassen' => count($classes),
      'Lernende' => count($students),
      'Profile' => count($profiles),
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
    echo '<p>Profilpakete werden pro Instrument-Profil erzeugt. Die Lernenden-App importiert dieses Paket einmal und kann danach Berichte online senden.</p>';
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
    $this->render_form_start('save_class');
    echo '<input type="hidden" name="class_id" value="' . esc_attr((string) ($edit_class['id'] ?? 0)) . '" />';
    echo '<table class="form-table"><tbody>';
    $this->render_text_row('Klassenname', 'class_name', $edit_class['class_name'] ?? '');
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_class['status'] ?? 'active');
    echo '</tbody></table>';
    submit_button($edit_class ? 'Klasse aktualisieren' : 'Klasse anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Klassen</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Name</th><th>Status</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($classes as $class) {
      echo '<tr>';
      echo '<td>' . esc_html($class['class_name']) . '</td>';
      echo '<td>' . esc_html($class['status']) . '</td>';
      echo '<td>' . $this->edit_link('classes', 'edit_class', (int) $class['id']) . ' ' . $this->delete_inline_form('delete_class', 'class_id', (int) $class['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_students_tab(array $students, ?array $edit_student): void {
    echo '<h2>Lernende</h2>';
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
    echo '<h2>Instrument-Profile</h2>';
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
      'Profilbezeichnung',
      'profile_label',
      $edit_profile['profile_label'] ?? '',
      'Zum Beispiel: Klavier, Violine oder Klavier Mittwoch.'
    );
    $this->render_number_row('Tagesziel in Minuten', 'goal_minutes', (int) ($edit_profile['goal_minutes'] ?? 15), 5, 240);
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_profile['status'] ?? 'active');
    echo '<tr><th>Upload-Token neu erzeugen</th><td><label><input type="checkbox" name="regenerate_upload_token" value="1" /> Nur setzen, wenn das Profilpaket neu ausgegeben werden soll.</label></td></tr>';
    echo '</tbody></table>';
    submit_button($edit_profile ? 'Profil aktualisieren' : 'Profil anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Profile</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Lernende</th><th>Profil</th><th>App-ID</th><th>Upload-Token</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($profiles as $profile) {
      $download_url = wp_nonce_url(
        admin_url('admin.php?page=fleisstakt-sync-bridge&tab=profiles&fleisstakt_download_profile_package=' . (int) $profile['id']),
        'fleisstakt_download_profile_package'
      );
      echo '<tr>';
      echo '<td>' . esc_html($profile['student_display_name']) . '</td>';
      echo '<td>' . esc_html($profile['profile_label']) . ' · ' . esc_html($profile['instrument']) . '</td>';
      echo '<td><code>' . esc_html($profile['app_student_id']) . '</code></td>';
      echo '<td><code>' . esc_html($profile['upload_token']) . '</code></td>';
      echo '<td>' . $this->edit_link('profiles', 'edit_profile', (int) $profile['id']) . ' <a class="button button-secondary" href="' . esc_url($download_url) . '">Profilpaket</a> ' . $this->delete_inline_form('delete_profile', 'profile_id', (int) $profile['id'], 'Löschen') . '</td>';
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
    $this->render_select_row('Lehrkraft', 'teacher_id', $teacher_options, '');
    $this->render_select_row('Profil', 'student_profile_id', $profile_options, '');
    $this->render_text_row('Rollenbezeichnung', 'role_label', 'Lehrkraft');
    echo '<tr><th>Primär</th><td><label><input type="checkbox" name="is_primary" value="1" checked /> Primäre Zuständigkeit</label></td></tr>';
    echo '</tbody></table>';
    submit_button('Zuordnung speichern');
    echo '</form>';

    echo '<h3>Vorhandene Zuordnungen</h3>';
    echo '<table class="widefat striped"><thead><tr><th>Lehrkraft</th><th>Lernprofil</th><th>Rolle</th><th>Primär</th><th>Aktionen</th></tr></thead><tbody>';
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

  private function render_cards_tab(array $cards, array $teachers, array $classes, array $profiles, ?array $edit_card): void {
    echo '<h2>Kärtchenbibliothek</h2>';
    $settings = $this->repository->get_settings();
    $practice_categories = $settings['practice_categories'] ?? FleissTakt_Sync_Bridge_Repository::DEFAULT_PRACTICE_CATEGORIES;
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
    echo '<tr><th></th><td><p class="description">Bei "Keine" wird das Kärtchen nicht automatisch freigeschaltet. Es eignet sich für direkte Belohnungen mit persönlicher Notiz.</p></td></tr>';
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
    echo '<tr><th></th><td><p class="description">Bei "Für alle" wird dieses Feld ignoriert. Für Klassen nutzt das Plugin die Klassen-ID, für einzelne Personen die App-ID des Instrument-Profils.</p></td></tr>';
    $this->render_text_row('Farbwelt', 'accent', $edit_card['accent'] ?? 'gold');
    $this->render_text_row('Symbol', 'symbol', $edit_card['symbol'] ?? '✦');
    $this->render_text_row('Seltenheit', 'rarity', $edit_card['rarity'] ?? 'Basis');
    $this->render_select_row('Status', 'status', ['active' => 'Aktiv', 'inactive' => 'Inaktiv'], $edit_card['status'] ?? 'active');
    echo '</tbody></table>';
    submit_button($edit_card ? 'Kärtchen aktualisieren' : 'Kärtchen anlegen');
    echo '</form>';

    echo '<h3>Vorhandene Kärtchen</h3>';
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
      echo '<td>' . $this->edit_link('cards', 'edit_card', (int) $card['id']) . ' ' . $this->delete_inline_form('delete_card', 'card_id', (int) $card['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_reports_tab(array $reports): void {
    echo '<h2>Berichte</h2>';
    echo '<table class="widefat striped"><thead><tr><th>Lernprofil</th><th>Zeitraum</th><th>Minuten</th><th>Gesendet</th><th>Empfangen</th><th>Aktionen</th></tr></thead><tbody>';
    foreach ($reports as $report) {
      echo '<tr>';
      echo '<td>' . esc_html($report['student_display_name']) . ' · ' . esc_html($report['profile_label']) . ' · ' . esc_html($report['instrument']) . '</td>';
      echo '<td>' . esc_html($report['report_label']) . '</td>';
      echo '<td>' . (int) $report['report_minutes'] . '</td>';
      echo '<td>' . esc_html($report['exported_at']) . '</td>';
      echo '<td>' . esc_html($report['received_at']) . '</td>';
      echo '<td>' . $this->delete_inline_form('delete_report', 'report_id', (int) $report['id'], 'Löschen') . '</td>';
      echo '</tr>';
    }
    echo '</tbody></table>';
  }

  private function render_settings_tab(array $settings): void {
    echo '<h2>Einstellungen</h2>';
    $this->render_form_start('save_settings');
    echo '<table class="form-table"><tbody>';
    $this->render_text_row('Seitenlabel', 'site_label', $settings['site_label'] ?? get_bloginfo('name'));
    $this->render_text_row('Sync-Basis-URL', 'sync_base_url', $settings['sync_base_url'] ?? trailingslashit(site_url('wp-json/fleisstakt-sync/v1')));
    $this->render_text_row('URL der Lernenden-App', 'learner_app_url', $settings['learner_app_url'] ?? 'https://marsrakete.github.io/fleisstakt/', 'Diese URL wird für die öffentliche Einstiegsseite und den App-QR verwendet.');
    $this->render_number_row('Berichte aufbewahren (Tage)', 'retention_days', (int) ($settings['retention_days'] ?? 180), 30, 3650);
    echo '<tr><th>Übekategorien</th><td><textarea name="practice_categories" rows="5" class="large-text">' . esc_textarea(implode("\n", $settings['practice_categories'] ?? FleissTakt_Sync_Bridge_Repository::DEFAULT_PRACTICE_CATEGORIES)) . '</textarea><p class="description">Eine Kategorie pro Zeile. Diese Liste wird an Lehrkräfte- und Lernenden-App synchronisiert.</p></td></tr>';
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
      return gmdate('d.m.Y', $start) . ' bis ' . gmdate('d.m.Y', $end);
    }
    if ($start) {
      return 'Ab ' . gmdate('d.m.Y', $start);
    }
    return 'Bis ' . gmdate('d.m.Y', $end);
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
    $filename = 'fleisstakt-plugin-backup-' . gmdate('Ymd-His') . '.json';

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
      'profile_saved' => ['success', 'Instrument-Profil gespeichert.'],
      'profile_deleted' => ['success', 'Instrument-Profil gelöscht.'],
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

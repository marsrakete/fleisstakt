<?php

if (!defined('ABSPATH')) {
  exit;
}

class FleissTakt_Sync_Bridge_Repository {
  public const SETTINGS_OPTION = 'fleisstakt_sync_bridge_settings';
  public const DEFAULT_PRACTICE_CATEGORIES = ['Technik', 'Stück', 'Tonleiter', 'Freies Spiel'];
  private const DEFAULT_FEEDBACK_MIN_RESULTS = 5;
  private const DEFAULT_FEEDBACK_INTRO = 'Deine Antworten sind anonym. Die Lehrkraft sieht keine einzelnen Antworten, sondern nur die gemeinsame Auswertung.';
  private const DEFAULT_FEEDBACK_QUESTIONS = [
    'Ich fühle mich im Unterricht ernst genommen.',
    'Die Erklärungen im Unterricht helfen mir weiter.',
    'Ich weiß nach dem Unterricht, was ich zu Hause üben soll.',
    'Das Tempo im Unterricht passt für mich.',
    'Insgesamt bin ich mit dem Unterricht zufrieden.',
  ];

  private wpdb $wpdb;
  private bool $is_in_transaction = false;
  private string $teachers_table;
  private string $classes_table;
  private string $students_table;
  private string $profiles_table;
  private string $assignments_table;
  private string $cards_table;
  private string $card_awards_table;
  private string $reports_table;
  private string $feedback_rounds_table;
  private string $feedback_questions_table;
  private string $feedback_ballots_table;
  private string $feedback_answers_table;

  public function __construct() {
    global $wpdb;

    $this->wpdb = $wpdb;
    $prefix = $wpdb->prefix . 'fleisstakt_';
    $this->teachers_table = $prefix . 'teachers';
    $this->classes_table = $prefix . 'classes';
    $this->students_table = $prefix . 'students';
    $this->profiles_table = $prefix . 'student_profiles';
    $this->assignments_table = $prefix . 'teacher_assignments';
    $this->cards_table = $prefix . 'cards';
    $this->card_awards_table = $prefix . 'card_awards';
    $this->reports_table = $prefix . 'reports';
    $this->feedback_rounds_table = $prefix . 'feedback_rounds';
    $this->feedback_questions_table = $prefix . 'feedback_round_questions';
    $this->feedback_ballots_table = $prefix . 'feedback_ballots';
    $this->feedback_answers_table = $prefix . 'feedback_answers';
  }

  public function install(): void {
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $charset = $this->wpdb->get_charset_collate();

    $sql = [];
    $sql[] = "CREATE TABLE {$this->teachers_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      teacher_uuid VARCHAR(64) NOT NULL,
      wp_user_id BIGINT UNSIGNED NULL,
      display_name VARCHAR(128) NOT NULL,
      email VARCHAR(190) NOT NULL DEFAULT '',
      api_key VARCHAR(64) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY teacher_uuid (teacher_uuid),
      UNIQUE KEY api_key (api_key)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->classes_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      class_uuid VARCHAR(64) NOT NULL,
      class_name VARCHAR(128) NOT NULL,
      teacher_id BIGINT UNSIGNED NULL DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY class_uuid (class_uuid),
      KEY teacher_id (teacher_id)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->students_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      student_uuid VARCHAR(64) NOT NULL,
      external_student_id VARCHAR(64) NOT NULL DEFAULT '',
      first_name VARCHAR(120) NOT NULL DEFAULT '',
      last_name VARCHAR(120) NOT NULL DEFAULT '',
      email VARCHAR(190) NOT NULL DEFAULT '',
      messenger_id VARCHAR(190) NOT NULL DEFAULT '',
      display_name VARCHAR(160) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY student_uuid (student_uuid)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->profiles_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      profile_uuid VARCHAR(64) NOT NULL,
      student_id BIGINT UNSIGNED NOT NULL,
      class_id BIGINT UNSIGNED NULL,
      instrument VARCHAR(64) NOT NULL,
      profile_label VARCHAR(160) NOT NULL,
      goal_minutes INT NOT NULL DEFAULT 15,
      app_student_id VARCHAR(64) NOT NULL,
      upload_token VARCHAR(64) NOT NULL,
      connect_code VARCHAR(8) NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY profile_uuid (profile_uuid),
      UNIQUE KEY app_student_id (app_student_id),
      UNIQUE KEY upload_token (upload_token),
      KEY connect_code (connect_code),
      KEY student_id (student_id),
      KEY class_id (class_id)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->assignments_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      teacher_id BIGINT UNSIGNED NOT NULL,
      student_profile_id BIGINT UNSIGNED NOT NULL,
      role_label VARCHAR(64) NOT NULL DEFAULT 'Lehrkraft',
      is_primary TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY teacher_profile (teacher_id, student_profile_id),
      KEY student_profile_id (student_profile_id)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->cards_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      card_uuid VARCHAR(64) NOT NULL,
      teacher_id BIGINT UNSIGNED NULL,
      title VARCHAR(120) NOT NULL,
      description VARCHAR(255) NOT NULL,
      rule_type VARCHAR(64) NOT NULL,
      rule_value INT NOT NULL DEFAULT 1,
      rule_meta LONGTEXT NULL,
      assignment_type VARCHAR(20) NOT NULL DEFAULT 'all',
      assignment_target VARCHAR(64) NOT NULL DEFAULT '',
      accent VARCHAR(32) NOT NULL DEFAULT 'gold',
      symbol VARCHAR(8) NOT NULL DEFAULT '✦',
      rarity VARCHAR(32) NOT NULL DEFAULT 'Basis',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY card_uuid (card_uuid),
      KEY teacher_id (teacher_id)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->card_awards_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      award_uuid VARCHAR(64) NOT NULL,
      card_id BIGINT UNSIGNED NOT NULL,
      teacher_id BIGINT UNSIGNED NOT NULL,
      student_profile_id BIGINT UNSIGNED NOT NULL,
      note VARCHAR(255) NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      awarded_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY award_uuid (award_uuid),
      UNIQUE KEY card_profile (card_id, student_profile_id),
      KEY teacher_id (teacher_id),
      KEY student_profile_id (student_profile_id)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->reports_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      report_uuid VARCHAR(64) NOT NULL,
      student_profile_id BIGINT UNSIGNED NOT NULL,
      student_uuid VARCHAR(64) NOT NULL,
      app_student_id VARCHAR(64) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      payload_json LONGTEXT NOT NULL,
      report_range VARCHAR(16) NOT NULL DEFAULT 'week',
      report_label VARCHAR(64) NOT NULL DEFAULT '',
      report_minutes INT NOT NULL DEFAULT 0,
      report_streak INT NOT NULL DEFAULT 0,
      entries_count INT NOT NULL DEFAULT 0,
      exported_at DATETIME NOT NULL,
      received_at DATETIME NOT NULL,
      app_version VARCHAR(32) NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      PRIMARY KEY (id),
      UNIQUE KEY report_uuid (report_uuid),
      UNIQUE KEY profile_checksum (student_profile_id, checksum),
      KEY student_profile_id (student_profile_id),
      KEY exported_at (exported_at)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->feedback_rounds_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      round_uuid VARCHAR(64) NOT NULL,
      round_slug VARCHAR(120) NOT NULL,
      title VARCHAR(160) NOT NULL,
      intro_text TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      teacher_id BIGINT UNSIGNED NOT NULL,
      min_results_count INT NOT NULL DEFAULT 5,
      starts_at DATETIME NOT NULL,
      ends_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY round_uuid (round_uuid),
      UNIQUE KEY round_slug_teacher (round_slug, teacher_id),
      KEY teacher_id (teacher_id),
      KEY status_dates (status, starts_at, ends_at)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->feedback_questions_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      round_id BIGINT UNSIGNED NOT NULL,
      question_uuid VARCHAR(64) NOT NULL,
      question_key VARCHAR(64) NOT NULL,
      position INT NOT NULL DEFAULT 1,
      label VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'scale5',
      is_required TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY question_uuid (question_uuid),
      UNIQUE KEY round_question_key (round_id, question_key),
      KEY round_position (round_id, position)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->feedback_ballots_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      round_id BIGINT UNSIGNED NOT NULL,
      profile_id BIGINT UNSIGNED NOT NULL,
      ballot_token VARCHAR(96) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      issued_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY ballot_token (ballot_token),
      UNIQUE KEY round_profile (round_id, profile_id),
      KEY round_status (round_id, status)
    ) {$charset};";

    $sql[] = "CREATE TABLE {$this->feedback_answers_table} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      round_id BIGINT UNSIGNED NOT NULL,
      question_id BIGINT UNSIGNED NOT NULL,
      ballot_id BIGINT UNSIGNED NOT NULL,
      answer_value INT NOT NULL DEFAULT 0,
      submitted_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL,
      PRIMARY KEY (id),
      KEY round_question (round_id, question_id),
      KEY ballot_id (ballot_id)
    ) {$charset};";

    foreach ($sql as $statement) {
      dbDelta($statement);
    }
  }

  public function ensure_default_settings(): void {
    $settings = $this->get_settings();
    $defaults = [
      'retention_days' => 180,
      'sync_base_url' => trailingslashit(site_url('wp-json/fleisstakt-sync/v1')),
      'site_label' => get_bloginfo('name'),
      'learner_app_url' => 'https://marsrakete.github.io/fleisstakt/',
      'practice_categories' => self::DEFAULT_PRACTICE_CATEGORIES,
    ];

    update_option(self::SETTINGS_OPTION, array_merge($defaults, $settings));
  }

  public function get_settings(): array {
    $settings = get_option(self::SETTINGS_OPTION, []);
    if (!is_array($settings)) {
      return [];
    }
    $settings['practice_categories'] = $this->normalize_practice_categories($settings['practice_categories'] ?? self::DEFAULT_PRACTICE_CATEGORIES);
    return $settings;
  }

  public function update_settings(array $settings): void {
    $current = $this->get_settings();
    if (array_key_exists('practice_categories', $settings)) {
      $settings['practice_categories'] = $this->normalize_practice_categories($settings['practice_categories']);
    }
    $next = array_merge($current, $settings);
    update_option(self::SETTINGS_OPTION, $next);
  }

  public function get_practice_categories(): array {
    return $this->normalize_practice_categories($this->get_settings()['practice_categories'] ?? self::DEFAULT_PRACTICE_CATEGORIES);
  }

  public function export_backup_payload(): array {
    $payload = [
      'kind' => 'fleisstakt-plugin-backup',
      'version' => 1,
      'exportedAt' => gmdate('c'),
      'pluginVersion' => defined('FLEISSTAKT_SYNC_BRIDGE_VERSION') ? FLEISSTAKT_SYNC_BRIDGE_VERSION : '',
      'settings' => $this->get_settings(),
      'data' => [
        'teachers' => $this->wpdb->get_results("SELECT * FROM {$this->teachers_table} ORDER BY id ASC", ARRAY_A),
        'classes' => $this->wpdb->get_results("SELECT * FROM {$this->classes_table} ORDER BY id ASC", ARRAY_A),
        'students' => $this->wpdb->get_results("SELECT * FROM {$this->students_table} ORDER BY id ASC", ARRAY_A),
        'profiles' => $this->wpdb->get_results("SELECT * FROM {$this->profiles_table} ORDER BY id ASC", ARRAY_A),
        'assignments' => $this->wpdb->get_results("SELECT * FROM {$this->assignments_table} ORDER BY id ASC", ARRAY_A),
        'cards' => $this->wpdb->get_results("SELECT * FROM {$this->cards_table} ORDER BY id ASC", ARRAY_A),
        'cardAwards' => $this->wpdb->get_results("SELECT * FROM {$this->card_awards_table} ORDER BY id ASC", ARRAY_A),
        'reports' => $this->wpdb->get_results("SELECT * FROM {$this->reports_table} ORDER BY id ASC", ARRAY_A),
        'feedbackRounds' => $this->wpdb->get_results("SELECT * FROM {$this->feedback_rounds_table} ORDER BY id ASC", ARRAY_A),
        'feedbackQuestions' => $this->wpdb->get_results("SELECT * FROM {$this->feedback_questions_table} ORDER BY id ASC", ARRAY_A),
        'feedbackBallots' => $this->wpdb->get_results("SELECT * FROM {$this->feedback_ballots_table} ORDER BY id ASC", ARRAY_A),
        'feedbackAnswers' => $this->wpdb->get_results("SELECT * FROM {$this->feedback_answers_table} ORDER BY id ASC", ARRAY_A),
      ],
    ];

    return [
      ...$payload,
      'checksum' => $this->create_checksum($payload),
    ];
  }

  public function import_backup_payload(array $payload): void {
    if (($payload['kind'] ?? '') !== 'fleisstakt-plugin-backup') {
      throw new InvalidArgumentException('ungueltiges-backup-format');
    }

    $checksum = (string) ($payload['checksum'] ?? '');
    $body = $payload;
    unset($body['checksum']);

    if ($checksum === '' || $this->create_checksum($body) !== $checksum) {
      throw new InvalidArgumentException('ungueltige-pruefsumme');
    }

    $data = $payload['data'] ?? null;
    if (
      !is_array($data)
      || !is_array($data['teachers'] ?? null)
      || !is_array($data['classes'] ?? null)
      || !is_array($data['students'] ?? null)
      || !is_array($data['profiles'] ?? null)
      || !is_array($data['assignments'] ?? null)
      || !is_array($data['cards'] ?? null)
      || !is_array($data['cardAwards'] ?? null)
      || !is_array($data['reports'] ?? null)
    ) {
      throw new InvalidArgumentException('ungueltige-backup-daten');
    }

    $this->run_in_transaction(function () use ($data, $payload): void {
      $this->wpdb->query("DELETE FROM {$this->feedback_answers_table}");
      $this->wpdb->query("DELETE FROM {$this->feedback_ballots_table}");
      $this->wpdb->query("DELETE FROM {$this->feedback_questions_table}");
      $this->wpdb->query("DELETE FROM {$this->feedback_rounds_table}");
      $this->wpdb->query("DELETE FROM {$this->reports_table}");
      $this->wpdb->query("DELETE FROM {$this->card_awards_table}");
      $this->wpdb->query("DELETE FROM {$this->cards_table}");
      $this->wpdb->query("DELETE FROM {$this->assignments_table}");
      $this->wpdb->query("DELETE FROM {$this->profiles_table}");
      $this->wpdb->query("DELETE FROM {$this->students_table}");
      $this->wpdb->query("DELETE FROM {$this->classes_table}");
      $this->wpdb->query("DELETE FROM {$this->teachers_table}");

      foreach ($data['teachers'] as $row) {
        $this->insert_backup_row($this->teachers_table, $row, [
          '%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach ($data['classes'] as $row) {
        $this->insert_backup_row($this->classes_table, $row, [
          '%d', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach ($data['students'] as $row) {
        $this->insert_backup_row($this->students_table, $row, [
          '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach ($data['profiles'] as $row) {
        $this->insert_backup_row($this->profiles_table, $row, [
          '%d', '%s', '%d', '%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach ($data['assignments'] as $row) {
        $this->insert_backup_row($this->assignments_table, $row, [
          '%d', '%d', '%d', '%s', '%d', '%s', '%s',
        ]);
      }

      foreach ($data['cards'] as $row) {
        $this->insert_backup_row($this->cards_table, $row, [
          '%d', '%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach ($data['cardAwards'] as $row) {
        $this->insert_backup_row($this->card_awards_table, $row, [
          '%d', '%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach ($data['reports'] as $row) {
        $this->insert_backup_row($this->reports_table, $row, [
          '%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach (($data['feedbackRounds'] ?? []) as $row) {
        $this->insert_backup_row($this->feedback_rounds_table, $row, [
          '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach (($data['feedbackQuestions'] ?? []) as $row) {
        $this->insert_backup_row($this->feedback_questions_table, $row, [
          '%d', '%d', '%s', '%s', '%d', '%s', '%s', '%d', '%s', '%s',
        ]);
      }

      foreach (($data['feedbackBallots'] ?? []) as $row) {
        $this->insert_backup_row($this->feedback_ballots_table, $row, [
          '%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s',
        ]);
      }

      foreach (($data['feedbackAnswers'] ?? []) as $row) {
        $this->insert_backup_row($this->feedback_answers_table, $row, [
          '%d', '%d', '%d', '%d', '%d', '%s', '%s',
        ]);
      }

      $this->update_settings(is_array($payload['settings'] ?? null) ? $payload['settings'] : []);
    });
  }

  public function create_teacher(array $data): void {
    $now = current_time('mysql', true);
    $this->wpdb->insert(
      $this->teachers_table,
      [
        'teacher_uuid' => $data['teacher_uuid'] ?: $this->generate_uuid('teacher'),
        'wp_user_id' => !empty($data['wp_user_id']) ? (int) $data['wp_user_id'] : null,
        'display_name' => $data['display_name'],
        'email' => $data['email'] ?? '',
        'api_key' => $data['api_key'] ?: $this->generate_token('teacher'),
        'status' => $data['status'] ?? 'active',
        'created_at' => $now,
        'updated_at' => $now,
      ],
      ['%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s']
    );
  }

  public function update_teacher(int $id, array $data): void {
    $existing = $this->get_teacher($id);
    if (!$existing) {
      return;
    }

    $this->wpdb->update(
      $this->teachers_table,
      [
        'display_name' => $data['display_name'],
        'email' => $data['email'] ?? '',
        'status' => $data['status'] ?? 'active',
        'api_key' => !empty($data['regenerate_api_key']) ? $this->generate_token('teacher') : $existing['api_key'],
        'updated_at' => current_time('mysql', true),
      ],
      ['id' => $id],
      ['%s', '%s', '%s', '%s', '%s'],
      ['%d']
    );
  }

  public function delete_teacher(int $id): void {
    $this->wpdb->delete($this->assignments_table, ['teacher_id' => $id], ['%d']);
    $this->wpdb->delete($this->teachers_table, ['id' => $id], ['%d']);
  }

  public function get_teacher(int $id): ?array {
    $row = $this->wpdb->get_row($this->wpdb->prepare("SELECT * FROM {$this->teachers_table} WHERE id = %d", $id), ARRAY_A);
    return $row ?: null;
  }

  public function get_teacher_by_api_key(string $api_key): ?array {
    $row = $this->wpdb->get_row($this->wpdb->prepare("SELECT * FROM {$this->teachers_table} WHERE api_key = %s AND status = 'active'", $api_key), ARRAY_A);
    return $row ?: null;
  }

  public function list_teachers(): array {
    return $this->wpdb->get_results("SELECT * FROM {$this->teachers_table} ORDER BY display_name ASC", ARRAY_A);
  }

  public function create_class(array $data): void {
    $now = current_time('mysql', true);
    $this->assert_db_write_success(
      $this->wpdb->insert(
        $this->classes_table,
        [
          'class_uuid' => $data['class_uuid'] ?: $this->generate_uuid('class'),
          'class_name' => $data['class_name'],
          'teacher_id' => isset($data['teacher_id']) ? (int) $data['teacher_id'] : null,
          'status' => $data['status'] ?? 'active',
          'created_at' => $now,
          'updated_at' => $now,
        ],
        ['%s', '%s', '%d', '%s', '%s', '%s']
      ),
      'Klasse konnte nicht gespeichert werden.'
    );
  }

  public function update_class(int $id, array $data): void {
    $this->wpdb->update(
      $this->classes_table,
      [
        'class_name' => $data['class_name'],
        'status' => $data['status'] ?? 'active',
        'updated_at' => current_time('mysql', true),
      ],
      ['id' => $id],
      ['%s', '%s', '%s'],
      ['%d']
    );
  }

  public function delete_class(int $id): void {
    $this->wpdb->update($this->profiles_table, ['class_id' => null], ['class_id' => $id], ['%d'], ['%d']);
    $this->wpdb->delete($this->classes_table, ['id' => $id], ['%d']);
  }

  public function get_class(int $id): ?array {
    $row = $this->wpdb->get_row($this->wpdb->prepare("SELECT * FROM {$this->classes_table} WHERE id = %d", $id), ARRAY_A);
    return $row ?: null;
  }

  public function list_classes(): array {
    return $this->wpdb->get_results(
      "SELECT c.*,
              COUNT(DISTINCT p.id) AS profile_count,
              COUNT(DISTINCT p.student_id) AS student_count,
              GROUP_CONCAT(DISTINCT COALESCE(t.display_name, owner.display_name) ORDER BY COALESCE(t.display_name, owner.display_name) SEPARATOR ', ') AS teacher_names
       FROM {$this->classes_table} c
       LEFT JOIN {$this->profiles_table} p ON p.class_id = c.id
       LEFT JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
       LEFT JOIN {$this->teachers_table} t ON t.id = a.teacher_id
       LEFT JOIN {$this->teachers_table} owner ON owner.id = c.teacher_id
       GROUP BY c.id
       ORDER BY c.class_name ASC",
      ARRAY_A
    );
  }

  public function create_student(array $data): void {
    $now = current_time('mysql', true);
    $this->assert_db_write_success(
      $this->wpdb->insert(
        $this->students_table,
        [
          'student_uuid' => $data['student_uuid'] ?: $this->generate_uuid('student'),
          'external_student_id' => $data['external_student_id'] ?? '',
          'first_name' => $data['first_name'] ?? '',
          'last_name' => $data['last_name'] ?? '',
          'email' => $data['email'] ?? '',
          'messenger_id' => $data['messenger_id'] ?? '',
          'display_name' => $data['display_name'],
          'status' => $data['status'] ?? 'active',
          'created_at' => $now,
          'updated_at' => $now,
        ],
        ['%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
      ),
      'Lernenden-Daten konnten nicht gespeichert werden.'
    );
  }

  public function update_student(int $id, array $data): void {
    $this->assert_db_write_success(
      $this->wpdb->update(
        $this->students_table,
        [
          'external_student_id' => $data['external_student_id'] ?? '',
          'first_name' => $data['first_name'] ?? '',
          'last_name' => $data['last_name'] ?? '',
          'email' => $data['email'] ?? '',
          'messenger_id' => $data['messenger_id'] ?? '',
          'display_name' => $data['display_name'],
          'status' => $data['status'] ?? 'active',
          'updated_at' => current_time('mysql', true),
        ],
        ['id' => $id],
        ['%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'],
        ['%d']
      ),
      'Lernenden-Daten konnten nicht aktualisiert werden.'
    );
  }

  public function delete_student(int $id): void {
    $profiles = $this->list_profiles_by_student($id);
    foreach ($profiles as $profile) {
      $this->delete_profile((int) $profile['id']);
    }
    $this->wpdb->delete($this->students_table, ['id' => $id], ['%d']);
  }

  public function get_student(int $id): ?array {
    $row = $this->wpdb->get_row($this->wpdb->prepare("SELECT * FROM {$this->students_table} WHERE id = %d", $id), ARRAY_A);
    return $row ?: null;
  }

  public function list_students(): array {
    return $this->wpdb->get_results("SELECT * FROM {$this->students_table} ORDER BY display_name ASC", ARRAY_A);
  }

  public function create_profile(array $data): void {
    $now = current_time('mysql', true);
    $this->assert_db_write_success(
      $this->wpdb->insert(
        $this->profiles_table,
        [
          'profile_uuid' => $data['profile_uuid'] ?: $this->generate_uuid('profile'),
          'student_id' => (int) $data['student_id'],
          'class_id' => !empty($data['class_id']) ? (int) $data['class_id'] : null,
          'instrument' => $data['instrument'],
          'profile_label' => $data['profile_label'],
          'goal_minutes' => max(5, (int) $data['goal_minutes']),
          'app_student_id' => $data['app_student_id'] ?: $this->generate_uuid('app'),
          'upload_token' => $data['upload_token'] ?: $this->generate_token('upload'),
          'connect_code' => $data['connect_code'] ?: $this->generate_connection_code(),
          'status' => $data['status'] ?? 'active',
          'created_at' => $now,
          'updated_at' => $now,
        ],
        ['%s', '%d', '%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s']
      ),
      'Profil konnte nicht gespeichert werden.'
    );
  }

  public function update_profile(int $id, array $data): void {
    $existing = $this->get_profile($id);
    if (!$existing) {
      return;
    }

    $this->assert_db_write_success(
      $this->wpdb->update(
        $this->profiles_table,
        [
          'student_id' => (int) $data['student_id'],
          'class_id' => !empty($data['class_id']) ? (int) $data['class_id'] : null,
          'instrument' => $data['instrument'],
          'profile_label' => $data['profile_label'],
          'goal_minutes' => max(5, (int) $data['goal_minutes']),
          'status' => $data['status'] ?? 'active',
          'upload_token' => !empty($data['regenerate_upload_token']) ? $this->generate_token('upload') : $existing['upload_token'],
          'connect_code' => !empty($data['regenerate_connect_code']) ? $this->generate_connection_code() : ($existing['connect_code'] ?? $this->generate_connection_code()),
          'updated_at' => current_time('mysql', true),
        ],
        ['id' => $id],
        ['%d', '%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s'],
        ['%d']
      ),
      'Profil konnte nicht aktualisiert werden.'
    );
  }

  public function delete_profile(int $id): void {
    $this->wpdb->delete($this->assignments_table, ['student_profile_id' => $id], ['%d']);
    $this->wpdb->delete($this->card_awards_table, ['student_profile_id' => $id], ['%d']);
    $this->wpdb->delete($this->reports_table, ['student_profile_id' => $id], ['%d']);
    $this->wpdb->delete($this->profiles_table, ['id' => $id], ['%d']);
  }

  public function get_profile(int $id): ?array {
    $row = $this->wpdb->get_row(
      $this->wpdb->prepare(
        "SELECT p.*, s.student_uuid, s.display_name AS student_display_name, c.class_uuid, c.class_name
         FROM {$this->profiles_table} p
         INNER JOIN {$this->students_table} s ON s.id = p.student_id
         LEFT JOIN {$this->classes_table} c ON c.id = p.class_id
         WHERE p.id = %d",
        $id
      ),
      ARRAY_A
    );
    return $row ? $this->ensure_profile_connect_code($row) : null;
  }

  public function get_profile_by_app_student_id(string $app_student_id): ?array {
    $row = $this->wpdb->get_row(
      $this->wpdb->prepare(
        "SELECT p.*, s.student_uuid, s.display_name AS student_display_name, c.class_uuid, c.class_name
         FROM {$this->profiles_table} p
         INNER JOIN {$this->students_table} s ON s.id = p.student_id
         LEFT JOIN {$this->classes_table} c ON c.id = p.class_id
         WHERE p.app_student_id = %s AND p.status = 'active'",
        $app_student_id
      ),
      ARRAY_A
    );
    return $row ? $this->ensure_profile_connect_code($row) : null;
  }

  public function get_profile_by_upload_token(string $upload_token): ?array {
    $row = $this->wpdb->get_row(
      $this->wpdb->prepare(
        "SELECT p.*, s.student_uuid, s.display_name AS student_display_name, c.class_uuid, c.class_name
         FROM {$this->profiles_table} p
         INNER JOIN {$this->students_table} s ON s.id = p.student_id
         LEFT JOIN {$this->classes_table} c ON c.id = p.class_id
         WHERE p.upload_token = %s AND p.status = 'active'",
        $upload_token
      ),
      ARRAY_A
    );
    return $row ? $this->ensure_profile_connect_code($row) : null;
  }

  public function get_profile_by_connect_credentials(string $app_student_id, string $connect_code): ?array {
    $row = $this->wpdb->get_row(
      $this->wpdb->prepare(
        "SELECT p.*, s.student_uuid, s.display_name AS student_display_name, c.class_uuid, c.class_name
         FROM {$this->profiles_table} p
         INNER JOIN {$this->students_table} s ON s.id = p.student_id
         LEFT JOIN {$this->classes_table} c ON c.id = p.class_id
         WHERE p.app_student_id = %s AND p.connect_code = %s AND p.status = 'active'",
        $app_student_id,
        $connect_code
      ),
      ARRAY_A
    );
    return $row ? $this->ensure_profile_connect_code($row) : null;
  }

  public function list_profiles(): array {
    return $this->wpdb->get_results(
      "SELECT p.*, s.display_name AS student_display_name, s.student_uuid, c.class_name,
              COUNT(DISTINCT a.id) AS assignment_count,
              GROUP_CONCAT(DISTINCT t.display_name ORDER BY t.display_name SEPARATOR ', ') AS teacher_names
       FROM {$this->profiles_table} p
       INNER JOIN {$this->students_table} s ON s.id = p.student_id
       LEFT JOIN {$this->classes_table} c ON c.id = p.class_id
       LEFT JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
       LEFT JOIN {$this->teachers_table} t ON t.id = a.teacher_id
       GROUP BY p.id
       ORDER BY s.display_name ASC, p.instrument ASC",
      ARRAY_A
    );
  }

  public function list_profiles_by_student(int $student_id): array {
    return $this->wpdb->get_results(
      $this->wpdb->prepare("SELECT * FROM {$this->profiles_table} WHERE student_id = %d ORDER BY instrument ASC", $student_id),
      ARRAY_A
    );
  }

  public function save_assignment(array $data): void {
    $existing_id = (int) $this->wpdb->get_var(
      $this->wpdb->prepare(
        "SELECT id FROM {$this->assignments_table} WHERE teacher_id = %d AND student_profile_id = %d",
        (int) $data['teacher_id'],
        (int) $data['student_profile_id']
      )
    );

    $payload = [
      'teacher_id' => (int) $data['teacher_id'],
      'student_profile_id' => (int) $data['student_profile_id'],
      'role_label' => $data['role_label'] ?: 'Lehrkraft',
      'is_primary' => !empty($data['is_primary']) ? 1 : 0,
      'updated_at' => current_time('mysql', true),
    ];

    if ($existing_id) {
      $this->assert_db_write_success(
        $this->wpdb->update($this->assignments_table, $payload, ['id' => $existing_id], ['%d', '%d', '%s', '%d', '%s'], ['%d']),
        'Lehrkraft-Zuordnung konnte nicht aktualisiert werden.'
      );
      return;
    }

    $payload['created_at'] = current_time('mysql', true);
    $this->assert_db_write_success(
      $this->wpdb->insert($this->assignments_table, $payload, ['%d', '%d', '%s', '%d', '%s', '%s']),
      'Lehrkraft-Zuordnung konnte nicht gespeichert werden.'
    );
  }

  public function delete_assignment(int $id): void {
    $this->wpdb->delete($this->assignments_table, ['id' => $id], ['%d']);
  }

  public function list_assignments(): array {
    return $this->wpdb->get_results(
      "SELECT a.*, t.display_name AS teacher_name, p.profile_label, p.instrument, s.display_name AS student_display_name
       FROM {$this->assignments_table} a
       INNER JOIN {$this->teachers_table} t ON t.id = a.teacher_id
       INNER JOIN {$this->profiles_table} p ON p.id = a.student_profile_id
       INNER JOIN {$this->students_table} s ON s.id = p.student_id
       ORDER BY t.display_name ASC, s.display_name ASC",
      ARRAY_A
    );
  }

  public function create_card(array $data): void {
    $now = current_time('mysql', true);
    $rule_type = sanitize_text_field((string) ($data['rule_type'] ?? 'entriesCountAtLeast'));
    $rule_value = $rule_type === 'none' ? 0 : max(1, (int) ($data['rule_value'] ?? 1));
    $rule_meta = $this->encode_rule_meta($data['rule_meta'] ?? []);
    $this->wpdb->insert(
      $this->cards_table,
      [
        'card_uuid' => $data['card_uuid'] ?: $this->generate_uuid('card'),
        'teacher_id' => !empty($data['teacher_id']) ? (int) $data['teacher_id'] : null,
        'title' => $data['title'],
        'description' => $data['description'],
        'rule_type' => $rule_type,
        'rule_value' => $rule_value,
        'rule_meta' => $rule_meta,
        'assignment_type' => $data['assignment_type'] ?? 'all',
        'assignment_target' => $data['assignment_target'] ?? '',
        'accent' => $data['accent'] ?: 'gold',
        'symbol' => $data['symbol'] ?: '✦',
        'rarity' => $data['rarity'] ?: 'Basis',
        'status' => $data['status'] ?? 'active',
        'created_at' => $now,
        'updated_at' => $now,
      ],
      ['%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
    );
  }

  public function update_card(int $id, array $data): void {
    $rule_type = sanitize_text_field((string) ($data['rule_type'] ?? 'entriesCountAtLeast'));
    $rule_value = $rule_type === 'none' ? 0 : max(1, (int) ($data['rule_value'] ?? 1));
    $rule_meta = $this->encode_rule_meta($data['rule_meta'] ?? []);
    $this->wpdb->update(
      $this->cards_table,
      [
        'teacher_id' => !empty($data['teacher_id']) ? (int) $data['teacher_id'] : null,
        'title' => $data['title'],
        'description' => $data['description'],
        'rule_type' => $rule_type,
        'rule_value' => $rule_value,
        'rule_meta' => $rule_meta,
        'assignment_type' => $data['assignment_type'] ?? 'all',
        'assignment_target' => $data['assignment_target'] ?? '',
        'accent' => $data['accent'] ?: 'gold',
        'symbol' => $data['symbol'] ?: '✦',
        'rarity' => $data['rarity'] ?: 'Basis',
        'status' => $data['status'] ?? 'active',
        'updated_at' => current_time('mysql', true),
      ],
      ['id' => $id],
      ['%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'],
      ['%d']
    );
  }

  public function delete_card(int $id): void {
    $this->wpdb->delete($this->card_awards_table, ['card_id' => $id], ['%d']);
    $this->wpdb->delete($this->cards_table, ['id' => $id], ['%d']);
  }

  public function get_card(int $id): ?array {
    $row = $this->wpdb->get_row($this->wpdb->prepare("SELECT * FROM {$this->cards_table} WHERE id = %d", $id), ARRAY_A);
    return $row ?: null;
  }

  public function list_cards(): array {
    return $this->wpdb->get_results(
      "SELECT c.*, t.display_name AS teacher_name, COUNT(a.id) AS award_count
       FROM {$this->cards_table} c
       LEFT JOIN {$this->teachers_table} t ON t.id = c.teacher_id
       LEFT JOIN {$this->card_awards_table} a ON a.card_id = c.id AND a.status = 'active'
       GROUP BY c.id
       ORDER BY c.updated_at DESC, c.title ASC",
      ARRAY_A
    );
  }

  public function list_cards_for_teacher(int $teacher_id): array {
    return $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT c.*, t.display_name AS teacher_name, COUNT(a.id) AS award_count
         FROM {$this->cards_table} c
         LEFT JOIN {$this->teachers_table} t ON t.id = c.teacher_id
         LEFT JOIN {$this->card_awards_table} a ON a.card_id = c.id AND a.status = 'active'
         WHERE c.teacher_id = %d
         GROUP BY c.id
         ORDER BY c.updated_at DESC, c.title ASC",
        $teacher_id
      ),
      ARRAY_A
    );
  }

  public function list_card_awards_for_teacher(int $teacher_id): array {
    return $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT a.*, c.card_uuid, c.title, c.description, c.accent, c.symbol, c.rarity,
                p.profile_uuid, p.app_student_id, p.profile_label, p.instrument,
                s.display_name AS student_display_name, s.first_name, s.last_name
         FROM {$this->card_awards_table} a
         INNER JOIN {$this->cards_table} c ON c.id = a.card_id
         INNER JOIN {$this->profiles_table} p ON p.id = a.student_profile_id
         INNER JOIN {$this->students_table} s ON s.id = p.student_id
         WHERE a.teacher_id = %d AND a.status = 'active'
         ORDER BY a.awarded_at DESC, a.id DESC",
        $teacher_id
      ),
      ARRAY_A
    );
  }

  public function list_card_awards(): array {
    return $this->wpdb->get_results(
      "SELECT a.*, c.card_uuid, c.title, c.description, c.accent, c.symbol, c.rarity,
              t.display_name AS teacher_name,
              p.profile_uuid, p.app_student_id, p.profile_label, p.instrument,
              s.display_name AS student_display_name, s.first_name, s.last_name
       FROM {$this->card_awards_table} a
       INNER JOIN {$this->cards_table} c ON c.id = a.card_id
       LEFT JOIN {$this->teachers_table} t ON t.id = a.teacher_id
       INNER JOIN {$this->profiles_table} p ON p.id = a.student_profile_id
       INNER JOIN {$this->students_table} s ON s.id = p.student_id
       WHERE a.status = 'active'
       ORDER BY a.awarded_at DESC, a.id DESC",
      ARRAY_A
    );
  }

  public function list_cards_for_profile(array $profile): array {
    $profile_id = (int) ($profile['id'] ?? 0);
    $class_uuid = sanitize_text_field((string) ($profile['class_uuid'] ?? ''));
    $student_id = sanitize_text_field((string) ($profile['app_student_id'] ?? ''));
    $teacher_ids = $this->wpdb->get_col(
      $this->wpdb->prepare(
        "SELECT teacher_id FROM {$this->assignments_table} WHERE student_profile_id = %d",
        $profile_id
      )
    );

    $where_clauses = [
      "c.status = 'active'",
      "(" .
        "c.assignment_type = 'all'" .
        ($class_uuid !== '' ? $this->wpdb->prepare(" OR (c.assignment_type = 'class' AND c.assignment_target = %s)", $class_uuid) : '') .
        ($student_id !== '' ? $this->wpdb->prepare(" OR (c.assignment_type = 'student' AND c.assignment_target = %s)", $student_id) : '') .
      ")",
    ];

    if ($teacher_ids) {
      $teacher_ids = array_map('intval', $teacher_ids);
      $placeholders = implode(',', array_fill(0, count($teacher_ids), '%d'));
      $where_clauses[] = $this->wpdb->prepare(
        "(c.teacher_id IS NULL OR c.teacher_id IN ($placeholders))",
        ...$teacher_ids
      );
    } else {
      $where_clauses[] = "c.teacher_id IS NULL";
    }

    $sql = "SELECT c.*, t.display_name AS teacher_name
      FROM {$this->cards_table} c
      LEFT JOIN {$this->teachers_table} t ON t.id = c.teacher_id
      WHERE " . implode(' AND ', $where_clauses) . "
      ORDER BY c.updated_at DESC, c.title ASC";

    return $this->wpdb->get_results($sql, ARRAY_A);
  }

  public function award_card_to_profile(array $teacher, array $payload): array {
    return $this->run_in_transaction(function () use ($teacher, $payload): array {
      $teacher_id = (int) ($teacher['id'] ?? 0);
      $card_uuid = sanitize_text_field((string) ($payload['cardId'] ?? ''));
      $app_student_id = sanitize_text_field((string) ($payload['studentId'] ?? ''));
      $note = substr(sanitize_text_field((string) ($payload['note'] ?? '')), 0, 140);

      if ($teacher_id <= 0 || $card_uuid === '' || $app_student_id === '') {
        throw new InvalidArgumentException('ungueltige-vergabe');
      }

      $card = $this->wpdb->get_row(
        $this->wpdb->prepare(
          "SELECT * FROM {$this->cards_table} WHERE card_uuid = %s AND teacher_id = %d",
          $card_uuid,
          $teacher_id
        ),
        ARRAY_A
      );
      if (!$card) {
        throw new InvalidArgumentException('karte-nicht-gefunden');
      }

      $profile = $this->wpdb->get_row(
        $this->wpdb->prepare(
          "SELECT p.*, s.display_name AS student_display_name
           FROM {$this->profiles_table} p
           INNER JOIN {$this->students_table} s ON s.id = p.student_id
           INNER JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
           WHERE p.app_student_id = %s AND a.teacher_id = %d
           LIMIT 1",
          $app_student_id,
          $teacher_id
        ),
        ARRAY_A
      );
      if (!$profile) {
        throw new InvalidArgumentException('profil-nicht-zugeordnet');
      }

      $existing = $this->wpdb->get_row(
        $this->wpdb->prepare(
          "SELECT * FROM {$this->card_awards_table} WHERE card_id = %d AND student_profile_id = %d LIMIT 1",
          (int) $card['id'],
          (int) $profile['id']
        ),
        ARRAY_A
      );

      $now = current_time('mysql', true);
      if ($existing) {
        $this->assert_db_write_success(
          $this->wpdb->update(
            $this->card_awards_table,
            [
              'note' => $note,
              'status' => 'active',
              'awarded_at' => $now,
              'updated_at' => $now,
            ],
            ['id' => (int) $existing['id']],
            ['%s', '%s', '%s', '%s'],
            ['%d']
          ),
          'Kärtchen konnte nicht neu verliehen werden.'
        );
        $award_id = (int) $existing['id'];
      } else {
        $award_uuid = 'award-' . substr(hash('sha256', $card_uuid . '|' . $app_student_id . '|' . $now), 0, 24);
        $this->assert_db_write_success(
          $this->wpdb->insert(
            $this->card_awards_table,
            [
              'award_uuid' => $award_uuid,
              'card_id' => (int) $card['id'],
              'teacher_id' => $teacher_id,
              'student_profile_id' => (int) $profile['id'],
              'note' => $note,
              'status' => 'active',
              'awarded_at' => $now,
              'created_at' => $now,
              'updated_at' => $now,
            ],
            ['%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s', '%s']
          ),
          'Kärtchen konnte nicht verliehen werden.'
        );
        $award_id = (int) $this->wpdb->insert_id;
      }

      return [
        'awardId' => $award_id,
        'studentId' => $app_student_id,
        'cardId' => $card_uuid,
        'awardedAt' => gmdate('c', strtotime($now)),
      ];
    });
  }

  public function revoke_card_award(array $teacher, array $payload): void {
    $teacher_id = (int) ($teacher['id'] ?? 0);
    $award_id = (int) ($payload['awardId'] ?? 0);
    if ($teacher_id <= 0 || $award_id <= 0) {
      throw new InvalidArgumentException('ungueltige-vergabe');
    }

    $this->assert_db_write_success(
      $this->wpdb->delete(
        $this->card_awards_table,
        ['id' => $award_id, 'teacher_id' => $teacher_id],
        ['%d', '%d']
      ),
      'Verliehenes Kärtchen konnte nicht entfernt werden.'
    );
  }

  public function sync_teacher_roster(array $teacher, array $payload): array {
    return $this->run_in_transaction(function () use ($teacher, $payload): array {
      $teacher_id = (int) $teacher['id'];
      $classes = is_array($payload['classes'] ?? null) ? $payload['classes'] : [];
      $students = is_array($payload['students'] ?? null) ? $payload['students'] : [];
      $categories = $this->normalize_practice_categories($payload['categories'] ?? self::DEFAULT_PRACTICE_CATEGORIES);
      $class_uuid_to_id = [];
      $incoming_profile_ids = [];

      $this->update_settings([
        'practice_categories' => $categories,
      ]);

      foreach ($classes as $class) {
        if (!is_array($class)) {
          continue;
        }

        $class_uuid = sanitize_text_field((string) ($class['id'] ?? ''));
        $class_name = sanitize_text_field((string) ($class['name'] ?? ''));
        if ($class_uuid === '' || $class_name === '') {
          continue;
        }

        $existing_class_id = (int) $this->wpdb->get_var(
          $this->wpdb->prepare("SELECT id FROM {$this->classes_table} WHERE class_uuid = %s", $class_uuid)
        );
        if ($existing_class_id) {
          $this->assert_db_write_success(
            $this->wpdb->update(
              $this->classes_table,
              [
                'class_name' => $class_name,
                'teacher_id' => $teacher_id,
                'status' => 'active',
                'updated_at' => current_time('mysql', true),
              ],
              ['id' => $existing_class_id],
              ['%s', '%d', '%s', '%s'],
              ['%d']
            ),
            'Klasse konnte nicht aktualisiert werden.'
          );
          $class_uuid_to_id[$class_uuid] = $existing_class_id;
          continue;
        }

        $this->create_class([
          'class_uuid' => $class_uuid,
          'class_name' => $class_name,
          'teacher_id' => $teacher_id,
          'status' => 'active',
        ]);
        $class_uuid_to_id[$class_uuid] = (int) $this->wpdb->insert_id;
      }

      foreach ($students as $student) {
        if (!is_array($student)) {
          continue;
        }

        $app_student_id = sanitize_text_field((string) ($student['studentId'] ?? ''));
        if ($app_student_id === '') {
          continue;
        }

        $student_uuid = sanitize_text_field((string) ($student['studentUuid'] ?? '')) ?: 'student-' . $app_student_id;
        $profile_uuid = sanitize_text_field((string) ($student['profileUuid'] ?? '')) ?: 'profile-' . $app_student_id;
        $class_uuid = sanitize_text_field((string) ($student['classId'] ?? ''));
        $class_id = $class_uuid !== '' && isset($class_uuid_to_id[$class_uuid]) ? (int) $class_uuid_to_id[$class_uuid] : null;
        $display_name = sanitize_text_field((string) ($student['importedDisplayName'] ?? '')) ?: sanitize_text_field((string) trim(($student['firstName'] ?? '') . ' ' . ($student['lastName'] ?? '')));
        $instrument = sanitize_text_field((string) ($student['importedInstrument'] ?? '')) ?: 'Instrument';
        $profile_label = sanitize_text_field((string) ($student['profileLabel'] ?? '')) ?: $instrument;

        $student_row = $this->wpdb->get_row(
          $this->wpdb->prepare("SELECT * FROM {$this->students_table} WHERE student_uuid = %s", $student_uuid),
          ARRAY_A
        );

        if ($student_row) {
          $this->update_student((int) $student_row['id'], [
            'external_student_id' => $student['externalStudentId'] ?? '',
            'first_name' => $student['firstName'] ?? '',
            'last_name' => $student['lastName'] ?? '',
            'email' => $student['email'] ?? '',
            'messenger_id' => $student['messengerId'] ?? '',
            'display_name' => $display_name ?: ($student_row['display_name'] ?? 'Unbekannt'),
            'status' => 'active',
          ]);
          $student_id = (int) $student_row['id'];
        } else {
          $this->create_student([
            'student_uuid' => $student_uuid,
            'external_student_id' => $student['externalStudentId'] ?? '',
            'first_name' => $student['firstName'] ?? '',
            'last_name' => $student['lastName'] ?? '',
            'email' => $student['email'] ?? '',
            'messenger_id' => $student['messengerId'] ?? '',
            'display_name' => $display_name ?: 'Unbekannt',
            'status' => 'active',
          ]);
          $student_id = (int) $this->wpdb->insert_id;
        }

        $profile_row = $this->wpdb->get_row(
          $this->wpdb->prepare("SELECT * FROM {$this->profiles_table} WHERE app_student_id = %s", $app_student_id),
          ARRAY_A
        );

        if ($profile_row) {
          $this->update_profile((int) $profile_row['id'], [
            'student_id' => $student_id,
            'class_id' => $class_id,
            'instrument' => $instrument,
            'profile_label' => $profile_label,
            'goal_minutes' => max(5, (int) ($student['importedGoal'] ?? 15)),
            'status' => 'active',
          ]);
          $profile_id = (int) $profile_row['id'];
        } else {
          $this->create_profile([
            'profile_uuid' => $profile_uuid,
            'student_id' => $student_id,
            'class_id' => $class_id,
            'instrument' => $instrument,
            'profile_label' => $profile_label,
            'goal_minutes' => max(5, (int) ($student['importedGoal'] ?? 15)),
            'app_student_id' => $app_student_id,
            'status' => 'active',
          ]);
          $profile_id = (int) $this->wpdb->insert_id;
        }

        $incoming_profile_ids[] = $profile_id;
        $this->save_assignment([
          'teacher_id' => $teacher_id,
          'student_profile_id' => $profile_id,
          'role_label' => 'Lehrkraft',
          'is_primary' => true,
        ]);
      }

      $assigned_profiles = $this->wpdb->get_results(
        $this->wpdb->prepare("SELECT student_profile_id FROM {$this->assignments_table} WHERE teacher_id = %d", $teacher_id),
        ARRAY_A
      );
      foreach ($assigned_profiles as $assigned_profile) {
        $profile_id = (int) ($assigned_profile['student_profile_id'] ?? 0);
        if ($profile_id && !in_array($profile_id, $incoming_profile_ids, true)) {
          $this->assert_db_write_success(
            $this->wpdb->delete($this->assignments_table, [
              'teacher_id' => $teacher_id,
              'student_profile_id' => $profile_id,
            ], ['%d', '%d']),
            'Lehrkraft-Zuordnung konnte nicht entfernt werden.'
          );
        }
      }

      return [
        'classCount' => count($class_uuid_to_id),
        'studentCount' => count($incoming_profile_ids),
        'categoryCount' => count($categories),
        'savedAt' => gmdate('c'),
      ];
    });
  }

  public function sync_teacher_cards(array $teacher, array $cards): array {
    return $this->run_in_transaction(function () use ($teacher, $cards): array {
      $teacher_id = (int) $teacher['id'];
      $incoming_ids = [];
      $now = current_time('mysql', true);

      foreach ($cards as $card) {
        if (!is_array($card)) {
          continue;
        }

        $requested_card_uuid = sanitize_text_field((string) ($card['id'] ?? $card['cardUuid'] ?? ''));
        if ($requested_card_uuid === '') {
          continue;
        }

        $card_uuid = $requested_card_uuid;
        $existing = $this->wpdb->get_row(
          $this->wpdb->prepare(
            "SELECT id, created_at FROM {$this->cards_table} WHERE card_uuid = %s AND teacher_id = %d",
            $card_uuid,
            $teacher_id
          ),
          ARRAY_A
        );
        if (!$existing) {
          $existing_foreign = $this->wpdb->get_row(
            $this->wpdb->prepare(
              "SELECT id, teacher_id FROM {$this->cards_table} WHERE card_uuid = %s LIMIT 1",
              $card_uuid
            ),
            ARRAY_A
          );

          if ($existing_foreign && (int) ($existing_foreign['teacher_id'] ?? 0) !== $teacher_id) {
            $card_uuid = $this->build_scoped_card_uuid($teacher_id, $requested_card_uuid);
            $existing = $this->wpdb->get_row(
              $this->wpdb->prepare(
                "SELECT id, created_at FROM {$this->cards_table} WHERE card_uuid = %s AND teacher_id = %d",
                $card_uuid,
                $teacher_id
              ),
              ARRAY_A
            );
          }
        }

        $incoming_ids[] = $card_uuid;

        $rule = is_array($card['rule'] ?? null) ? $card['rule'] : [];
        $assignment = is_array($card['assignment'] ?? null) ? $card['assignment'] : [];
        $rule_type = sanitize_text_field((string) ($rule['type'] ?? 'entriesCountAtLeast'));
        $assignment_type = sanitize_text_field((string) ($assignment['type'] ?? 'all'));
        if (!in_array($assignment_type, ['all', 'class', 'student'], true)) {
          $assignment_type = 'all';
        }
        $payload = [
          'teacher_id' => $teacher_id,
          'title' => sanitize_text_field((string) ($card['title'] ?? 'Neues Kärtchen')),
          'description' => sanitize_text_field((string) ($card['description'] ?? '')),
          'rule_type' => $rule_type,
          'rule_value' => $rule_type === 'none'
            ? 0
            : max(1, (int) ($rule['value'] ?? 1)),
          'rule_meta' => $this->encode_rule_meta([
            'category' => sanitize_text_field((string) ($rule['category'] ?? '')),
          ]),
          'assignment_type' => $assignment_type,
          'assignment_target' => sanitize_text_field((string) ($assignment['targetId'] ?? '')),
          'accent' => sanitize_text_field((string) ($card['accent'] ?? 'gold')),
          'symbol' => sanitize_text_field((string) ($card['symbol'] ?? '✦')),
          'rarity' => sanitize_text_field((string) ($card['rarity'] ?? 'Basis')),
          'status' => sanitize_text_field((string) ($card['status'] ?? 'active')) === 'inactive' ? 'inactive' : 'active',
          'updated_at' => $now,
        ];

        if ($existing) {
          $this->assert_db_write_success(
            $this->wpdb->update(
              $this->cards_table,
              $payload,
              ['id' => (int) $existing['id']],
              ['%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s'],
              ['%d']
            ),
            'Kärtchen konnte nicht aktualisiert werden.'
          );
          continue;
        }

        $this->assert_db_write_success(
          $this->wpdb->insert(
            $this->cards_table,
            [
              'card_uuid' => $card_uuid,
              'teacher_id' => $teacher_id,
              'title' => $payload['title'],
              'description' => $payload['description'],
              'rule_type' => $payload['rule_type'],
              'rule_value' => $payload['rule_value'],
              'rule_meta' => $payload['rule_meta'],
              'assignment_type' => $payload['assignment_type'],
              'assignment_target' => $payload['assignment_target'],
              'accent' => $payload['accent'],
              'symbol' => $payload['symbol'],
              'rarity' => $payload['rarity'],
              'status' => $payload['status'],
              'created_at' => $now,
              'updated_at' => $now,
            ],
            ['%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
          ),
          'Kärtchen konnte nicht angelegt werden.'
        );
      }

      $incoming_ids = array_values(array_unique($incoming_ids));
      $stale_card_ids = [];

      if ($incoming_ids) {
        $placeholders = implode(',', array_fill(0, count($incoming_ids), '%s'));
        $stale_card_ids = $this->wpdb->get_col(
          $this->wpdb->prepare(
            "SELECT id
             FROM {$this->cards_table}
             WHERE teacher_id = %d AND card_uuid NOT IN ($placeholders)",
            array_merge([$teacher_id], $incoming_ids)
          )
        ) ?: [];
      } else {
        $stale_card_ids = $this->wpdb->get_col(
          $this->wpdb->prepare(
            "SELECT id
             FROM {$this->cards_table}
             WHERE teacher_id = %d",
            $teacher_id
          )
        ) ?: [];
      }

      $stale_card_ids = array_values(array_filter(array_map('intval', $stale_card_ids)));
      if ($stale_card_ids) {
        $stale_placeholders = implode(',', array_fill(0, count($stale_card_ids), '%d'));
        $delete_awards_query = $this->wpdb->prepare(
          "DELETE FROM {$this->card_awards_table} WHERE card_id IN ($stale_placeholders)",
          $stale_card_ids
        );
        $this->assert_db_write_success(
          $this->wpdb->query($delete_awards_query),
          'Veraltete Kärtchen-Verleihungen konnten nicht entfernt werden.'
        );

        $delete_cards_query = $this->wpdb->prepare(
          "DELETE FROM {$this->cards_table} WHERE id IN ($stale_placeholders)",
          $stale_card_ids
        );
        $this->assert_db_write_success(
          $this->wpdb->query($delete_cards_query),
          'Veraltete Kärtchen konnten nicht entfernt werden.'
        );
      }

      return [
        'count' => count($incoming_ids),
        'savedAt' => gmdate('c'),
      ];
    });
  }

  public function store_report(array $payload, array $profile): array {
    $student = $this->get_student((int) $profile['student_id']);
    $report_uuid = !empty($payload['reportUuid'])
      ? sanitize_text_field($payload['reportUuid'])
      : $this->build_report_uuid($payload);
    $checksum = sanitize_text_field($payload['checksum']);
    $existing = $this->wpdb->get_row(
      $this->wpdb->prepare("SELECT * FROM {$this->reports_table} WHERE report_uuid = %s OR (student_profile_id = %d AND checksum = %s)", $report_uuid, (int) $profile['id'], $checksum),
      ARRAY_A
    );

    if ($existing) {
      return [
        'created' => false,
        'duplicate' => true,
        'report_uuid' => $existing['report_uuid'],
      ];
    }

    $report = $payload['report'] ?? [];
    $entries = is_array($report['entries'] ?? null) ? $report['entries'] : [];
    $exported_at = !empty($payload['exportedAt']) ? gmdate('Y-m-d H:i:s', strtotime((string) $payload['exportedAt'])) : current_time('mysql', true);
    $received_at = current_time('mysql', true);

    $this->wpdb->insert(
      $this->reports_table,
      [
        'report_uuid' => $report_uuid,
        'student_profile_id' => (int) $profile['id'],
        'student_uuid' => $student['student_uuid'] ?? '',
        'app_student_id' => $profile['app_student_id'],
        'checksum' => $checksum,
        'payload_json' => wp_json_encode($payload),
        'report_range' => sanitize_text_field($report['range'] ?? 'week'),
        'report_label' => sanitize_text_field($report['label'] ?? ''),
        'report_minutes' => (int) ($report['minutes'] ?? 0),
        'report_streak' => (int) ($report['streak'] ?? 0),
        'entries_count' => count($entries),
        'exported_at' => $exported_at,
        'received_at' => $received_at,
        'app_version' => sanitize_text_field($payload['appVersion'] ?? ''),
        'status' => 'active',
      ],
      ['%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s', '%s', '%s']
    );

    return [
      'created' => true,
      'duplicate' => false,
      'report_uuid' => $report_uuid,
    ];
  }

  public function get_feedback_ballot_by_token(string $ballot_token): ?array {
    $token = sanitize_text_field($ballot_token);
    if ($token === '') {
      return null;
    }

    $ballot = $this->wpdb->get_row(
      $this->wpdb->prepare("SELECT * FROM {$this->feedback_ballots_table} WHERE ballot_token = %s LIMIT 1", $token),
      ARRAY_A
    );

    return $ballot ?: null;
  }

  public function get_feedback_questions(int $round_id): array {
    return $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT *
         FROM {$this->feedback_questions_table}
         WHERE round_id = %d
         ORDER BY position ASC, id ASC",
        $round_id
      ),
      ARRAY_A
    ) ?: [];
  }

  public function get_or_create_feedback_ballot(int $round_id, int $profile_id): array {
    $existing = $this->wpdb->get_row(
      $this->wpdb->prepare(
        "SELECT *
         FROM {$this->feedback_ballots_table}
         WHERE round_id = %d AND profile_id = %d
         LIMIT 1",
        $round_id,
        $profile_id
      ),
      ARRAY_A
    );

    if ($existing) {
      return $existing;
    }

    $now = current_time('mysql', true);
    $token = $this->generate_token('fbt');
    $this->assert_db_write_success(
      $this->wpdb->insert(
        $this->feedback_ballots_table,
        [
          'round_id' => $round_id,
          'profile_id' => $profile_id,
          'ballot_token' => $token,
          'status' => 'open',
          'issued_at' => $now,
          'used_at' => null,
          'created_at' => $now,
          'updated_at' => $now,
        ],
        ['%d', '%d', '%s', '%s', '%s', '%s', '%s', '%s']
      ),
      'Feedback-Token konnte nicht angelegt werden.'
    );

    return $this->wpdb->get_row(
      $this->wpdb->prepare("SELECT * FROM {$this->feedback_ballots_table} WHERE id = %d", (int) $this->wpdb->insert_id),
      ARRAY_A
    ) ?: [];
  }

  public function get_active_feedback_round_for_profile(array $profile): ?array {
    $teacher_id = $this->get_primary_teacher_id_for_profile((int) ($profile['id'] ?? 0));
    if (!$teacher_id) {
      return null;
    }

    $round = $this->wpdb->get_row(
      $this->wpdb->prepare(
        "SELECT *
         FROM {$this->feedback_rounds_table}
         WHERE teacher_id = %d
           AND status = 'active'
           AND starts_at <= UTC_TIMESTAMP()
           AND ends_at >= UTC_TIMESTAMP()
         ORDER BY starts_at DESC, id DESC
         LIMIT 1",
        $teacher_id
      ),
      ARRAY_A
    );

    if (!$round) {
      return null;
    }

    $questions = $this->get_feedback_questions((int) $round['id']);
    if (!$questions) {
      return null;
    }

    $ballot = $this->get_or_create_feedback_ballot((int) $round['id'], (int) $profile['id']);

    return [
      'roundId' => (int) $round['id'],
      'title' => $round['title'],
      'introText' => $round['intro_text'],
      'alreadyAnswered' => ($ballot['status'] ?? '') !== 'open',
      'ballotToken' => ($ballot['status'] ?? '') === 'open' ? $ballot['ballot_token'] : '',
      'questions' => array_map(
        static fn(array $question): array => [
          'id' => (int) $question['id'],
          'key' => $question['question_key'],
          'label' => $question['label'],
          'type' => $question['type'],
          'required' => !empty($question['is_required']),
        ],
        $questions
      ),
    ];
  }

  public function store_feedback_response(string $ballot_token, int $round_id, array $answers): array {
    return $this->run_in_transaction(function () use ($ballot_token, $round_id, $answers): array {
      $ballot = $this->get_feedback_ballot_by_token($ballot_token);
      if (!$ballot) {
        throw new InvalidArgumentException('ungueltiger-feedback-token');
      }

      if ((int) ($ballot['round_id'] ?? 0) !== $round_id) {
        throw new InvalidArgumentException('feedback-runde-passt-nicht-zum-token');
      }

      if (($ballot['status'] ?? '') !== 'open') {
        throw new InvalidArgumentException('feedback-bereits-abgegeben');
      }

      $questions = $this->get_feedback_questions($round_id);
      if (!$questions) {
        throw new InvalidArgumentException('feedback-runde-nicht-verfuegbar');
      }

      $question_map = [];
      foreach ($questions as $question) {
        $question_map[(int) $question['id']] = $question;
      }

      $normalized_answers = [];
      foreach ($answers as $answer) {
        $question_id = (int) ($answer['questionId'] ?? $answer['question_id'] ?? 0);
        $value = (int) ($answer['value'] ?? 0);
        if (!$question_id || !isset($question_map[$question_id])) {
          throw new InvalidArgumentException('feedback-frage-unbekannt');
        }
        if ($value < 1 || $value > 5) {
          throw new InvalidArgumentException('feedback-wert-ungueltig');
        }
        $normalized_answers[$question_id] = $value;
      }

      foreach ($question_map as $question_id => $question) {
        if (!empty($question['is_required']) && !array_key_exists($question_id, $normalized_answers)) {
          throw new InvalidArgumentException('feedback-unvollstaendig');
        }
      }

      $now = current_time('mysql', true);
      foreach ($normalized_answers as $question_id => $value) {
        $this->assert_db_write_success(
          $this->wpdb->insert(
            $this->feedback_answers_table,
            [
              'round_id' => $round_id,
              'question_id' => $question_id,
              'ballot_id' => (int) $ballot['id'],
              'answer_value' => $value,
              'submitted_at' => $now,
              'created_at' => $now,
            ],
            ['%d', '%d', '%d', '%d', '%s', '%s']
          ),
          'Feedback-Antwort konnte nicht gespeichert werden.'
        );
      }

      $this->assert_db_write_success(
        $this->wpdb->update(
          $this->feedback_ballots_table,
          [
            'status' => 'used',
            'used_at' => $now,
            'updated_at' => $now,
          ],
          ['id' => (int) $ballot['id']],
          ['%s', '%s', '%s'],
          ['%d']
        ),
        'Feedback-Token konnte nicht abgeschlossen werden.'
      );

      return [
        'roundId' => $round_id,
        'submittedAt' => gmdate('c', strtotime($now)),
      ];
    });
  }

  public function get_teacher_feedback_rounds(array $teacher): array {
    $teacher_id = (int) ($teacher['id'] ?? 0);
    if (!$teacher_id) {
      return [];
    }

    $rounds = $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT *
         FROM {$this->feedback_rounds_table}
         WHERE teacher_id = %d
         ORDER BY starts_at DESC, id DESC",
        $teacher_id
      ),
      ARRAY_A
    );

    return $this->build_feedback_round_payloads($rounds);
  }

  public function create_feedback_round(array $data): int {
    $teacher_id = (int) ($data['teacher_id'] ?? 0);
    if ($teacher_id <= 0) {
      throw new InvalidArgumentException('ungueltige-lehrkraft');
    }

    $teacher = $this->get_teacher($teacher_id);
    if (!$teacher) {
      throw new InvalidArgumentException('ungueltige-lehrkraft');
    }

    $title = sanitize_text_field((string) ($data['title'] ?? ''));
    if ($title === '') {
      throw new InvalidArgumentException('feedback-titel-fehlt');
    }

    $min_results_count = (int) ($data['min_results_count'] ?? self::DEFAULT_FEEDBACK_MIN_RESULTS);
    $allow_low_anonymity = !empty($data['allow_low_anonymity']);
    if ($min_results_count < 1) {
      $min_results_count = 1;
    }
    if ($min_results_count < 3 && !$allow_low_anonymity) {
      throw new InvalidArgumentException('feedback-minimalwert-bestaetigung-fehlt');
    }
    if (!$allow_low_anonymity) {
      $min_results_count = max(3, $min_results_count);
    }
    $starts_at = !empty($data['starts_at']) ? gmdate('Y-m-d H:i:s', strtotime((string) $data['starts_at'])) : current_time('mysql', true);
    $ends_at = !empty($data['ends_at']) ? gmdate('Y-m-d H:i:s', strtotime((string) $data['ends_at'])) : gmdate('Y-m-d H:i:s', strtotime('+30 days'));
    $status = sanitize_key((string) ($data['status'] ?? 'active'));
    if (!in_array($status, ['draft', 'active', 'closed', 'archived'], true)) {
      $status = 'active';
    }
    if (strtotime($ends_at) < strtotime($starts_at)) {
      throw new InvalidArgumentException('feedback-zeitraum-ungueltig');
    }

    $now = current_time('mysql', true);
    $slug_base = sanitize_title($title);
    $round_slug = $slug_base !== '' ? $slug_base . '-' . $teacher_id . '-' . gmdate('YmdHis') : 'feedback-' . $teacher_id . '-' . gmdate('YmdHis');

    $this->assert_db_write_success(
      $this->wpdb->insert(
        $this->feedback_rounds_table,
        [
          'round_uuid' => $this->generate_uuid('feedback-round'),
          'round_slug' => $round_slug,
          'title' => $title,
          'intro_text' => self::DEFAULT_FEEDBACK_INTRO,
          'status' => $status,
          'teacher_id' => $teacher_id,
          'min_results_count' => $min_results_count,
          'starts_at' => $starts_at,
          'ends_at' => $ends_at,
          'created_at' => $now,
          'updated_at' => $now,
        ],
        ['%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s']
      ),
      'Feedback-Runde konnte nicht angelegt werden.'
    );

    $round_id = (int) $this->wpdb->insert_id;
    $this->insert_feedback_questions_for_round($round_id, $now);
    return $round_id;
  }

  public function delete_feedback_round(int $round_id): void {
    if ($round_id <= 0) {
      return;
    }

    $this->run_in_transaction(function () use ($round_id): void {
      $this->assert_db_write_success(
        $this->wpdb->delete($this->feedback_answers_table, ['round_id' => $round_id], ['%d']),
        'Feedback-Antworten konnten nicht gelöscht werden.'
      );
      $this->assert_db_write_success(
        $this->wpdb->delete($this->feedback_ballots_table, ['round_id' => $round_id], ['%d']),
        'Feedback-Tokens konnten nicht gelöscht werden.'
      );
      $this->assert_db_write_success(
        $this->wpdb->delete($this->feedback_questions_table, ['round_id' => $round_id], ['%d']),
        'Feedback-Fragen konnten nicht gelöscht werden.'
      );
      $this->assert_db_write_success(
        $this->wpdb->delete($this->feedback_rounds_table, ['id' => $round_id], ['%d']),
        'Feedback-Runde konnte nicht gelöscht werden.'
      );
    });
  }

  public function get_feedback_admin_overview(): array {
    $teachers = $this->list_teachers();
    $rounds = $this->wpdb->get_results(
      "SELECT *
       FROM {$this->feedback_rounds_table}
       ORDER BY teacher_id ASC, starts_at DESC, id DESC",
      ARRAY_A
    );
    $rounds_by_teacher = [];
    foreach ($this->build_feedback_round_payloads($rounds) as $round) {
      $rounds_by_teacher[(int) ($round['teacherId'] ?? 0)][] = $round;
    }

    $overview = [];

    foreach ($teachers as $teacher) {
      $teacher_rounds = $rounds_by_teacher[(int) ($teacher['id'] ?? 0)] ?? [];
      if (!$teacher_rounds) {
        continue;
      }

      $overview[] = [
        'teacherId' => (int) ($teacher['id'] ?? 0),
        'teacherName' => $teacher['display_name'] ?? 'Lehrkraft',
        'teacherEmail' => $teacher['email'] ?? '',
        'rounds' => $teacher_rounds,
      ];
    }

    return $overview;
  }

  public function list_reports(array $filters = []): array {
    $where = [];
    $params = [];

    if (!empty($filters['student_id'])) {
      $where[] = 's.id = %d';
      $params[] = (int) $filters['student_id'];
    }

    if (!empty($filters['profile_id'])) {
      $where[] = 'p.id = %d';
      $params[] = (int) $filters['profile_id'];
    }

    if (!empty($filters['class_id'])) {
      $where[] = 'p.class_id = %d';
      $params[] = (int) $filters['class_id'];
    }

    $sql = "SELECT r.*, p.profile_label, p.instrument, p.class_id, c.class_name, s.id AS student_id, s.display_name AS student_display_name
       FROM {$this->reports_table} r
       INNER JOIN {$this->profiles_table} p ON p.id = r.student_profile_id
       INNER JOIN {$this->students_table} s ON s.id = p.student_id
       LEFT JOIN {$this->classes_table} c ON c.id = p.class_id";

    if ($where) {
      $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY r.received_at DESC';

    if ($params) {
      $sql = $this->wpdb->prepare($sql, ...$params);
    }

    return $this->wpdb->get_results($sql, ARRAY_A);
  }

  public function delete_report(int $id): void {
    $this->wpdb->delete($this->reports_table, ['id' => $id], ['%d']);
  }

  public function cleanup_old_reports(int $retention_days): void {
    $cutoff = gmdate('Y-m-d H:i:s', time() - DAY_IN_SECONDS * $retention_days);
    $this->wpdb->query($this->wpdb->prepare("DELETE FROM {$this->reports_table} WHERE exported_at < %s", $cutoff));
  }

  public function build_profile_package(int $profile_id): ?array {
    $profile = $this->get_profile($profile_id);
    if (!$profile) {
      return null;
    }

    return $this->build_profile_package_from_profile($profile);
  }

  private function build_profile_package_from_profile(array $profile): array {
    $settings = $this->get_settings();
    $payload = [
      'kind' => 'fleisstakt-profile-paket',
      'issuedAt' => gmdate('c'),
      'siteLabel' => $settings['site_label'] ?? get_bloginfo('name'),
      'syncBaseUrl' => untrailingslashit($settings['sync_base_url'] ?? trailingslashit(site_url('wp-json/fleisstakt-sync/v1'))),
      'studentUuid' => $profile['student_uuid'],
      'profileUuid' => $profile['profile_uuid'],
      'appStudentId' => $profile['app_student_id'],
      'uploadToken' => $profile['upload_token'],
      'connectCode' => $profile['connect_code'] ?? '',
      'displayName' => $profile['student_display_name'],
      'instrument' => $profile['instrument'],
      'goal' => (int) $profile['goal_minutes'],
      'profileLabel' => $profile['profile_label'],
      'classId' => $profile['class_uuid'] ?? '',
      'className' => $profile['class_name'] ?? '',
    ];

    return [
      ...$payload,
      'checksum' => $this->create_checksum($payload),
    ];
  }

  public function get_student_sync_snapshot(array $profile): array {
    $package = $this->build_profile_package_from_profile($profile);
    $cards = $this->list_cards_for_profile($profile);
    $awards = $this->list_manual_awards_for_profile((int) ($profile['id'] ?? 0));
    $cards = $this->merge_cards_with_awards($cards, $awards);
    $manual_awards_count = count(array_filter($awards, static fn(array $award): bool => ($award['status'] ?? '') === 'active'));
    $categories = $this->get_practice_categories();

    return [
      'profile' => $package,
      'categories' => $categories,
      'activeFeedbackRound' => $this->get_active_feedback_round_for_profile($profile),
      'cards' => array_map(
        function (array $card): array {
          $rule_meta = $this->decode_rule_meta($card['rule_meta'] ?? '');
          return [
          'id' => $card['card_uuid'],
          'title' => $card['title'],
          'description' => $card['description'],
          'accent' => $card['accent'],
          'symbol' => $card['symbol'],
          'rarity' => $card['rarity'],
          'status' => $card['status'],
          'source' => 'teacher',
          'rule' => [
            'type' => $card['rule_type'],
            'value' => (int) $card['rule_value'],
            'category' => $rule_meta['category'] ?? '',
          ],
          'assignment' => [
            'type' => $card['assignment_type'] ?: 'all',
            'targetId' => $card['assignment_target'] ?: '',
          ],
          'ownerScope' => $card['teacher_id'] ? 'teacher' : 'global',
          'award' => !empty($card['award_uuid']) ? [
            'mode' => 'manual',
            'awardId' => (int) ($card['award_id'] ?? 0),
            'note' => $card['award_note'] ?? '',
            'awardedAt' => !empty($card['awarded_at']) ? gmdate('c', strtotime((string) $card['awarded_at'])) : '',
            'awardedBy' => $card['teacher_name'] ?? '',
          ] : null,
          'createdAt' => !empty($card['created_at']) ? gmdate('c', strtotime((string) $card['created_at'])) : '',
          'updatedAt' => !empty($card['updated_at']) ? gmdate('c', strtotime((string) $card['updated_at'])) : '',
          ];
        },
        $cards
      ),
      'statusLine' => 'Synchronisiert mit dem FleißTakt-Server.',
      'lastImportSummary' => $manual_awards_count
        ? sprintf('%d Lehrkräfte-Kärtchen geladen, %d direkt verliehen.', count($cards), $manual_awards_count)
        : sprintf('%d Lehrkräfte-Kärtchen geladen.', count($cards)),
      'fetchedAt' => gmdate('c'),
    ];
  }

  public function get_teacher_sync_snapshot(array $teacher): array {
    $teacher_id = (int) $teacher['id'];
    $classes = $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT DISTINCT c.id, c.class_uuid, c.class_name
         FROM {$this->classes_table} c
         WHERE c.teacher_id = %d
            OR EXISTS (
              SELECT 1
              FROM {$this->profiles_table} p
              INNER JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
              WHERE p.class_id = c.id
                AND a.teacher_id = %d
            )
         ORDER BY c.class_name ASC",
        $teacher_id,
        $teacher_id
      ),
      ARRAY_A
    );

    $profiles = $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT p.*, s.display_name AS student_display_name, s.student_uuid, s.first_name, s.last_name, s.email, s.messenger_id, c.class_uuid, c.class_name
         FROM {$this->profiles_table} p
         INNER JOIN {$this->students_table} s ON s.id = p.student_id
         INNER JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
         LEFT JOIN {$this->classes_table} c ON c.id = p.class_id
         WHERE a.teacher_id = %d
         ORDER BY s.display_name ASC, p.instrument ASC",
        $teacher_id
      ),
      ARRAY_A
    );

    $students = [];
    $teacher_awards = $this->list_card_awards_for_teacher($teacher_id);
    $profile_ids = array_map(static fn(array $profile): int => (int) $profile['id'], $profiles);
    $latest_reports_by_profile = $this->get_latest_reports_for_profiles($profile_ids);
    $recent_reports_by_profile = $this->get_recent_reports_for_profiles($profile_ids, 5);
    $report_counts_by_profile = $this->get_report_counts_for_profiles($profile_ids);
    $awards_by_profile = [];

    foreach ($teacher_awards as $award) {
      $profile_id = (int) ($award['student_profile_id'] ?? 0);
      if (!$profile_id) {
        continue;
      }

      if (!isset($awards_by_profile[$profile_id])) {
        $awards_by_profile[$profile_id] = [];
      }

      $awards_by_profile[$profile_id][] = $award;
    }

    foreach ($profiles as $profile) {
      $profile = $this->ensure_profile_connect_code($profile);
      $profile_id = (int) $profile['id'];
      $latest_report = $latest_reports_by_profile[$profile_id] ?? null;
      $recent_reports = $recent_reports_by_profile[$profile_id] ?? [];
      $reports_received = (int) ($report_counts_by_profile[$profile_id] ?? 0);
      $decoded = $latest_report ? json_decode((string) $latest_report['payload_json'], true) : [];
      $entries = is_array($decoded['report']['entries'] ?? null) ? $decoded['report']['entries'] : [];
      $unlocked_cards = is_array($decoded['report']['unlockedCards'] ?? null) ? $decoded['report']['unlockedCards'] : [];
      $awarded_cards = array_values(array_map(
        fn(array $award): array => [
          'awardId' => (int) ($award['id'] ?? 0),
          'cardId' => $award['card_uuid'] ?? '',
          'title' => $award['title'] ?? '',
          'description' => $award['description'] ?? '',
          'accent' => $award['accent'] ?? 'gold',
          'symbol' => $award['symbol'] ?? '✦',
          'rarity' => $award['rarity'] ?? 'Spezial',
          'note' => $award['note'] ?? '',
          'awardedAt' => !empty($award['awarded_at']) ? gmdate('c', strtotime((string) $award['awarded_at'])) : '',
        ],
        $awards_by_profile[$profile_id] ?? []
      ));
      $students[] = [
        'studentId' => $profile['app_student_id'],
        'profileUuid' => $profile['profile_uuid'],
        'studentUuid' => $profile['student_uuid'],
        'importedDisplayName' => $profile['student_display_name'],
        'importedInstrument' => $profile['instrument'],
        'importedGoal' => (int) $profile['goal_minutes'],
        'profileLabel' => $profile['profile_label'],
        'connectCode' => $profile['connect_code'] ?? '',
        'firstName' => $profile['first_name'] ?? '',
        'lastName' => $profile['last_name'] ?? '',
        'email' => $profile['email'] ?? '',
        'messengerId' => $profile['messenger_id'] ?? '',
        'classId' => $profile['class_uuid'] ?? '',
        'entries' => $entries,
        'latestChecksum' => $latest_report['checksum'] ?? '',
        'latestReportLabel' => $latest_report['report_label'] ?? '',
        'latestReportRange' => $latest_report['report_range'] ?? 'week',
        'latestReportMinutes' => (int) ($latest_report['report_minutes'] ?? 0),
        'latestReportUniqueDaysCount' => (int) ($decoded['report']['uniqueDaysCount'] ?? 0),
        'latestReportNotedCount' => (int) ($decoded['report']['notedCount'] ?? 0),
        'latestReportStreak' => (int) ($latest_report['report_streak'] ?? 0),
        'unlockedCards' => $unlocked_cards,
        'awardedCards' => $awarded_cards,
        'recentReports' => array_values(array_map(function (array $report): array {
          $decoded_report = json_decode((string) ($report['payload_json'] ?? ''), true);
          return [
            'reportUuid' => $report['report_uuid'] ?? '',
            'label' => $report['report_label'] ?? '',
            'range' => $report['report_range'] ?? 'week',
            'minutes' => (int) ($report['report_minutes'] ?? 0),
            'streak' => (int) ($report['report_streak'] ?? 0),
            'uniqueDaysCount' => (int) ($decoded_report['report']['uniqueDaysCount'] ?? 0),
            'notedCount' => (int) ($decoded_report['report']['notedCount'] ?? 0),
            'entriesCount' => (int) ($report['entries_count'] ?? 0),
            'exportedAt' => !empty($report['exported_at']) ? gmdate('c', strtotime((string) $report['exported_at'])) : '',
            'receivedAt' => !empty($report['received_at']) ? gmdate('c', strtotime((string) $report['received_at'])) : '',
          ];
        }, $recent_reports)),
        'reportsReceived' => $reports_received,
        'lastImportedAt' => !empty($latest_report['exported_at']) ? gmdate('c', strtotime((string) $latest_report['exported_at'])) : '',
      ];
    }

    $cards = $this->list_cards_for_teacher($teacher_id);
    $categories = $this->get_practice_categories();

    return [
      'teacher' => [
        'teacherUuid' => $teacher['teacher_uuid'],
        'displayName' => $teacher['display_name'],
      ],
      'categories' => $categories,
      'siteLabel' => $this->get_settings()['site_label'] ?? get_bloginfo('name'),
      'classes' => array_map(
        static fn(array $class): array => [
          'id' => $class['class_uuid'],
          'name' => $class['class_name'],
        ],
        $classes
      ),
      'students' => $students,
      'feedbackRounds' => $this->get_teacher_feedback_rounds($teacher),
      'cardLibrary' => array_map(
        function (array $card): array {
          $rule_meta = $this->decode_rule_meta($card['rule_meta'] ?? '');
          return [
          'id' => $card['card_uuid'],
          'title' => $card['title'],
          'description' => $card['description'],
          'accent' => $card['accent'],
          'symbol' => $card['symbol'],
          'rarity' => $card['rarity'],
          'status' => $card['status'],
          'source' => 'teacher',
          'rule' => [
            'type' => $card['rule_type'],
            'value' => (int) $card['rule_value'],
            'category' => $rule_meta['category'] ?? '',
          ],
          'assignment' => [
            'type' => $card['assignment_type'] ?: 'all',
            'targetId' => $card['assignment_target'] ?: '',
          ],
          'ownerScope' => 'teacher',
          'awardCount' => (int) ($card['award_count'] ?? 0),
          'createdAt' => !empty($card['created_at']) ? gmdate('c', strtotime((string) $card['created_at'])) : '',
          'updatedAt' => !empty($card['updated_at']) ? gmdate('c', strtotime((string) $card['updated_at'])) : '',
          ];
        },
        $cards
      ),
      'lastImportSummary' => sprintf('%d Profile, %d Karten, %d Klassen geladen.', count($students), count($cards), count($classes)),
      'statusLine' => 'Synchronisiert mit dem FleißTakt-Server.',
      'fetchedAt' => gmdate('c'),
    ];
  }

  private function get_latest_reports_for_profiles(array $profile_ids): array {
    $profile_ids = array_values(array_filter(array_map('intval', $profile_ids)));
    if (!$profile_ids) {
      return [];
    }

    $placeholders = implode(',', array_fill(0, count($profile_ids), '%d'));
    $rows = $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT *
         FROM {$this->reports_table}
         WHERE student_profile_id IN ($placeholders)
         ORDER BY student_profile_id ASC, exported_at DESC, received_at DESC, id DESC",
        ...$profile_ids
      ),
      ARRAY_A
    );

    $latest_reports = [];
    foreach ($rows as $row) {
      $profile_id = (int) ($row['student_profile_id'] ?? 0);
      if (!$profile_id || isset($latest_reports[$profile_id])) {
        continue;
      }

      $latest_reports[$profile_id] = $row;
    }

    return $latest_reports;
  }

  private function get_report_counts_for_profiles(array $profile_ids): array {
    $profile_ids = array_values(array_filter(array_map('intval', $profile_ids)));
    if (!$profile_ids) {
      return [];
    }

    $placeholders = implode(',', array_fill(0, count($profile_ids), '%d'));
    $rows = $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT student_profile_id, COUNT(*) AS report_count
         FROM {$this->reports_table}
         WHERE student_profile_id IN ($placeholders)
         GROUP BY student_profile_id",
        ...$profile_ids
      ),
      ARRAY_A
    );

    $counts = [];
    foreach ($rows as $row) {
      $profile_id = (int) ($row['student_profile_id'] ?? 0);
      if (!$profile_id) {
        continue;
      }

      $counts[$profile_id] = (int) ($row['report_count'] ?? 0);
    }

    return $counts;
  }

  private function get_recent_reports_for_profiles(array $profile_ids, int $limit = 5): array {
    $profile_ids = array_values(array_filter(array_map('intval', $profile_ids)));
    if (!$profile_ids) {
      return [];
    }

    $limit = max(1, $limit);
    $placeholders = implode(',', array_fill(0, count($profile_ids), '%d'));
    $rows = $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT *
         FROM {$this->reports_table}
         WHERE student_profile_id IN ($placeholders)
         ORDER BY student_profile_id ASC, exported_at DESC, received_at DESC, id DESC",
        ...$profile_ids
      ),
      ARRAY_A
    );

    $reports = [];
    foreach ($rows as $row) {
      $profile_id = (int) ($row['student_profile_id'] ?? 0);
      if (!$profile_id) {
        continue;
      }

      if (!isset($reports[$profile_id])) {
        $reports[$profile_id] = [];
      }

      if (count($reports[$profile_id]) >= $limit) {
        continue;
      }

      $reports[$profile_id][] = $row;
    }

    return $reports;
  }

  private function list_manual_awards_for_profile(int $profile_id): array {
    return $this->wpdb->get_results(
      $this->wpdb->prepare(
        "SELECT a.id AS award_id, a.award_uuid, a.note AS award_note, a.status, a.awarded_at,
                a.teacher_id, c.card_uuid, c.title, c.description, c.rule_type, c.rule_value, c.rule_meta,
                c.assignment_type, c.assignment_target, c.accent, c.symbol, c.rarity, c.created_at, c.updated_at,
                t.display_name AS teacher_name
         FROM {$this->card_awards_table} a
         INNER JOIN {$this->cards_table} c ON c.id = a.card_id
         LEFT JOIN {$this->teachers_table} t ON t.id = a.teacher_id
         WHERE a.student_profile_id = %d AND a.status = 'active'",
        $profile_id
      ),
      ARRAY_A
    );
  }

  private function merge_cards_with_awards(array $cards, array $awards): array {
    if (!$awards) {
      return $cards;
    }

    $card_map = [];
    foreach ($cards as $card) {
      $card_uuid = sanitize_text_field((string) ($card['card_uuid'] ?? ''));
      if ($card_uuid !== '') {
        $card_map[$card_uuid] = $card;
      }
    }

    foreach ($awards as $award) {
      $card_uuid = sanitize_text_field((string) ($award['card_uuid'] ?? ''));
      if ($card_uuid === '') {
        continue;
      }

      if (isset($card_map[$card_uuid])) {
        $card_map[$card_uuid] = [
          ...$card_map[$card_uuid],
          ...$award,
        ];
        continue;
      }

      $card_map[$card_uuid] = [
        'id' => 0,
        'card_uuid' => $card_uuid,
        'teacher_id' => (int) ($award['teacher_id'] ?? 0),
        'title' => $award['title'] ?? 'Kärtchen',
        'description' => $award['description'] ?? '',
        'rule_type' => $award['rule_type'] ?? 'entriesCountAtLeast',
        'rule_value' => (int) ($award['rule_value'] ?? 1),
        'rule_meta' => $award['rule_meta'] ?? '',
        'assignment_type' => 'student',
        'assignment_target' => '',
        'accent' => $award['accent'] ?? 'gold',
        'symbol' => $award['symbol'] ?? '✦',
        'rarity' => $award['rarity'] ?? 'Spezial',
        'status' => 'active',
        'created_at' => $award['created_at'] ?? '',
        'updated_at' => $award['updated_at'] ?? '',
        'teacher_name' => $award['teacher_name'] ?? '',
        ...$award,
      ];
    }

    return array_values($card_map);
  }

  private function normalize_practice_categories($value): array {
    $items = is_array($value)
      ? $value
      : preg_split('/\r?\n|,/', (string) $value);

    $items = array_values(array_unique(array_filter(array_map(
      static fn($item): string => sanitize_text_field((string) $item),
      is_array($items) ? $items : []
    ))));

    return $items ?: self::DEFAULT_PRACTICE_CATEGORIES;
  }

  private function encode_rule_meta($value): string {
    $payload = is_array($value) ? $value : [];
    $category = sanitize_text_field((string) ($payload['category'] ?? ''));
    if ($category === '') {
      return '';
    }

    return wp_json_encode([
      'category' => $category,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
  }

  private function decode_rule_meta($value): array {
    if (!is_string($value) || $value === '') {
      return [];
    }

    $decoded = json_decode($value, true);
    if (!is_array($decoded)) {
      return [];
    }

    return [
      'category' => sanitize_text_field((string) ($decoded['category'] ?? '')),
    ];
  }

  private function insert_feedback_questions_for_round(int $round_id, string $now): void {
    foreach (self::DEFAULT_FEEDBACK_QUESTIONS as $index => $label) {
      $position = $index + 1;
      $this->assert_db_write_success(
        $this->wpdb->insert(
          $this->feedback_questions_table,
          [
            'round_id' => $round_id,
            'question_uuid' => $this->generate_uuid('feedback-question'),
            'question_key' => 'q' . $position,
            'position' => $position,
            'label' => $label,
            'type' => 'scale5',
            'is_required' => 1,
            'created_at' => $now,
            'updated_at' => $now,
          ],
          ['%d', '%s', '%s', '%d', '%s', '%s', '%d', '%s', '%s']
        ),
        'Feedbackfrage konnte nicht angelegt werden.'
      );
    }
  }

  private function get_primary_teacher_id_for_profile(int $profile_id): int {
    $teacher_id = (int) $this->wpdb->get_var(
      $this->wpdb->prepare(
        "SELECT teacher_id
         FROM {$this->assignments_table}
         WHERE student_profile_id = %d
         ORDER BY is_primary DESC, id ASC
         LIMIT 1",
        $profile_id
      )
    );

    if ($teacher_id > 0) {
      return $teacher_id;
    }

    $active_teacher_ids = array_values(array_filter(array_map(
      static fn(array $teacher): int => (int) ($teacher['id'] ?? 0),
      $this->wpdb->get_results("SELECT id FROM {$this->teachers_table} WHERE status = 'active' ORDER BY id ASC", ARRAY_A) ?: []
    )));

    return count($active_teacher_ids) === 1 ? (int) $active_teacher_ids[0] : 0;
  }

  private function build_feedback_round_payloads(array $rounds): array {
    if (!$rounds) {
      return [];
    }

    $round_ids = array_values(array_unique(array_map(static fn(array $round): int => (int) ($round['id'] ?? 0), $rounds)));
    $teacher_ids = array_values(array_unique(array_map(static fn(array $round): int => (int) ($round['teacher_id'] ?? 0), $rounds)));
    $round_id_list = implode(',', array_map('intval', array_filter($round_ids)));
    $teacher_id_list = implode(',', array_map('intval', array_filter($teacher_ids)));

    $questions_by_round = [];
    if ($round_id_list !== '') {
      $question_rows = $this->wpdb->get_results(
        "SELECT *
         FROM {$this->feedback_questions_table}
         WHERE round_id IN ($round_id_list)
         ORDER BY round_id ASC, position ASC, id ASC",
        ARRAY_A
      ) ?: [];
      foreach ($question_rows as $question) {
        $questions_by_round[(int) ($question['round_id'] ?? 0)][] = $question;
      }
    }

    $eligible_counts = [];
    if ($teacher_id_list !== '') {
      $eligible_rows = $this->wpdb->get_results(
        "SELECT a.teacher_id, COUNT(DISTINCT p.id) AS eligible_count
         FROM {$this->profiles_table} p
         INNER JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
         WHERE a.teacher_id IN ($teacher_id_list)
         GROUP BY a.teacher_id",
        ARRAY_A
      ) ?: [];
      foreach ($eligible_rows as $row) {
        $eligible_counts[(int) ($row['teacher_id'] ?? 0)] = (int) ($row['eligible_count'] ?? 0);
      }
    }

    $response_counts = [];
    $answer_distribution = [];
    if ($round_id_list !== '') {
      $response_rows = $this->wpdb->get_results(
        "SELECT round_id, COUNT(*) AS response_count
         FROM {$this->feedback_ballots_table}
         WHERE round_id IN ($round_id_list) AND status = 'used'
         GROUP BY round_id",
        ARRAY_A
      ) ?: [];
      foreach ($response_rows as $row) {
        $response_counts[(int) ($row['round_id'] ?? 0)] = (int) ($row['response_count'] ?? 0);
      }

      $distribution_rows = $this->wpdb->get_results(
        "SELECT round_id, question_id, answer_value, COUNT(*) AS amount
         FROM {$this->feedback_answers_table}
         WHERE round_id IN ($round_id_list)
         GROUP BY round_id, question_id, answer_value",
        ARRAY_A
      ) ?: [];
      foreach ($distribution_rows as $row) {
        $round_id = (int) ($row['round_id'] ?? 0);
        $question_id = (int) ($row['question_id'] ?? 0);
        $value = (int) ($row['answer_value'] ?? 0);
        if ($round_id <= 0 || $question_id <= 0 || $value < 1 || $value > 5) {
          continue;
        }
        $answer_distribution[$round_id][$question_id][$value] = (int) ($row['amount'] ?? 0);
      }
    }

    $payloads = [];
    foreach ($rounds as $round) {
      $round_id = (int) ($round['id'] ?? 0);
      $teacher_id = (int) ($round['teacher_id'] ?? 0);
      $questions = $questions_by_round[$round_id] ?? [];
      $eligible_count = $eligible_counts[$teacher_id] ?? 0;
      $response_count = $response_counts[$round_id] ?? 0;
      $min_results_count = max(1, (int) ($round['min_results_count'] ?? self::DEFAULT_FEEDBACK_MIN_RESULTS));
      $results_visible = $response_count >= $min_results_count;

      $question_payloads = [];
      $overall_sum = 0.0;
      $overall_count = 0;
      foreach ($questions as $question) {
        $question_id = (int) ($question['id'] ?? 0);
        $distribution = ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0];
        $count = 0;
        $sum = 0.0;
        foreach ([1, 2, 3, 4, 5] as $value) {
          $amount = (int) ($answer_distribution[$round_id][$question_id][$value] ?? 0);
          $distribution[(string) $value] = $amount;
          $count += $amount;
          $sum += $value * $amount;
        }

        $average = $count ? round($sum / $count, 1) : 0.0;
        if ($count) {
          $overall_sum += $sum;
          $overall_count += $count;
        }

        $question_payloads[] = [
          'questionId' => $question_id,
          'key' => $question['question_key'],
          'label' => $question['label'],
          'count' => $count,
          'average' => $average,
          'distribution' => $distribution,
        ];
      }

      $payloads[] = [
        'teacherId' => $teacher_id,
        'roundId' => $round_id,
        'title' => $round['title'],
        'status' => $round['status'],
        'eligibleCount' => $eligible_count,
        'responseCount' => $response_count,
        'minResultsCount' => $min_results_count,
        'resultsVisible' => $results_visible,
        'startsAt' => !empty($round['starts_at']) ? gmdate('c', strtotime((string) $round['starts_at'])) : '',
        'endsAt' => !empty($round['ends_at']) ? gmdate('c', strtotime((string) $round['ends_at'])) : '',
        'questions' => $question_payloads,
        'summary' => [
          'overallAverage' => $overall_count ? round($overall_sum / $overall_count, 1) : 0.0,
        ],
      ];
    }

    return $payloads;
  }

  private function get_feedback_eligible_count(int $round_id, int $teacher_id): int {
    return (int) $this->wpdb->get_var(
      $this->wpdb->prepare(
        "SELECT COUNT(DISTINCT p.id)
         FROM {$this->profiles_table} p
         INNER JOIN {$this->assignments_table} a ON a.student_profile_id = p.id
         WHERE a.teacher_id = %d
           AND EXISTS (
             SELECT 1
             FROM {$this->feedback_rounds_table} fr
             WHERE fr.id = %d
               AND fr.teacher_id = a.teacher_id
           )",
        $teacher_id,
        $round_id
      )
    );
  }

  public function create_checksum(array $payload): string {
    $normalized = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $hash = 2166136261;
    $length = strlen($normalized);

    for ($i = 0; $i < $length; $i++) {
      $hash ^= ord($normalized[$i]);
      $hash = ($hash * 16777619) & 0xffffffff;
    }

    return 'ft-' . str_pad(dechex($hash), 8, '0', STR_PAD_LEFT);
  }

  private function run_in_transaction(callable $callback): mixed {
    $this->assert_db_write_success(
      $this->wpdb->query('START TRANSACTION'),
      'Datenbank-Transaktion konnte nicht gestartet werden.'
    );
    $this->is_in_transaction = true;

    try {
      $result = $callback();
      $this->assert_db_write_success(
        $this->wpdb->query('COMMIT'),
        'Datenbank-Transaktion konnte nicht abgeschlossen werden.'
      );
      $this->is_in_transaction = false;
      return $result;
    } catch (Throwable $exception) {
      $this->wpdb->query('ROLLBACK');
      $this->is_in_transaction = false;
      throw $exception;
    }
  }

  private function assert_db_write_success($result, string $message): void {
    if ($result === false || ($this->is_in_transaction && $this->wpdb->last_error !== '')) {
      $details = $this->wpdb->last_error !== '' ? ' ' . $this->wpdb->last_error : '';
      throw new RuntimeException($message . $details);
    }
  }

  private function build_report_uuid(array $payload): string {
    $base = implode('|', [
      (string) ($payload['checksum'] ?? ''),
      (string) ($payload['student']['studentId'] ?? ''),
      (string) ($payload['exportedAt'] ?? ''),
    ]);

    return 'report-' . substr(hash('sha256', $base), 0, 24);
  }

  private function build_scoped_card_uuid(int $teacher_id, string $card_uuid): string {
    $normalized = sanitize_key($card_uuid);
    if ($normalized === '') {
      $normalized = 'karte';
    }

    return 'teacher-' . $teacher_id . '-' . $normalized;
  }

  private function generate_uuid(string $prefix): string {
    return sanitize_key($prefix) . '-' . wp_generate_uuid4();
  }

  private function generate_token(string $prefix): string {
    return sanitize_key($prefix) . '-' . wp_generate_password(32, false, false);
  }

  private function insert_backup_row(string $table, array $row, array $formats): void {
    $sanitized = [];
    foreach ($row as $key => $value) {
      $sanitized[$key] = $value === null ? null : (string) $value;
    }

    foreach (['id', 'wp_user_id', 'student_id', 'class_id', 'teacher_id', 'student_profile_id', 'card_id', 'rule_value', 'goal_minutes', 'report_minutes', 'report_streak', 'entries_count', 'is_primary', 'round_id', 'profile_id', 'position', 'is_required', 'min_results_count', 'question_id', 'ballot_id', 'answer_value'] as $int_key) {
      if (array_key_exists($int_key, $row) && $row[$int_key] !== null && $row[$int_key] !== '') {
        $sanitized[$int_key] = (int) $row[$int_key];
      }
    }

    if (!$this->wpdb->insert($table, $sanitized, $formats)) {
      throw new RuntimeException('backup-import-fehlgeschlagen');
    }
  }

  private function ensure_profile_connect_code(array $profile): array {
    if (!empty($profile['connect_code'])) {
      return $profile;
    }

    $next_code = $this->generate_connection_code();
    $this->wpdb->update(
      $this->profiles_table,
      [
        'connect_code' => $next_code,
        'updated_at' => current_time('mysql', true),
      ],
      ['id' => (int) $profile['id']],
      ['%s', '%s'],
      ['%d']
    );
    $profile['connect_code'] = $next_code;
    return $profile;
  }

  private function generate_connection_code(): string {
    return str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
  }
}

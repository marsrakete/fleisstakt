<?php

if (!defined('ABSPATH')) {
  exit;
}

class FleissTakt_Sync_Bridge_Rest {
  private FleissTakt_Sync_Bridge_Repository $repository;

  public function __construct(FleissTakt_Sync_Bridge_Repository $repository) {
    $this->repository = $repository;
    add_filter('rest_pre_serve_request', [$this, 'send_cors_headers'], 10, 4);
  }

  public function register_routes(): void {
    register_rest_route('fleisstakt-sync/v1', '/report', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'receive_report'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/student-sync', [
      'methods' => WP_REST_Server::READABLE,
      'callback' => [$this, 'student_sync'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/connect-profile', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'connect_profile'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/teacher-sync', [
      'methods' => WP_REST_Server::READABLE,
      'callback' => [$this, 'teacher_sync'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/teacher-profile-package', [
      'methods' => WP_REST_Server::READABLE,
      'callback' => [$this, 'teacher_profile_package'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/profile-package', [
      'methods' => WP_REST_Server::READABLE,
      'callback' => [$this, 'public_profile_package'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/teacher-cards', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'save_teacher_cards'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/teacher-card-awards', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'save_teacher_card_award'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/teacher-roster', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'save_teacher_roster'],
      'permission_callback' => '__return_true',
    ]);

    register_rest_route('fleisstakt-sync/v1', '/feedback-response', [
      'methods' => WP_REST_Server::CREATABLE,
      'callback' => [$this, 'submit_feedback_response'],
      'permission_callback' => '__return_true',
    ]);
  }

  public function receive_report(WP_REST_Request $request): WP_REST_Response {
    $content_type = (string) $request->get_header('content-type');
    if (stripos($content_type, 'application/json') === false) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Nur application/json ist erlaubt.',
      ], 415);
    }

    $upload_token = sanitize_text_field((string) $request->get_header('x-fleisstakt-upload-token'));
    if (!$upload_token) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Upload-Token fehlt.',
      ], 401);
    }

    $profile = $this->repository->get_profile_by_upload_token($upload_token);
    if (!$profile) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Ungültiges Upload-Token.',
      ], 403);
    }

    $payload = $request->get_json_params();
    if (!is_array($payload) || ($payload['kind'] ?? '') !== 'fleisstakt-berichtspaket') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Ungültiges Berichtspaket.',
      ], 400);
    }

    $checksum = sanitize_text_field((string) ($payload['checksum'] ?? ''));
    $expected_checksum_payload = $payload;
    unset($expected_checksum_payload['checksum']);
    $expected_checksum = $this->repository->create_checksum($expected_checksum_payload);
    if (!$checksum || !hash_equals($expected_checksum, $checksum)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Prüfsumme ungültig.',
      ], 400);
    }

    if (($payload['student']['studentId'] ?? '') !== $profile['app_student_id']) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Bericht gehört nicht zu diesem Profil.',
      ], 409);
    }

    $stored = $this->repository->store_report($payload, $profile);
    return new WP_REST_Response([
      'ok' => true,
      'status' => $stored['duplicate'] ? 'duplicate_ignored' : 'created',
      'reportUuid' => $stored['report_uuid'],
      'studentId' => $profile['app_student_id'],
      'receivedAt' => gmdate('c'),
    ], $stored['duplicate'] ? 200 : 201);
  }

  public function student_sync(WP_REST_Request $request): WP_REST_Response {
    $upload_token = sanitize_text_field((string) $request->get_header('x-fleisstakt-upload-token'));
    if (!$upload_token) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Upload-Token fehlt.',
      ], 401);
    }

    $profile = $this->repository->get_profile_by_upload_token($upload_token);
    if (!$profile) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Ungültiges Upload-Token.',
      ], 403);
    }

    return new WP_REST_Response([
      'ok' => true,
      'snapshot' => $this->repository->get_student_sync_snapshot($profile),
    ], 200);
  }

  public function connect_profile(WP_REST_Request $request): WP_REST_Response {
    $content_type = (string) $request->get_header('content-type');
    if (stripos($content_type, 'application/json') === false) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Nur application/json ist erlaubt.',
      ], 415);
    }

    $payload = $request->get_json_params();
    if (!is_array($payload)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Kopplungsdaten fehlen.',
      ], 400);
    }

    $app_student_id = sanitize_text_field((string) ($payload['appStudentId'] ?? ''));
    $connect_code = preg_replace('/\D+/', '', (string) ($payload['connectCode'] ?? ''));
    if ($app_student_id === '' || $connect_code === '') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lernenden-ID oder Verbindungscode fehlt.',
      ], 400);
    }

    $profile = $this->repository->get_profile_by_connect_credentials($app_student_id, $connect_code);
    if (!$profile) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lernenden-ID oder Verbindungscode ungültig.',
      ], 403);
    }

    return new WP_REST_Response([
      'ok' => true,
      'snapshot' => $this->repository->get_student_sync_snapshot($profile),
    ], 200);
  }

  public function teacher_sync(WP_REST_Request $request): WP_REST_Response {
    $teacher_key = sanitize_text_field((string) $request->get_header('x-fleisstakt-teacher-key'));
    if (!$teacher_key) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key fehlt.',
      ], 401);
    }

    $teacher = $this->repository->get_teacher_by_api_key($teacher_key);
    if (!$teacher) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key ungültig.',
      ], 403);
    }

    return new WP_REST_Response([
      'ok' => true,
      'snapshot' => $this->repository->get_teacher_sync_snapshot($teacher),
    ], 200);
  }

  public function submit_feedback_response(WP_REST_Request $request): WP_REST_Response {
    $content_type = (string) $request->get_header('content-type');
    if (stripos($content_type, 'application/json') === false) {
      return $this->error_response('Nur application/json ist erlaubt.', 415);
    }

    $payload = $request->get_json_params();
    if (!is_array($payload)) {
      return $this->error_response('Rückmeldung fehlt.');
    }

    $validated = $this->validate_feedback_response_payload($payload);
    if (!$validated['ok']) {
      return $this->error_response($validated['message'], 400);
    }

    try {
      $stored = $this->repository->store_feedback_response(
        $validated['ballotToken'],
        $validated['roundId'],
        $validated['answers']
      );
    } catch (InvalidArgumentException $exception) {
      $message = match ($exception->getMessage()) {
        'feedback-bereits-abgegeben' => 'Diese Rückmeldung wurde bereits abgegeben.',
        'feedback-unvollstaendig' => 'Bitte beantworte alle Fragen.',
        default => 'Die Rückmeldung konnte nicht gespeichert werden.',
      };
      return $this->error_response($message, 409);
    } catch (Throwable $exception) {
      return $this->error_response('Die Rückmeldung konnte gerade nicht gespeichert werden.', 500);
    }

    return new WP_REST_Response([
      'ok' => true,
      'status' => 'recorded',
      'roundId' => $stored['roundId'],
      'submittedAt' => $stored['submittedAt'],
    ], 201);
  }

  public function teacher_profile_package(WP_REST_Request $request): WP_REST_Response {
    $teacher_key = sanitize_text_field((string) $request->get_header('x-fleisstakt-teacher-key'));
    if (!$teacher_key) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key fehlt.',
      ], 401);
    }

    $teacher = $this->repository->get_teacher_by_api_key($teacher_key);
    if (!$teacher) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key ungültig.',
      ], 403);
    }

    $student_id = sanitize_text_field((string) ($request->get_param('studentId') ?? ''));
    if ($student_id === '') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lernenden-ID fehlt.',
      ], 400);
    }

    $profile = $this->repository->get_profile_by_app_student_id($student_id);
    if (!$profile) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Profil nicht gefunden.',
      ], 404);
    }

    $snapshot = $this->repository->get_teacher_sync_snapshot($teacher);
    $allowed_ids = array_map(
      static fn(array $item): string => sanitize_text_field((string) ($item['studentId'] ?? '')),
      is_array($snapshot['students'] ?? null) ? $snapshot['students'] : []
    );
    if (!in_array($student_id, $allowed_ids, true)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Dieses Profil ist der Lehrkraft nicht zugeordnet.',
      ], 403);
    }

    $package = $this->repository->build_profile_package((int) $profile['id']);
    if (!$package) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Profilpaket konnte nicht erzeugt werden.',
      ], 500);
    }

    $download_url = add_query_arg([
      'appStudentId' => $package['appStudentId'],
      'token' => $package['uploadToken'],
      'download' => '1',
    ], rest_url('fleisstakt-sync/v1/profile-package'));

    return new WP_REST_Response([
      'ok' => true,
      'package' => $package,
      'fileName' => $this->build_profile_package_filename($package),
      'downloadUrl' => $download_url,
      'shareUrl' => $download_url,
    ], 200);
  }

  public function public_profile_package(WP_REST_Request $request): WP_REST_Response {
    $app_student_id = sanitize_text_field((string) ($request->get_param('appStudentId') ?? ''));
    $token = sanitize_text_field((string) ($request->get_param('token') ?? ''));
    if ($app_student_id === '' || $token === '') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'App-Lernenden-ID oder Token fehlt.',
      ], 400);
    }

    $profile = $this->repository->get_profile_by_app_student_id($app_student_id);
    if (!$profile || !hash_equals((string) ($profile['upload_token'] ?? ''), $token)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Profilfreigabe ungültig.',
      ], 403);
    }

    $package = $this->repository->build_profile_package((int) $profile['id']);
    if (!$package) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Profilpaket konnte nicht erzeugt werden.',
      ], 500);
    }

    $response = new WP_REST_Response($package, 200);
    $response->header('Content-Type', 'application/json; charset=utf-8');
    if ((string) ($request->get_param('download') ?? '') === '1') {
      $response->header('Content-Disposition', 'attachment; filename="' . $this->build_profile_package_filename($package) . '"');
    }
    return $response;
  }

  public function save_teacher_cards(WP_REST_Request $request): WP_REST_Response {
    $content_type = (string) $request->get_header('content-type');
    if (stripos($content_type, 'application/json') === false) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Nur application/json ist erlaubt.',
      ], 415);
    }

    $teacher_key = sanitize_text_field((string) $request->get_header('x-fleisstakt-teacher-key'));
    if (!$teacher_key) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key fehlt.',
      ], 401);
    }

    $teacher = $this->repository->get_teacher_by_api_key($teacher_key);
    if (!$teacher) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key ungültig.',
      ], 403);
    }

    $payload = $request->get_json_params();
    if (!is_array($payload) || ($payload['kind'] ?? '') !== 'fleisstakt-teacher-karten-sync') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Ungültiges Kartenpaket.',
      ], 400);
    }

    $cards = is_array($payload['cards'] ?? null) ? $payload['cards'] : null;
    if ($cards === null) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Kartenliste fehlt.',
      ], 400);
    }

    $checksum = sanitize_text_field((string) ($payload['checksum'] ?? ''));
    $expected_checksum_payload = $payload;
    unset($expected_checksum_payload['checksum']);
    $expected_checksum = $this->repository->create_checksum($expected_checksum_payload);
    if (!$checksum || !hash_equals($expected_checksum, $checksum)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Prüfsumme ungültig.',
      ], 400);
    }

    $result = $this->repository->sync_teacher_cards($teacher, $cards);

    return new WP_REST_Response([
      'ok' => true,
      'status' => 'saved',
      'count' => $result['count'],
      'savedAt' => $result['savedAt'],
    ], 200);
  }

  public function save_teacher_card_award(WP_REST_Request $request): WP_REST_Response {
    $content_type = (string) $request->get_header('content-type');
    if (stripos($content_type, 'application/json') === false) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Nur application/json ist erlaubt.',
      ], 415);
    }

    $teacher_key = sanitize_text_field((string) $request->get_header('x-fleisstakt-teacher-key'));
    if (!$teacher_key) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key fehlt.',
      ], 401);
    }

    $teacher = $this->repository->get_teacher_by_api_key($teacher_key);
    if (!$teacher) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key ungültig.',
      ], 403);
    }

    $payload = $request->get_json_params();
    if (!is_array($payload) || ($payload['kind'] ?? '') !== 'fleisstakt-teacher-karten-vergabe') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Ungültige Kärtchen-Vergabe.',
      ], 400);
    }

    $checksum = sanitize_text_field((string) ($payload['checksum'] ?? ''));
    $expected_checksum_payload = $payload;
    unset($expected_checksum_payload['checksum']);
    $expected_checksum = $this->repository->create_checksum($expected_checksum_payload);
    if (!$checksum || !hash_equals($expected_checksum, $checksum)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Prüfsumme ungültig.',
      ], 400);
    }

    try {
      if (($payload['action'] ?? 'award') === 'revoke') {
        $this->repository->revoke_card_award($teacher, $payload);
        return new WP_REST_Response([
          'ok' => true,
          'status' => 'revoked',
        ], 200);
      }

      $result = $this->repository->award_card_to_profile($teacher, $payload);
      return new WP_REST_Response([
        'ok' => true,
        'status' => 'awarded',
        'awardId' => $result['awardId'],
        'savedAt' => $result['awardedAt'],
      ], 200);
    } catch (InvalidArgumentException $exception) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => $this->map_award_error_message($exception->getMessage()),
      ], 400);
    } catch (Throwable $exception) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Die Kärtchen-Vergabe konnte serverseitig nicht gespeichert werden.',
      ], 500);
    }
  }

  public function save_teacher_roster(WP_REST_Request $request): WP_REST_Response {
    $content_type = (string) $request->get_header('content-type');
    if (stripos($content_type, 'application/json') === false) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Nur application/json ist erlaubt.',
      ], 415);
    }

    $teacher_key = sanitize_text_field((string) $request->get_header('x-fleisstakt-teacher-key'));
    if (!$teacher_key) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key fehlt.',
      ], 401);
    }

    $teacher = $this->repository->get_teacher_by_api_key($teacher_key);
    if (!$teacher) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Lehrkräfte-Key ungültig.',
      ], 403);
    }

    $payload = $request->get_json_params();
    if (!is_array($payload) || ($payload['kind'] ?? '') !== 'fleisstakt-teacher-roster-sync') {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Ungültiges Stammdatenpaket.',
      ], 400);
    }

    $checksum = sanitize_text_field((string) ($payload['checksum'] ?? ''));
    $expected_checksum_payload = $payload;
    unset($expected_checksum_payload['checksum']);
    $expected_checksum = $this->repository->create_checksum($expected_checksum_payload);
    if (!$checksum || !hash_equals($expected_checksum, $checksum)) {
      return new WP_REST_Response([
        'ok' => false,
        'message' => 'Prüfsumme ungültig.',
      ], 400);
    }

    $result = $this->repository->sync_teacher_roster($teacher, $payload);

    return new WP_REST_Response([
      'ok' => true,
      'status' => 'saved',
      'classCount' => $result['classCount'],
      'studentCount' => $result['studentCount'],
      'savedAt' => $result['savedAt'],
    ], 200);
  }

  private function map_award_error_message(string $code): string {
    return match ($code) {
      'karte-nicht-gefunden' => 'Dieses Kärtchen wurde auf dem Server nicht gefunden.',
      'profil-nicht-zugeordnet' => 'Dieses Profil ist der Lehrkraft nicht zugeordnet.',
      default => 'Die Kärtchen-Vergabe konnte nicht verarbeitet werden.',
    };
  }

  public function send_cors_headers($served, $result, $request, $server) {
    $route = method_exists($request, 'get_route') ? (string) $request->get_route() : '';
    if (strpos($route, '/fleisstakt-sync/v1/') !== 0) {
      return $served;
    }

    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-FleissTakt-Upload-Token, X-FleissTakt-Teacher-Key');
    header('Access-Control-Expose-Headers: Content-Type');

    if ('OPTIONS' === strtoupper($_SERVER['REQUEST_METHOD'] ?? '')) {
      status_header(200);
      exit;
    }

    return $served;
  }

  private function validate_feedback_response_payload(array $payload): array {
    $round_id = (int) ($payload['roundId'] ?? 0);
    $ballot_token = sanitize_text_field((string) ($payload['ballotToken'] ?? ''));
    $answers = is_array($payload['answers'] ?? null) ? $payload['answers'] : null;

    if (!$round_id || $ballot_token === '' || !$answers) {
      return [
        'ok' => false,
        'message' => 'Rückmeldung ist unvollständig.',
      ];
    }

    $normalized_answers = [];
    $seen_question_ids = [];
    foreach ($answers as $answer) {
      if (!is_array($answer)) {
        return [
          'ok' => false,
          'message' => 'Rückmeldung ist unvollständig.',
        ];
      }

      $question_id = (int) ($answer['questionId'] ?? 0);
      $value = (int) ($answer['value'] ?? 0);
      if (!$question_id || $value < 1 || $value > 5) {
        return [
          'ok' => false,
          'message' => 'Bitte alle Antworten auf der Skala 1 bis 5 angeben.',
        ];
      }

      if (isset($seen_question_ids[$question_id])) {
        return [
          'ok' => false,
          'message' => 'Jede Frage darf nur einmal beantwortet werden.',
        ];
      }

      $seen_question_ids[$question_id] = true;
      $normalized_answers[] = [
        'questionId' => $question_id,
        'value' => $value,
      ];
    }

    return [
      'ok' => true,
      'roundId' => $round_id,
      'ballotToken' => $ballot_token,
      'answers' => $normalized_answers,
    ];
  }

  private function error_response(string $message, int $status = 400): WP_REST_Response {
    return new WP_REST_Response([
      'ok' => false,
      'message' => $message,
    ], $status);
  }

  private function build_profile_package_filename(array $package): string {
    $display_name = sanitize_file_name((string) ($package['displayName'] ?? 'schueler'));
    $app_student_id = sanitize_file_name((string) ($package['appStudentId'] ?? 'profil'));
    return 'fleisstakt-profile-' . ($display_name ?: 'schueler') . '-' . ($app_student_id ?: 'profil') . '.json';
  }
}

<?php
/**
 * Plugin Name: FleißTakt Sync Bridge
 * Plugin URI: https://schwoabamunzee.marsrakete.de/
 * Description: Zentrale Synchronisations- und Verwaltungsbrücke für FleißTakt mit Lehrkräften, Lernenden, Unterrichten, Klassen, Kärtchen und Berichten.
 * Version: 0.26.2
 * Author: Marsrakete
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Text Domain: fleisstakt-sync-bridge
 */

if (!defined('ABSPATH')) {
  exit;
}

define('FLEISSTAKT_SYNC_BRIDGE_VERSION', '0.26.2');
define('FLEISSTAKT_SYNC_BRIDGE_FILE', __FILE__);
define('FLEISSTAKT_SYNC_BRIDGE_PATH', plugin_dir_path(__FILE__));
define('FLEISSTAKT_SYNC_BRIDGE_URL', plugin_dir_url(__FILE__));

require_once FLEISSTAKT_SYNC_BRIDGE_PATH . 'includes/class-fleisstakt-sync-bridge-repository.php';
require_once FLEISSTAKT_SYNC_BRIDGE_PATH . 'includes/class-fleisstakt-sync-bridge-rest.php';
require_once FLEISSTAKT_SYNC_BRIDGE_PATH . 'includes/class-fleisstakt-sync-bridge-admin.php';
require_once FLEISSTAKT_SYNC_BRIDGE_PATH . 'includes/class-fleisstakt-sync-bridge.php';

register_activation_hook(FLEISSTAKT_SYNC_BRIDGE_FILE, ['FleissTakt_Sync_Bridge', 'activate']);
register_deactivation_hook(FLEISSTAKT_SYNC_BRIDGE_FILE, ['FleissTakt_Sync_Bridge', 'deactivate']);

FleissTakt_Sync_Bridge::instance();

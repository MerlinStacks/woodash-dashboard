<?php
/**
 * Plugin Name: OverSeek Integration for WooCommerce
 * Plugin URI:  https://overseek.io
 * Description: Seamlessly integrates OverSeek analytics and live chat with your WooCommerce store.
 * Version:     1.0.0
 * Author:      OverSeek
 * Author URI:  https://overseek.io
 * Text Domain: overseek-wc
 * Domain Path: /languages
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'OVERSEEK_WC_VERSION', '1.0.0' );
define( 'OVERSEEK_WC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'OVERSEEK_WC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main Plugin Class Initialization
 */
function overseek_wc_init() {
	if ( ! class_exists( 'OverSeek_Main' ) ) {
		require_once OVERSEEK_WC_PLUGIN_DIR . 'includes/class-overseek-main.php';
	}
	
	// Initialize the main plugin class.
	$overseek_plugin = new OverSeek_Main();
	$overseek_plugin->run();
}
add_action( 'plugins_loaded', 'overseek_wc_init' );

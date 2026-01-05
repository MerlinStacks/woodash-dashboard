<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class OverSeek_Main
 * 
 * The core plugin class responsible for loading dependencies and defining hooks.
 */
class OverSeek_Main {

	/**
	 * Loader for admin hooks.
	 *
	 * @var OverSeek_Admin
	 */
	protected $admin;

	/**
	 * Loader for frontend hooks.
	 *
	 * @var OverSeek_Frontend
	 */
	protected $frontend;

	/**
	 * Initialize the plugin classes.
	 */
	public function __construct() {
		$this->load_dependencies();
		$this->init_hooks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 */
	private function load_dependencies() {
		// Load Admin Class
		require_once OVERSEEK_WC_PLUGIN_DIR . 'includes/class-overseek-admin.php';

		// Load Frontend Class
		require_once OVERSEEK_WC_PLUGIN_DIR . 'includes/class-overseek-frontend.php';
	}

	/**
	 * Initialize hooks for Admin and Frontend.
	 */
	private function init_hooks() {
		// Initialize Admin
		$this->admin = new OverSeek_Admin();
		add_action( 'admin_menu', array( $this->admin, 'add_menu_page' ) );
		add_action( 'admin_init', array( $this->admin, 'register_settings' ) );

		// Initialize Frontend
		$this->frontend = new OverSeek_Frontend();
		add_action( 'wp_head', array( $this->frontend, 'print_scripts' ) );
	}

	/**
	 * Run the plugin.
	 */
	public function run() {
		// Any post-initialization logic can go here.
	}
}

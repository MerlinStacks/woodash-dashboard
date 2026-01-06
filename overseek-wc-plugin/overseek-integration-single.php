<?php
/**
 * Plugin Name: OverSeek Integration for WooCommerce (Single File)
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
 * Class OverSeek_Frontend
 *
 * Handles frontend script injection based on settings.
 */
class OverSeek_Frontend {

	/**
	 * Print scripts to the head if enabled.
	 */
	public function print_scripts() {
		$tracking_enabled = get_option( 'overseek_enable_tracking' );
		$chat_enabled     = get_option( 'overseek_enable_chat' );
		$api_url          = get_option( 'overseek_api_url', 'https://api.overseek.com' );
		$account_id       = get_option( 'overseek_account_id' );

		// Remove trailing slash from API URL if present
		$api_url = untrailingslashit( $api_url );

		if ( $tracking_enabled && ! empty( $account_id ) ) {
			echo "<!-- OverSeek Analytics Tracking -->\n";
			echo "<script>\n";
			echo "(function(w,d,s,id){\n";
			echo "  w.OverSeek=w.OverSeek||function(){(w.OverSeek.q=w.OverSeek.q||[]).push(arguments)};\n";
			echo "  var f=d.getElementsByTagName(s)[0],j=d.createElement(s);\n";
			echo "  j.async=true;j.src='" . esc_url( $api_url ) . "/api/tracking/tracking.js?id='+id;\n";
			echo "  f.parentNode.insertBefore(j,f);\n";
			echo "})(window,document,'script','" . esc_js( $account_id ) . "');\n";
			echo "</script>\n";
			echo "<!-- End OverSeek Analytics -->\n";
		}

		if ( $chat_enabled && ! empty( $account_id ) ) {
			echo "<!-- OverSeek Live Chat Widget Start -->\n";
			echo "<script src='" . esc_url( $api_url ) . "/api/chat/widget.js?id=" . esc_js( $account_id ) . "' async defer></script>\n";
			echo "<!-- OverSeek Live Chat Widget End -->\n";
		}
	}
}

/**
 * Class OverSeek_Admin
 *
 * Handles the admin settings page and menu registration.
 */
class OverSeek_Admin {

	/**
	 * Register the OverSeek submenu under WooCommerce.
	 */
	public function add_menu_page() {
		add_submenu_page(
			'woocommerce',           // Parent slug
			'OverSeek Settings',     // Page title
			'OverSeek',              // Menu title
			'manage_options',        // Capability
			'overseek',              // Menu slug
			array( $this, 'render_settings_page' ) // Callback
		);
	}

	/**
	 * Register plugin settings.
	 */
	public function register_settings() {
		register_setting( 'overseek_options_group', 'overseek_api_url' );
		register_setting( 'overseek_options_group', 'overseek_account_id' );
		register_setting( 'overseek_options_group', 'overseek_enable_tracking' );
		register_setting( 'overseek_options_group', 'overseek_enable_chat' );
	}

	/**
	 * Render the settings page HTML.
	 */
	public function render_settings_page() {
		?>
		<div class="wrap">
			<h1>OverSeek Integration Settings</h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'overseek_options_group' ); ?>
				<?php do_settings_sections( 'overseek_options_group' ); ?>
				<table class="form-table">
					<tr valign="top">
						<th scope="row">API URL</th>
						<td>
							<input type="text" name="overseek_api_url" value="<?php echo esc_attr( get_option( 'overseek_api_url', 'https://api.overseek.com' ) ); ?>" class="regular-text" />
							<p class="description">The base URL for the OverSeek API (e.g., https://api.overseek.com).</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Account ID</th>
						<td>
							<input type="text" name="overseek_account_id" value="<?php echo esc_attr( get_option( 'overseek_account_id' ) ); ?>" class="regular-text" />
							<p class="description">Your unique OverSeek Account ID.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Enable Global Tracking</th>
						<td>
							<input type="checkbox" name="overseek_enable_tracking" value="1" <?php checked( 1, get_option( 'overseek_enable_tracking' ), true ); ?> />
							<p class="description">Enable OverSeek analytics tracking on the storefront.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Enable Live Chat Widget</th>
						<td>
							<input type="checkbox" name="overseek_enable_chat" value="1" <?php checked( 1, get_option( 'overseek_enable_chat' ), true ); ?> />
							<p class="description">Show the OverSeek live chat widget to visitors.</p>
						</td>
					</tr>
				</table>
				
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
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
		// Dependencies are inline now
		$this->init_hooks();
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

/**
 * Main Plugin Class Initialization
 */
function overseek_wc_init() {
	// Initialize the main plugin class.
	$overseek_plugin = new OverSeek_Main();
	$overseek_plugin->run();
}
add_action( 'plugins_loaded', 'overseek_wc_init' );

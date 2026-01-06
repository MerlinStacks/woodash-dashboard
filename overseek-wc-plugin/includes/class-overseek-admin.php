<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
						<th scope="row">Connection Status</th>
						<td>
							<?php 
								$api_url = get_option( 'overseek_api_url' ); 
								$account_id = get_option( 'overseek_account_id' );
								
								if ( $api_url && $account_id ) {
									echo '<span style="color: green; font-weight: bold;">&#10003; Connected</span>';
								} else {
									echo '<span style="color: red; font-weight: bold;">&#10007; Not Connected</span>';
								}
							?>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">API URL</th>
						<td>
							<code><?php echo esc_html( get_option( 'overseek_api_url', 'Not configured' ) ); ?></code>
							<p class="description">Managed automatically by OverSeek.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Account ID</th>
						<td>
							<code><?php echo esc_html( get_option( 'overseek_account_id', 'Not configured' ) ); ?></code>
							<p class="description">Managed automatically by OverSeek.</p>
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

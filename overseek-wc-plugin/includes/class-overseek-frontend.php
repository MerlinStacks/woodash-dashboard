<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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

import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsTimeline {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-timeline .vco-storyjs a { color: ${Colors.colorBase} !important; }`,
      `.h5p-timeline .vco-storyjs a:hover, .vco-storyjs a:active { color: ${Colors.colorBase.darken(.15).hex()} !important; }`,
      `.h5p-timeline .vco-timeline .vco-navigation .timenav-background .timenav-line { background-color: ${Colors.colorBase} !important;}`,
      `.h5p-timeline .vco-timeline .vco-navigation .timenav .content .marker.active .flag .flag-content h3, .vco-timeline .vco-navigation .timenav .content .marker.active .flag-small .flag-content h3 { color: ${Colors.colorBase} !important;}`,
      `.h5p-timeline .vco-timeline .vco-navigation .timenav .content .marker.active .line .event-line { background: ${Colors.colorBase} !important;}`,
      `.h5p-timeline .vco-timeline .vco-navigation .timenav .content .marker.active .line { background: ${Colors.colorBase} !important;}`,
      `.h5p-timeline .vco-timeline .vco-navigation .timenav .content .marker .line .event-line { background: ${Colors.colorBase} !important;}`,
      `.h5p-timeline .vco-timeline .vco-navigation .timenav .content .marker.active .dot { background: ${Colors.colorBase} !important;}`
    ].join('');
  }
}

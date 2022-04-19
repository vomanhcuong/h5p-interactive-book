import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsInteractiveVideo {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-gotoquestion-text { background: ${Colors.colorBase}; color: ${Colors.colorText} }`,
      `.h5p-gotoquestion-button[aria-disabled=false]:hover, .h5p-gotoquestion-button[aria-disabled=false]:focus { color: ${Colors.colorBase};}`,
      `.h5p-gotoquestion-button[aria-disabled=false]:hover:after, .h5p-gotoquestion-button[aria-disabled=false]:focus:after { border-bottom-color: ${Colors.colorBase};}`
    ].join('');
  }
}

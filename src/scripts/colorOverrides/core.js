import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsCore {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-confirmation-dialog-header { color: ${Colors.colorBase}; }`,
      `button.h5p-core-button { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `button.h5p-core-button:link { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `button.h5p-core-button:visited { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `button.h5p-core-button:hover { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `button.h5p-core-button:focus { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `button.h5p-core-button:active { background: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; color: ${Colors.colorText};}`,
    ].join('');
  }
}

import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsMemoryGame {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-memory-reset { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `.h5p-memory-reset:hover { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; }`,
      `.h5p-memory-reset:focus { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; }`,
      `.h5p-memory-reset:active { background: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; box-shadow: inset 0 4px 0 ${Colors.getColor(Colors.colorBase.darken(.25).hex())}; }`,
    ].join('');
  }
}

import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsGuessTheAnswer {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-guess-answer .show-solution-button { background-color: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `.h5p-guess-answer .show-solution-button:hover { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; }`,
      `.h5p-guess-answer .show-solution-button:focus { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; }`,
      `.h5p-guess-answer .show-solution-button:active { background: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; box-shadow: inset 0 4px 0 ${Colors.getColor(Colors.colorBase.darken(.25).hex())}; }`,
    ].join('');
  }
}

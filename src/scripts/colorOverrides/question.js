import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsQuestion {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-question-feedback { color: ${Colors.colorBase}; }`
    ].join('');
  }
}

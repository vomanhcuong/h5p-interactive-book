import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsSimpleMultipleChoice {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-questionnaire .h5p-simple-multiple-choice-question { background: ${Colors.colorBase}; color: ${Colors.colorText};}`
    ].join('');
  }
}

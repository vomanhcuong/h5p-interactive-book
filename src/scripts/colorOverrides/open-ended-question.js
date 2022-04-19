import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsOpenEndedQuestion {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-questionnaire .h5p-open-ended-question-question { background: ${Colors.colorBase}; color: ${Colors.colorText};}`
    ].join('');
  }
}

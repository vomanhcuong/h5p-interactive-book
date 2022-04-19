import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsQuestionSet {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.questionset .progress-dot.answered { background: ${Colors.colorBase}; }`,
      `.questionset .progress-dot.current { background: ${Colors.colorBase.darken(.2).hex()}; }`
    ].join('');
  }
}

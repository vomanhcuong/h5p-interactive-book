import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsQuestionnaire {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-questionnaire-submit-screen { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `.h5p-questionnaire-success { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `.h5p-questionnaire-submit-screen .h5p-questionnaire-button.previous { color: ${Colors.colorText}; border-color: ${Colors.colorText}; }`,
      `.h5p-questionnaire-submit-screen .h5p-questionnaire-button.previous:hover { background-color: ${Colors.colorBase.darken(.15).hex()};}`,
      `.h5p-questionnaire-submit-screen .h5p-questionnaire-button.previous:active { background-color: ${Colors.colorBase.darken(.2).hex()};}`,
      `.h5p-questionnaire-button.submit { background-color: ${Colors.colorBase.rotate(180).rgb()}; border-color: ${Colors.colorBase.rotate(180).rgb()};}`,
      `.h5p-questionnaire-button.submit:hover { background-color: ${Colors.colorBase.rotate(180).darken(.15).rgb()};}`,
      `.h5p-questionnaire-button.submit:active { background-color: ${Colors.colorBase.rotate(180).darken(.2).rgb()};}`,
      `.h5p-questionnaire-progress-bar-widget { background-color: ${Colors.colorText};}`,
      `.h5p-questionnaire-progress-bar-current { background: ${Colors.colorBase.rotate(180).rgb()};}`,
      `.h5p-questionnaire-progress-bar-widget-current { color: ${Colors.colorBase.rotate(180).rgb()};}`
    ].join('');
  }
}

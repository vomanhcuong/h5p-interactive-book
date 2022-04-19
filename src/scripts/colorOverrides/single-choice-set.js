import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsSingleChoiceSet {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-single-choice-set .h5p-joubelui-progressbar-background { background-color: ${Colors.colorBase}; }`
    ].join('');
  }
}

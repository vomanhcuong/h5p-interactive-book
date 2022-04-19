import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsCoursePresentation {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-course-presentation .h5p-progressbar .h5p-progressbar-part-show {background: ${Colors.colorBase}; background-image: -webkit-linear-gradient(top, ${Colors.colorBase.hex()}, ${Colors.colorBase.darken(.1).hex()}); background-image: -moz-linear-gradient(top, ${Colors.colorBase.hex()}, ${Colors.colorBase.darken(.1).hex()}); background-image: linear-gradient(to bottom, ${Colors.colorBase.hex()}, ${Colors.colorBase.darken(.1).hex()});}`,
      `.h5p-course-presentation .h5p-element-button { background: ${Colors.colorBase}; border-color: ${Colors.colorBase.lighten(.1).hex()}; color: ${Colors.colorText};}`,
      `.h5p-course-presentation .h5p-element-button:hover { background: ${Colors.colorBase.darken(.15).hex()}; border-color: ${Colors.colorBase};}`,
      `.h5p-course-presentation .h5p-keywords-wrapper>[role=menu]::-webkit-scrollbar-thumb, .h5p-course-presentation .h5p-element .h5p-element-outer::-webkit-scrollbar-thumb, .h5p-course-presentation .h5p-element .h5p-element-outer .h5p-element-inner::-webkit-scrollbar-thumb { background: ${Colors.colorBase };}`,
      `.h5p-course-presentation .h5p-keywords-wrapper>[role=menu]::-webkit-scrollbar-thumb:hover, .h5p-course-presentation .h5p-element .h5p-element-outer::-webkit-scrollbar-thumb:hover, .h5p-course-presentation .h5p-element .h5p-element-outer .h5p-element-inner::-webkit-scrollbar-thumb:hover { background: ${Colors.colorBase.darken(.15).hex() };}`
    ].join('');
  }
}

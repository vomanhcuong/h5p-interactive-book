import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsDocumentationTool {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-documentation-tool-nav-button.next:before { color: ${Colors.colorText}; }`,
      `.h5p-documentation-tool-nav-button:before { color: ${Colors.colorText}; }`
    ].join('');
  }
}

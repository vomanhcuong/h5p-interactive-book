import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsJoubelUI {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-joubelui-button { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `.h5p-joubelui-button:hover { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `.h5p-joubelui-button:focus { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `.h5p-joubelui-button:active { background: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; box-shadow: inset 0 4px 0 ${Colors.getColor(Colors.colorBase.darken(.25).hex())}; color: ${Colors.colorText};}`,
      `.h5peditor .ui-dialog .h5p-joubelui-button { background: ${Colors.colorBase}; box-shadow: inset 0 4px 0 ${Colors.getColor(Colors.colorBase.darken(.25).hex())}; color: ${Colors.colorText};}`,
      `.h5peditor .ui-dialog .h5p-joubelui-button:hover { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `.h5peditor .ui-dialog .h5p-joubelui-button:focus { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `.h5peditor .ui-dialog .h5p-joubelui-button:active { background: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; color: ${Colors.colorText};}`,
      `.joubel-simple-rounded-button { background: ${Colors.colorBase}; color: ${Colors.colorText};}`,
      `.joubel-simple-rounded-button:hover { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `.joubel-simple-rounded-button:focus { background: ${Colors.getColor(Colors.colorBase.darken(.15).hex())}; color: ${Colors.colorText};}`,
      `.joubel-simple-rounded-button:active { background: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; box-shadow: inset 0 4px 0 ${Colors.getColor(Colors.colorBase.darken(.25).hex())}; color: ${Colors.colorText};}`,
      `.h5p-joubelui-score-bar .joubel-tip-container { color: ${Colors.colorBase};}`,
      `.h5p-joubelui-progressbar-background { background-color: ${Colors.getColor(Colors.colorBase.darken(.20).hex())}; }`
    ].join('');
  }
}

import Colors from './../colors';

/**
 * Color overrides class.
 * @class
 */
export default class ColorsAudio {

  /**
   * Get custom CSS.
   * @return {string} Custom CSS.
   */
  static getCSS() {
    return [
      `.h5p-audio-inner .h5p-audio-minimal-button { background: ${Colors.colorBase}; background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(${Colors.colorBase.array().join(',')},1)), color-stop(100%,rgba(${Colors.colorBase.darken(.1).rgb().array().join(',')},1))); background: -webkit-linear-gradient(top, rgba(${Colors.colorBase.array().join(',')},1) 0%,rgba(${Colors.colorBase.darken(.1).rgb().array().join(',')},1) 100%); color: ${Colors.colorText};}`
    ].join('');
  }
}

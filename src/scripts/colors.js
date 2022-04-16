import Color from 'color';

/**
 * Color class.
 * @class
 */
export default class Colors {

  /**
   * Set new base color.
   * @param {string} color RGB color code in hex: #rrggbb.
   */
  static setBase(color) {
    Colors.colorBase = Color(color);

    // Get contrast color with highest contrast
    Colors.colorBg = [
      Colors.DEFAULT_COLOR_BG,
      Colors.computeContrastColor(Colors.colorBase),
      Colors.computeContrastColor(Colors.colorBase, Colors.DEFAULT_COLOR_BG)
    ].map(color => ({
      color: color,
      contrast: Colors.colorBase.contrast(color)
    })).reduce((result, current) => {
      return (current.contrast > result.contrast) ? current : result;
    }, {contrast: 0}).color;
  }

  /**
   * Get color.
   * @param {Color} color Base color.
   * @param {object} [params={}] Parameters.
   * @param {number} [params.opacity] Opacity value assuming white background.
   * @return {Color} Color with opacity figured in.
   */
  static getColor(color, params = {}) {
    if (
      typeof params.opacity === 'string' &&
      /^([0-9]|[1-8][0-9]|9[0-9]|100)(\.\d+)?\s?%$/.test(params.opacity)
    ) {
      params.opacity = parseInt(params.opacity) / 100;
    }

    if (
      typeof params.opacity !== 'number' ||
      params.opacity < 0 ||
      params.opacity > 1
    ) {
      return color;
    }

    const rgbBackground = Color('#ffffff').rgb().array();

    return Color.rgb(
      color.rgb().array().map((value, index) => {
        return params.opacity * value + (1 - params.opacity) * rgbBackground[index];
      })
    );
  }

  /**
   * Check whether color is default base color.
   * @param {string} color RGB color code in hex: #rrggbb.
   * @return {boolean} True, if color is default base color, else false.
   */
  static isBaseColor(color) {
    return Color(color).hex() === Colors.colorBase.hex();
  }

  /**
   * Compute contrast color to given color.
   * Tries to get contrast ratio of at least 4.5.
   * @compare https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-description
   * @param {Color} baseColor Color to compute contrast color for.
   * @param {Color} comparisonColor Color that the base color is compared to.
   * @return {Color} Contrast color.
   */
  static computeContrastColor(baseColor, comparisonColor) {
    comparisonColor = comparisonColor || baseColor;

    const luminance = comparisonColor.luminosity();

    let contrastColor;
    for (let diff = 0; diff <= 1; diff = diff + 0.05) {
      contrastColor = Color.rgb(baseColor.rgb().array().map(value => {
        return value * ((luminance > .5) ? (1 - diff) : (1 + diff));
      }));

      const contrast = contrastColor.contrast(comparisonColor);
      if (contrast >= Colors.MINIMUM_ACCEPTABLE_CONTRAST) {
        break;
      }
    }

    return contrastColor;
  }

  /**
   * Build CSS overrides.
   * Color values are set in SCSS including pseudo elements, so we need to
   * override CSS.
   * @return {string} CSS overrides.
   */
  static buildCSS() {
    const css = [];

    // Cover
    css.push(`.h5p-interactive-book-cover-bar { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .05 })}; }`);
    css.push(`.h5p-interactive-book-cover-readbutton button { background-color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-cover-readbutton button:hover { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .90 })}; }`);
    css.push(`.h5p-interactive-book-cover-readbutton button:active { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .95 })}; }`);
    css.push(`.h5p-interactive-book-cover-readbutton button { color: ${Colors.colorBg} }`);

    // Navigation bar
    css.push(`.h5p-interactive-book-navigation-section:hover { color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-navigation-sectionlist :hover { color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-navigation-chapter-button:not(.h5p-interactive-book-summary-menu-button) { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .1 })}; }`);
    css.push(`.h5p-interactive-book-navigation-chapter-button:not(.h5p-interactive-book-summary-menu-button).h5p-interactive-book-navigation-current { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .1 })}; }`);
    css.push(`.h5p-interactive-book-navigation-chapter-button:not(.h5p-interactive-book-summary-menu-button):hover { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .05 })}; }`);
    css.push(`.h5p-interactive-book-navigation-chapter-button:not(.h5p-interactive-book-summary-menu-button):active { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .1 })}; }`);
    css.push(`.h5p-interactive-book-navigation-chapter-button:not(.h5p-interactive-book-summary-menu-button) .h5p-interactive-book-navigation-chapter-title-text { color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-navigation-maintitle { background-color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-navigation-maintitle .navigation-title { color: ${Colors.colorBg}; }`);

    // Status bar
    css.push(`.h5p-interactive-book-status { border-color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-button:hover { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .1 })}; }`);
    css.push(`.h5p-interactive-book-status-button:active { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .2 })}; }`);
    css.push(`.h5p-interactive-book-status-button[disabled]:active { background-color: transparent; }`);
    css.push(`.h5p-interactive-book-status-fullscreen { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .05 })}; }`);
    css.push(`.h5p-interactive-book-status-fullscreen.h5p-interactive-book-enter-fullscreen::before { color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-fullscreen.h5p-interactive-book-exit-fullscreen::before { color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-menu .icon-menu { color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-menu.h5p-interactive-book-status-menu-active { background-color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-menu.h5p-interactive-book-status-menu-active .icon-menu { color: ${Colors.colorBg}; }`);
    css.push(`.h5p-interactive-book-status-menu.h5p-interactive-book-status-menu-active:hover { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .9 })}; }`);
    css.push(`.h5p-interactive-book-status-menu.h5p-interactive-book-status-menu-active:active { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .95 })}; }`);
    css.push(`.h5p-interactive-book-status-progress-number { color: ${Colors.colorBase}; text-decoration: none solid ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-progressbar-back { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .2 })}; }`);
    css.push(`.h5p-interactive-book-status-progressbar-front { background-color: ${Colors.colorBase}; }`);
    css.push(`.h5p-interactive-book-status-arrow { background-color: ${Colors.getColor(Colors.colorBase, { opacity: .05 })}; }`);
    css.push(`.h5p-interactive-book-status-arrow .navigation-button { color: ${Colors.colorBase}; }`);

    // Summary
    const contrastColorProgress = Colors.computeContrastColor(Colors.colorBase, Colors.DEFAULT_COLOR_BG);
    css.push(`.h5p-interactive-book-summary-page .h5p-interactive-box-summary-progress .h5p-interactive-book-summary-progressbox-bigtext { color: ${contrastColorProgress}; }`);
    css.push(`.h5p-interactive-book-summary-page .h5p-interactive-book-summary-section-icon { color: ${contrastColorProgress}; }`);
    css.push(`.h5p-interactive-book-summary-page .h5p-interactive-book-summary-overview-section h4 span[class^=icon-] { color: ${contrastColorProgress}; }`);
    css.push(`.h5p-interactive-book-summary-page .h5p-interactive-book-summary-overview-section h4:hover { color: ${contrastColorProgress}; }`);

    return css.join('');
  }
}

/** @const {string} Preferred default color as defined in SCSS */
Colors.DEFAULT_COLOR_BASE = Color('#1768c4');
Colors.DEFAULT_COLOR_BG = Color('#ffffff');

/** @const {number} Minimum acceptable contrast for normal font size, cmp. https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-procedure */
Colors.MINIMUM_ACCEPTABLE_CONTRAST = 4.5;

// Relevant default colors defined in SCSS main class or derived from those
Colors.colorBase = Colors.DEFAULT_COLOR_BASE;
Colors.colorBg = Colors.DEFAULT_COLOR_BG;

/**
 * The introduction module
 * Constructor function.
 */
class Cover extends H5P.EventDispatcher {
  constructor(coverParam, titleText, readText, contentId, parent) {
    super();

    this.parent = parent;

    this.div = this.createParentElement();

    this.visuals = this.createVisualsElement(coverParam.coverImage, contentId);

    this.title = this.parseTitle(titleText);
    this.description = this.parseDescription(coverParam.coverDescription);

    this.button = this.createReadButton(readText);

    if (this.visuals) {
      this.div.appendChild(this.visuals);
    }
    else {
      this.div.classList.add('h5p-cover-nographics');
    }

    this.div.appendChild(this.title);

    if (this.description) {
      this.div.appendChild(this.description);
    }
    this.div.appendChild(this.button);
  }

  /**
   * Create an element which contains both the cover image and a background bar.
   *
   * @param {object} coverImage Image object.
   * @param {number} contentId Content Id.
   */
  createVisualsElement(coverImage, contentId) {
    if (coverImage) {
      const div = document.createElement('div');
      div.classList.add('h5p-digibook-cover-graphics');
      const visuals = this.parseImage(coverImage.path, contentId);
      const backBorder = this.createBackBorder();

      div.appendChild(visuals);
      div.appendChild(backBorder);

      return div;
    }
    else {
      return null;
    }
  }

  /**
   * Create an element responsible for the bar behind an image.
   *
   * @return {HTMLElement} Horizontal bar in the background.
   */
  createBackBorder() {
    const coverBar = document.createElement('div');
    coverBar.classList.add('h5p-digibook-cover-bar');
    return coverBar;
  }

  /**
   * Create the top level element.
   *
   * @return {HTMLElement} Cover.
   */
  createParentElement() {
    const cover = document.createElement('div');
    cover.classList.add('h5p-digibook-cover');
    return cover;
  }

  /**
   * Create a button element.
   *
   * @param {string} buttonText Button text.
   * @return {HTMLElement} Read button element.
   */
  createReadButton(buttonText) {
    const buttonElem = document.createElement('div');
    buttonElem.classList.add('h5p-digibook-cover-readbutton');
    const button = document.createElement('button');
    button.innerHTML = buttonText;

    button.onclick = () => {
      this.removeCover();
    };

    buttonElem.appendChild(button);
    return buttonElem;
  }

  /**
   * Create Image.
   *
   * @param {string} path Relative image path.
   * @param {number} contentId Content id.
   */
  parseImage(path, contentId) {
    const img = document.createElement('img');
    img.classList.add('h5p-digibook-cover-image');
    img.src = H5P.getPath(path, contentId);
    img.setAttribute('draggable', 'false');
    img.setAttribute('tabindex', 0);

    return img;
  }

  /**
   * Remove cover.
   */
  removeCover() {
    this.div.parentElement.removeChild(this.div);
    this.div.hidden = true;
    this.parent.trigger('coverRemoved');
  }

  /**
   * Create title.
   *
   * @param {string} titleText Text for title element.
   * @return {HTMLElement} Title element.
   */
  parseTitle(titleText) {
    const titleElem = document.createElement('div');
    titleElem.classList.add('h5p-digibook-cover-title');

    const title = document.createElement('p');
    title.innerHTML = titleText;

    titleElem.appendChild(title);

    return titleElem;
  }

  /**
   * Create description.
   *
   * @param {string} descriptionText Text for description element.
   * @return {HTMLElement} Description element.
   */
  parseDescription(descriptionText) {
    if (descriptionText) {
      const descElem = document.createElement('div');
      descElem.classList.add('h5p-digibook-cover-description');

      const desc = document.createElement('p');
      desc.innerHTML = descriptionText;

      descElem.appendChild(desc);

      return descElem;
    }
    else {
      return null;
    }
  }
}

export default Cover;

/**
 * Constructor function.
 */
class StatusBar extends H5P.EventDispatcher {
  constructor(contentId, totalChapters, parent, params, styleClassName) {
    super();
    this.id = contentId;
    this.parent = parent;

    this.params = params || {};

    this.params.l10n = Object.assign({
      nextPage: 'Next page',
      previousPage: 'Previous page',
      navigateToTop: 'Navigate to the top',
    }, this.params.l10n || {});

    this.params.a11y = Object.assign({
      progress: 'Page @page of @total',
      menu: 'Toggle navigation menu',
    }, this.params.a11y || {});

    this.totalChapters = totalChapters;
    this.arrows = this.addArrows();

    /**
     * Top row initializer
     */
    this.progressBar = this.createProgressBar();
    this.progressIndicator = this.createProgressIndicator();
    this.chapterTitle = this.addChapterTitle();

    const wrapperInfo = document.createElement('div');
    wrapperInfo.classList.add('h5p-digibook-status');
    wrapperInfo.appendChild(this.createMenuToggleButton());
    wrapperInfo.appendChild(this.createToTopButton());
    wrapperInfo.appendChild(this.chapterTitle.wrapper);
    wrapperInfo.appendChild(this.progressIndicator.wrapper);
    wrapperInfo.appendChild(this.arrows.buttonWrapperPrevious);
    wrapperInfo.appendChild(this.arrows.buttonWrapperNext);

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(styleClassName);
    this.wrapper.setAttribute('tabindex', '-1');
    this.wrapper.appendChild(this.progressBar.wrapper);
    this.wrapper.appendChild(wrapperInfo);

    this.on('updateStatusBar', this.updateStatusBar);

    /**
     * Sequential traversal of chapters
     * Event should be either 'next' or 'prev'
     */
    this.on('seqChapter', (event) => {
      const eventInput = {
        h5pbookid: this.parent.contentId
      };
      if (event.data.toTop) {
        eventInput.section = 'top';
      }

      if (event.data.direction === 'next') {
        if (this.parent.activeChapter + 1 < this.parent.chapters.length) {
          eventInput.chapter = this.parent.chapters[this.parent.activeChapter+1].instance.subContentId;
        }
      }
      else if (event.data.direction === 'prev') {
        if (this.parent.activeChapter > 0) {
          eventInput.chapter = this.parent.chapters[this.parent.activeChapter-1].instance.subContentId;
        }
      }
      if (eventInput.chapter) {
        this.parent.trigger('newChapter', eventInput);
      }
    });
  }

  /**
   * Update progress bar.
   *
   * @param {number} chapterId Chapter Id.
   */
  updateProgressBar(chapter) {
    const barWidth = `${chapter / this.totalChapters * 100}%`;

    this.progressBar.progress.style.width = barWidth;
    const title = this.params.a11y.progress
      .replace('@page', chapter)
      .replace('@total', this.totalChapters);
    this.progressBar.progress.title = title;
  }

  /**
   * Update status bar.
   */
  updateStatusBar() {
    const currentChapter = this.parent.getActiveChapter() + 1;

    const chapterTitle = this.parent.chapters[currentChapter - 1].title;

    this.progressIndicator.current.innerHTML = currentChapter;

    this.updateProgressBar(currentChapter);

    this.chapterTitle.text.innerHTML = chapterTitle;

    this.chapterTitle.text.setAttribute('title', chapterTitle);

    //assure that the buttons are valid in terms of chapter edges
    if (this.parent.activeChapter <= 0) {
      this.setButtonStatus('Previous', true);
    }
    else {
      this.setButtonStatus('Previous', false);
    }
    if ((this.parent.activeChapter + 1) >= this.totalChapters) {
      this.setButtonStatus('Next', true);
    }
    else {
      this.setButtonStatus('Next', false);
    }
  }

  /**
   * Add traversal buttons for sequential travel (next and previous chapter)
   */
  addArrows() {
    const acm = {};

    // Initialize elements
    acm.buttonPrevious = document.createElement('div');
    acm.buttonPrevious.classList.add('navigation-button');
    acm.buttonPrevious.classList.add('icon-previous');
    acm.buttonPrevious.setAttribute('title', this.params.l10n.previousPage);

    acm.buttonWrapperPrevious = document.createElement('button');
    acm.buttonWrapperPrevious.classList.add('h5p-digibook-status-arrow');
    acm.buttonWrapperPrevious.classList.add('h5p-digibook-status-button');
    acm.buttonWrapperPrevious.onclick = () => {
      this.trigger('seqChapter', {
        direction:'prev',
        toTop: false
      });
    };
    acm.buttonWrapperPrevious.appendChild(acm.buttonPrevious);

    acm.buttonNext = document.createElement('div');
    acm.buttonNext.classList.add('navigation-button');
    acm.buttonNext.classList.add('icon-next');
    acm.buttonNext.setAttribute('title', this.params.l10n.nextPage);

    acm.buttonWrapperNext = document.createElement('button');
    acm.buttonWrapperNext.classList.add('h5p-digibook-status-arrow');
    acm.buttonWrapperNext.classList.add('h5p-digibook-status-button');
    acm.buttonWrapperNext.onclick = () => {
      this.trigger('seqChapter', {
        direction:'next',
        toTop: false
      });
    };
    acm.buttonWrapperNext.appendChild(acm.buttonNext);

    return acm;
  }

  /**
   * Add a menu button which hides and shows the navigation bar.
   *
   * @return {HTMLElement} Button node.
   */
  createMenuToggleButton() {
    const button = document.createElement('a');
    button.classList.add('icon-menu');

    const buttonWrapperMenu = document.createElement('button');
    if (this.params.behaviour.defaultTableOfContents) {
      buttonWrapperMenu.classList.add('h5p-digibook-status-menu-active');
      buttonWrapperMenu.setAttribute('aria-expanded', 'true');
    }
    buttonWrapperMenu.classList.add('h5p-digibook-status-menu');
    buttonWrapperMenu.classList.add('h5p-digibook-status-button');
    buttonWrapperMenu.title = this.params.a11y.menu;
    buttonWrapperMenu.setAttribute('aria-expanded', 'false');
    buttonWrapperMenu.setAttribute('aria-controls', 'h5p-digibook-navigation-menu');

    buttonWrapperMenu.onclick = (event) => {
      this.parent.trigger('toggleMenu');
      event.currentTarget.classList.toggle('h5p-digibook-status-menu-active');
      event.currentTarget.setAttribute(
        'aria-expanded',
        event.currentTarget.classList.contains('h5p-digibook-status-menu-active') ? 'true' : 'false'
      );
    };

    buttonWrapperMenu.appendChild(button);
    return buttonWrapperMenu;
  }

  /**
   * Add progress bar.
   *
   * @return {object} Progress bar elements.
   */
  createProgressBar() {
    const progress = document.createElement('div');
    progress.classList.add('h5p-digibook-status-progressbar-front');
    progress.setAttribute('tabindex', '-1');

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-digibook-status-progressbar-back');
    wrapper.appendChild(progress);

    return {
      wrapper,
      progress
    };
  }

  /**
   * Add a paragraph which indicates which chapter is active.
   *
   * @return {object} Chapter title elements.
   */
  addChapterTitle() {
    const text = document.createElement('h1');
    text.classList.add('title');

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-digibook-status-chapter');
    wrapper.appendChild(text);
    return {
      wrapper,
      text
    };
  }

  /**
   * Add a button which scrolls to the top of the page.
   *
   * @return {HTMLElement} Button.
   */
  createToTopButton() {
    const button = document.createElement('div');
    button.classList.add('icon-up');
    button.classList.add('navigation-button');

    const wrapper = document.createElement('button');
    wrapper.classList.add('h5p-digibook-status-to-top');
    wrapper.classList.add('h5p-digibook-status-button');
    wrapper.classList.add('h5p-digibook-status-arrow');
    wrapper.setAttribute('title', this.params.l10n.navigateToTop);
    wrapper.onclick = () => {
      this.parent.trigger('scrollToTop');
    };

    wrapper.appendChild(button);

    return wrapper;
  }

  /**
   * Set the visibility.
   *
   * @param {boolean} hide True will hide the bar.
   */
  setVisibility(hide) {
    if (hide) {
      this.wrapper.classList.add('footer-hidden');
    }
    else {
      this.wrapper.classList.remove('footer-hidden');
    }
  }

  /**
   * Add a status-button which shows current and total chapters.
   *
   * @return {object} Progress elements.
   */
  createProgressIndicator() {
    const current = document.createElement('span');
    current.classList.add('h5p-digibook-status-progress-number');

    const divider = document.createElement('span');
    divider.classList.add('h5p-digibook-status-progress-divider');
    divider.innerHTML = ' / ';

    const total = document.createElement('span');
    total.classList.add('h5p-digibook-status-progress-number');
    total.innerHTML = this.totalChapters;

    const progressText = document.createElement('p');
    progressText.classList.add('h5p-digibook-status-progress');
    progressText.appendChild(current);
    progressText.appendChild(divider);
    progressText.appendChild(total);

    const wrapper = document.createElement('div');
    wrapper.appendChild(progressText);

    return {
      wrapper,
      current,
      total,
      divider,
      progressText
    };
  }

  /**
   * Edit button state on both the top and bottom bar.
   *
   * @param {string} target Prev or Next.
   * @param {boolean} disable True will disable the target button.
   */
  setButtonStatus(target, disable) {
    if (disable) {
      this.arrows['buttonWrapper' + target].setAttribute('disabled', 'disabled');
      this.arrows['button' + target].classList.add('disabled');
    }
    else {
      this.arrows['buttonWrapper' + target].removeAttribute('disabled');
      this.arrows['button' + target].classList.remove('disabled');
    }
  }
}
export default StatusBar;

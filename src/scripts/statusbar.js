/**
 * Constructor function.
 */
class StatusBar extends H5P.EventDispatcher {
  constructor(contentId, totalChapters, parent, params) {
    super();
    this.id = contentId;
    this.parent = parent;

    this.params = this.extend(
      {
        l10n: {
          nextPage: 'Next page',
          previousPage: 'Previous page',
          navigateToTop: 'Navigate to the top',
        }
      },
      params || {}
    );

    this.totalChapters = totalChapters;
    this.arrows = this.addArrows();

    /**
     * Top row initializer
     */
    this.header = document.createElement('div');
    this.headerInfo = document.createElement('div');
    this.header.classList.add('h5p-digibook-status-header');
    this.headerInfo.classList.add('h5p-digibook-status');

    this.headerProgressBar = this.createProgressBar();
    this.headerStatus = this.createProgressIndicator();
    this.footerStatus = this.createProgressIndicator();

    this.headerChapterTitle = this.addChapterTitle();
    this.footerChapterTitle = this.addChapterTitle();

    this.header.appendChild(this.headerProgressBar.wrapper);
    this.headerInfo.appendChild(this.createMenuToggleButton());
    this.headerInfo.appendChild(this.headerChapterTitle.wrapper);
    this.headerInfo.appendChild(this.headerStatus.wrapper);
    this.headerInfo.appendChild(this.arrows.divTopPrev);
    this.headerInfo.appendChild(this.arrows.divTopNext);
    this.header.appendChild(this.headerInfo);

    /**
     * Bottom row initializer
     */
    this.footer = document.createElement('div');
    this.footer.classList.add('h5p-digibook-status-footer');
    this.footerInfo = document.createElement('div');
    this.footerInfo.classList.add('h5p-digibook-status');

    this.footerProgressBar = this.createProgressBar();

    this.footer.appendChild(this.footerProgressBar.wrapper);
    this.footerInfo.appendChild(this.createToTopButton());
    this.footerInfo.appendChild(this.footerChapterTitle.wrapper);
    this.footerInfo.appendChild(this.footerStatus.wrapper);
    this.footerInfo.appendChild(this.arrows.divBotPrev);
    this.footerInfo.appendChild(this.arrows.divBotNext);

    this.footer.appendChild(this.footerInfo);

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

    this.headerProgressBar.progress.style.width = barWidth;
    this.footerProgressBar.progress.style.width = barWidth;
  }

  /**
   * Update status bar.
   */
  updateStatusBar() {
    const currentChapter = this.parent.getActiveChapter() + 1;

    const chapterTitle =  this.parent.chapters[currentChapter - 1].title;

    this.headerStatus.current.innerHTML = currentChapter;
    this.footerStatus.current.innerHTML = currentChapter;

    this.updateProgressBar(currentChapter);

    this.headerChapterTitle.text.innerHTML = chapterTitle;
    this.footerChapterTitle.text.innerHTML = chapterTitle;

    this.headerChapterTitle.text.setAttribute('title', chapterTitle);
    this.footerChapterTitle.text.setAttribute('title', chapterTitle);

    //assure that the buttons are valid in terms of chapter edges
    if (this.parent.activeChapter <= 0) {
      this.setButtonStatus('Prev', true);
    }
    else {
      this.setButtonStatus('Prev', false);
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
    acm.divTopPrev = document.createElement('div');
    acm.divTopNext = document.createElement('div');
    acm.divBotPrev = document.createElement('div');
    acm.divBotNext = document.createElement('div');

    acm.botNext = document.createElement('a');
    acm.topNext = document.createElement('a');
    acm.botPrev = document.createElement('a');
    acm.topPrev = document.createElement('a');

    acm.divTopPrev.classList.add('h5p-digibook-status-arrow');
    acm.divTopPrev.classList.add('h5p-digibook-status-button');
    acm.divTopNext.classList.add('h5p-digibook-status-arrow');
    acm.divTopNext.classList.add('h5p-digibook-status-button');
    acm.divBotPrev.classList.add('h5p-digibook-status-arrow');
    acm.divBotPrev.classList.add('h5p-digibook-status-button');
    acm.divBotNext.classList.add('h5p-digibook-status-arrow');
    acm.divBotNext.classList.add('h5p-digibook-status-button');

    acm.topNext.classList.add('icon-next');
    acm.botNext.classList.add('icon-next');
    acm.topPrev.classList.add('icon-previous');
    acm.botPrev.classList.add('icon-previous');

    // Initialize trigger events
    acm.divTopPrev.onclick = () => {
      this.trigger('seqChapter', {
        direction:'prev',
        toTop: false
      });
    };
    acm.divTopNext.onclick = () => {
      this.trigger('seqChapter', {
        direction:'next',
        toTop: false
      });
    };

    acm.divBotPrev.onclick = () => {
      this.trigger('seqChapter', {
        direction:'prev',
        toTop: true
      });
    };
    acm.divBotNext.onclick = () => {
      this.trigger('seqChapter', {
        direction:'next',
        toTop: true
      });
    };

    // Add tooltip
    acm.topNext.setAttribute('title', this.params.l10n.nextPage);
    acm.botNext.setAttribute('title', this.params.l10n.nextPage);
    acm.topPrev.setAttribute('title', this.params.l10n.previousPage);
    acm.botPrev.setAttribute('title', this.params.l10n.previousPage);

    // Attach to the respective divs
    acm.divTopNext.appendChild(acm.topNext);
    acm.divTopPrev.appendChild(acm.topPrev);
    acm.divBotNext.appendChild(acm.botNext);
    acm.divBotPrev.appendChild(acm.botPrev);

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

    const buttonWrapper = document.createElement('div');
    if (this.params.behaviour.defaultTableOfContents) {
      buttonWrapper.classList.add('h5p-digibook-status-menu-active');
    }
    buttonWrapper.classList.add('h5p-digibook-status-menu', 'h5p-digibook-status-button');

    buttonWrapper.onclick = (event) => {
      this.parent.trigger('toggleMenu');
      event.currentTarget.classList.toggle('h5p-digibook-status-menu-active');
    };

    buttonWrapper.appendChild(button);
    return buttonWrapper;
  }

  /**
   * Add progress bar.
   *
   * @return {object} Progress bar elements.
   */
  createProgressBar() {
    const progress = document.createElement('div');
    progress.classList.add('h5p-digibook-status-progressbar-front');

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
    const text = document.createElement('p');

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
    const button = document.createElement('a');
    button.classList.add ('icon-up');
    button.setAttribute('title', this.params.l10n.navigateToTop);
    button.onclick = () => {
      this.parent.trigger('scrollToTop');
    };

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-digibook-status-button');
    wrapper.classList.add('h5p-digibook-status-arrow');
    wrapper.appendChild(button);

    return wrapper;
  }

  /**
   * Set the footer visibility.
   *
   * @param {boolean} hide True will hide the footer.
   */
  setFooterVisibility(hide) {
    if (hide) {
      this.footer.classList.add('footer-hidden');
    }
    else {
      this.footer.classList.remove('footer-hidden');
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
      this.arrows['top'+target].classList.add('disabled');
      this.arrows['bot'+target].classList.add('disabled');
    }
    else {
      this.arrows['top'+target].classList.remove('disabled');
      this.arrows['bot'+target].classList.remove('disabled');
    }
  }

  /**
   * Extend an array just like JQuery's extend.
   *
   * @param {object} arguments Objects to be merged.
   * @return {object} Merged objects.
   */
  extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }
}
export default StatusBar;

import URLTools from './urltools';

class PageContent extends H5P.EventDispatcher {
  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config, contentId, contentData, parent, params) {
    super();
    this.parent = parent;
    this.behaviour = config.behaviour;

    this.params = params;
    this.targetPage = {};
    this.targetPage.redirectFromComponent = false;

    // Div-elements of the abovementioned h5p-instances
    this.columnElements = [];

    this.chapters = this.createColumns(config, contentId, contentData);

    this.div = document.createElement('div');
    this.div.classList.add('h5p-digibook-main');

    this.content = this.createPageContent();
    this.addcontentListener();

    this.div.appendChild(this.content);
  }

  /**
   * Get chapters.
   *
   * @return {object[]} Chapters.
   */
  getChapters() {
    return this.chapters;
  }

  /**
   * Create page content.
   *
   * @return {HTMLElement} Page content.
   */
  createPageContent() {
    const content = document.createElement('div');
    content.classList.add('h5p-digibook-content');
    this.columnElements.forEach(element => {
      content.appendChild(element);
    });

    return content;
  }

  /**
   * Create page read mark.
   *
   * @return {object} Generating data.
   */
  createPageReadMark() {
    const div = document.createElement('div');
    const checkText = document.createElement('p');
    checkText.innerHTML = this.params.l10n.markAsFinished;

    const markRead = document.createElement('input');
    markRead.setAttribute('type', 'checkbox');
    div.classList.add('h5p-digibook-status-progress-marker');
    markRead.onclick = () => {
      this.parent.setChapterRead();
      markRead.disabled = true;
    };

    div.appendChild(markRead);
    div.appendChild(checkText);

    return {
      div,
      markRead,
      checkText
    };
  }

  /**
   * Inject section instance UUID into DOM.
   *
   * @param {object[]} sections Sections.
   * @param {HTMLElement} columnElement Column element.
   */
  injectSectionId(sections, columnElement) {
    const colContent = columnElement.getElementsByClassName('h5p-column-content');

    for (let i = 0; i < sections.length; i++) {
      colContent[i].id = sections[i].instance.subContentId;
    }
  }

  /**
   * Create Column instances.
   *
   * @param {object} config Parameters.
   * @param {number} contentId Content id.
   * @param {object} contentData Content data.
   * @return {object[]} Column instances.
   */
  createColumns(config, contentId, contentData) {
    const redirObject = URLTools.extractFragmentsFromURL(this.parent.validateFragments);
    const chapters = [];

    //Go through all columns and initialise them
    for (let i = 0; i < config.chapters.length; i++) {
      const newColumn = document.createElement('div');
      const newInstance = H5P.newRunnable(config.chapters[i], contentId, H5P.jQuery(newColumn), contentData);
      newInstance.on('resize', (event) => {
        // Prevent sending event back down
        this.parent.bubblingUpwards = true;

        // Resize ourself
        this.parent.trigger('resize', event);

        // Reset
        this.parent.bubblingUpwards = false;
      });

      const chapter = {
        instance: newInstance,
        title: config.chapters[i].metadata.title,
        completed: false,
        tasksLeft: 0,
        sections: newInstance.getInstances().map(instance => ({
          instance: instance,
          isTask: false
        }))
      };

      newColumn.classList.add('h5p-digibook-chapter');
      newColumn.id = newInstance.subContentId;

      if (this.behaviour.progressIndicators && !this.behaviour.progressAuto) {
        const checkPage = this.createPageReadMark();
        newColumn.appendChild(checkPage.div);
      }

      //Find sections with tasks and tracks them
      if (this.behaviour.progressIndicators) {
        chapter.sections.forEach(section => {
          if (this.isH5PTask(section.instance)) {
            section.isTask = true;
            section.taskDone = false;
            chapter.tasksLeft += 1;
          }
        });
      }
      chapter.maxTasks = chapter.tasksLeft;

      this.injectSectionId(chapter.sections, newColumn);

      //Register both the HTML-element and the H5P-element
      chapters.push(chapter);
      this.columnElements.push(newColumn);
    }

    this.parent.on('resize', (event) => {
      if (this.parent.bubblingUpwards) {
        return; // Prevent sending back down.
      }

      for (var i = 0; i < this.chapters.length; i++) {
        // Only resize the visible column
        if (this.columnElements[i].offsetParent !== null) {
          this.chapters[i].instance.trigger('resize', event);
        }
      }
    });

    // First chapter should be visible, except if the URL says otherwise.
    let chosenChapter = this.columnElements[0].id;
    if (redirObject.chapter && redirObject.h5pbookid == this.parent.contentId) {
      const chapterIndex = this.findChapterIndex(redirObject.chapter);
      this.parent.setActiveChapter(chapterIndex);
      chosenChapter = redirObject.chapter;

      if (redirObject.section) {
        setTimeout(() => {
          this.redirectSection(redirObject.section);
          if (this.parent.doesCoverExist()) {
            this.parent.cover.removeCover();
          }
        }, 1000);
      }
    }

    this.columnElements.filter(x => x.id !== chosenChapter)
      .forEach(x => x.classList.add('h5p-content-hidden'));

    return chapters;
  }

  /**
   * Check if instance is an H5P task.
   *
   * @param {H5P.Runnable} instance H5P instance.
   * @return {boolean} True, if instance is an H5P task.
   */
  isH5PTask(instance) {
    if (typeof instance.getMaxScore === 'function') {
      return instance.getMaxScore() > 0;
    }
    return false;
  }

  /**
   * Redirect section.
   *
   * @param {string} sectionUUID Section UUID or top.
   */
  redirectSection(sectionUUID) {
    if (sectionUUID === 'top') {
      this.parent.trigger('scrollToTop');
    }
    else {
      const section = document.getElementById(sectionUUID);
      if (section) {
        section.scrollIntoView(true);
        this.targetPage.redirectFromComponent = false;
      }
    }
  }

  /**
   * Find chapter index.
   *
   * @param {string} chapterUUID Chapter UUID.
   * @return {number} Chapter id.
   */
  findChapterIndex(chapterUUID) {
    let position = -1;
    this.columnElements.forEach((element, index) => {
      if (position !== -1) {
        return; // Skip
      }
      if (element.id === chapterUUID) {
        position = index;
      }
    });

    return position;
  }

  /**
   * Change chapter.
   *
   * @param {boolean} redirectOnLoad True if should redirect on load.
   * @param {object} target Target.
   */
  changeChapter(redirectOnLoad, target) {
    if (this.parent.animationInProgress) {
      return;
    }

    this.targetPage = target;
    const oldChapterNum = this.parent.getActiveChapter();
    const newChapterNum = this.parent.getChapterId(this.targetPage.chapter);

    if (newChapterNum < this.columnElements.length) {
      const oldChapter = this.columnElements[oldChapterNum];
      const targetChapter = this.columnElements[newChapterNum];
      const hasChangedChapter = oldChapterNum !== newChapterNum;

      if (hasChangedChapter && !redirectOnLoad) {
        this.parent.animationInProgress = true;
        this.parent.setActiveChapter(newChapterNum);

        // The pages will progress from right to left or vice versa.
        const newPageProgress = (oldChapterNum < newChapterNum) ? 'right' : 'left';
        const oldPageProgress = (oldChapterNum < newChapterNum) ? 'left' : 'right';

        // Set up the slides
        targetChapter.classList.add('h5p-digibook-animate-new');
        targetChapter.classList.add(`h5p-digibook-offset-${newPageProgress}`);
        targetChapter.classList.remove('h5p-content-hidden');

        // Play the animation
        setTimeout(() => {
          oldChapter.classList.add(`h5p-digibook-offset-${oldPageProgress}`);
          targetChapter.classList.remove(`h5p-digibook-offset-${newPageProgress}`);
        }, 50);
      }
      else {
        if (this.parent.cover && !this.parent.cover.div.hidden) {
          this.parent.on('coverRemoved', () => {
            this.redirectSection(this.targetPage.section);
          });
        }
        else {
          this.redirectSection(this.targetPage.section);
        }
      }

      this.parent.sideBar.redirectHandler(newChapterNum);
      if (!redirectOnLoad) {
        this.parent.updateChapterProgress(oldChapterNum, hasChangedChapter);
      }
    }
  }

  /**
   * Add content listener.
   */
  addcontentListener() {
    this.content.addEventListener('transitionend', (event) => {
      const activeChapter = this.parent.getActiveChapter();

      if (event.propertyName === 'transform' && event.target === this.columnElements[activeChapter]) {
        // Remove all animation-related classes
        const inactiveElems = this.columnElements.filter(x => x !== this.columnElements[activeChapter]);
        inactiveElems.forEach(x => {
          x.classList.remove('h5p-digibook-offset-right');
          x.classList.remove('h5p-digibook-offset-left');
          x.classList.add('h5p-content-hidden');
        });

        const activeElem = this.columnElements[activeChapter];

        activeElem.classList.remove('h5p-digibook-offset-right');
        activeElem.classList.remove('h5p-digibook-offset-left');
        activeElem.classList.remove('h5p-digibook-animate-new');
        this.updateFooter();

        //Focus on section only after the page scrolling is finished
        this.parent.animationInProgress = false;
        this.redirectSection(this.targetPage.section);

        this.parent.trigger('resize');
      }
    });
  }

  /**
   * Update footer.
   */
  updateFooter() {
    const activeChapter = this.parent.getActiveChapter();
    const column = this.columnElements[activeChapter];
    const shouldFooterBeVisible = this.parent.shouldFooterBeVisible(column.clientHeight);
    this.parent.statusBar.editFooterVisibillity(shouldFooterBeVisible);
  }
}

export default PageContent;

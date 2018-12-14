/**
 * A component which helps in navigation
 * Constructor function.
 */
class SideBar extends H5P.EventDispatcher {
  constructor(config, contentId, mainTitle, parent) {
    super();
    this.id = contentId;
    this.parent = parent;
    this.behaviour = config.behaviour;
    this.content = document.createElement('ul');
    this.content.classList.add('navigation-list');
    this.div = this.addSideBar();

    this.chapters = this.findAllChapters(config.chapters);
    this.chapterElems = this.getChapterElements();


    if (mainTitle) {
      this.titleElem = this.addMainTitle(mainTitle);
      this.div.appendChild(this.titleElem.div);
    }

    this.chapterElems.forEach(element => {
      this.content.appendChild(element);
    });

    this.div.appendChild(this.content);

    this.addTransformListener();
    this.initializeNavigationControls();
  }

  initializeNavigationControls() {
    const keyCodes = Object.freeze({
      'UP': 38,
      'DOWN': 40,
    });

    this.chapterElems.forEach((chapter, i) => {
      const chapterButton = chapter.querySelector('.h5p-digibook-navigation-chapter-button');
      chapterButton.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
          case keyCodes.UP:
            this.setFocusToChapterItem(i, -1);
            e.preventDefault();
            break;

          case keyCodes.DOWN:
            this.setFocusToChapterItem(i, 1);
            e.preventDefault();
            break;
        }
      });

      const sections = chapter.querySelectorAll('.h5p-digibook-navigation-section');
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = sections[sectionIndex];
        const sectionButton = section.querySelector('.section-button');
        sectionButton.addEventListener('keydown', e => {
          switch (e.keyCode) {
            case keyCodes.UP:
              this.setFocusToSectionItem(i, sectionIndex, -1);
              e.preventDefault();
              break;

            case keyCodes.DOWN:
              this.setFocusToSectionItem(i, sectionIndex, 1);
              e.preventDefault();
              break;
          }
        });
      }
    });
  }

  setFocusToChapterItem(index, direction = 0) {
    let nextIndex = index + direction;
    if (nextIndex < 0) {
      nextIndex = this.chapterElems.length - 1;
    }
    else if (nextIndex > this.chapterElems.length - 1) {
      nextIndex = 0;
    }

    // Check if we should navigate to a section
    if (direction) {
      const chapterIndex = direction > 0 ? index : nextIndex;
      const chapter = this.chapterElems[chapterIndex];
      if (!chapter.classList.contains('h5p-digibook-navigation-closed')) {
        const sections = chapter.querySelectorAll('.h5p-digibook-navigation-section');
        if (sections.length) {
          const sectionItemIndex = direction > 0 ? 0 : sections.length - 1;
          this.setFocusToSectionItem(chapterIndex, sectionItemIndex);
          return;
        }
      }
    }

    const nextChapter = this.chapterElems[nextIndex];
    const chapterButton = nextChapter.querySelector('.h5p-digibook-navigation-chapter-button');
    this.setFocusToItem(chapterButton, nextIndex);
  }

  setFocusToSectionItem(chapterIndex, index, direction = 0) {
    const chapter = this.chapterElems[chapterIndex];
    const sections = chapter.querySelectorAll('.h5p-digibook-navigation-section');

    // Navigate chapter if outside of section bounds
    const nextIndex = index + direction;
    if (nextIndex > sections.length - 1) {
      this.setFocusToChapterItem(chapterIndex + 1);
      return;
    }
    else  if (nextIndex < 0) {
      this.setFocusToChapterItem(chapterIndex);
      return;
    }

    const section = sections[nextIndex];
    const sectionButton = section.querySelector('.section-button');
    this.setFocusToItem(sectionButton, chapterIndex);
  }

  setFocusToItem(element, chapterIndex, skipFocusing = false) {
    // Remove focus from all other elements
    this.chapterElems.forEach((chapter) => {
      const chapterButton = chapter.querySelector('.h5p-digibook-navigation-chapter-button');
      chapterButton.setAttribute('tabindex', '-1');

      const sections = chapter.querySelectorAll('.h5p-digibook-navigation-section');
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionButton = section.querySelector('.section-button');
        sectionButton.setAttribute('tabindex', '-1');

      }
    });

    element.setAttribute('tabindex', '0');
    this.focusedChapter = chapterIndex;
    if (!skipFocusing) {
      element.focus();
    }
  }

  /**
   * Get sidebar DOM.
   *
   * @return {HTMLElement} DOM for sidebar.
   */
  addSideBar() {
    const main = document.createElement('nav');
    main.id = 'h5p-digibook-navigation-menu';
    main.classList.add('h5p-digibook-navigation');
    if (!this.behaviour.defaultTableOfContents) {
      main.classList.add('h5p-digibook-hide');
    }

    return main;
  }

  /**
   * Get main title.
   *
   * @param {string} title Title.
   * @return {object} DOM elements.
   */
  addMainTitle(title) {
    const div = document.createElement('div');
    const p = document.createElement('h2');
    p.classList.add('navigation-title');

    div.classList.add('h5p-digibook-navigation-maintitle');

    p.innerHTML = title;
    p.setAttribute('title', title);
    div.appendChild(p);
    return {
      div,
      p
    };
  }

  /**
   * Find sections in chapter.
   *
   * @param {object} columnData Column data.
   * @return {object[]} Sections data.
   */
  findSectionsInChapter(columnData) {
    const tmp = [];
    const sections = columnData.params.content;
    for (let j = 0; j < sections.length; j++) {
      try {
        const content = sections[j].content;
        const isLink = (content.library.split(' ')[0] === 'H5P.Link');
        const title = (isLink ? (content.params.title ? content.params.title : 'New link') : content.metadata.title);
        const id = content.subContentId;
        tmp.push({
          title,
          id
        });
      }
      catch (err) {
        continue;
      }
    }
    return tmp;
  }

  /**
   * Find all chapters.
   *
   * @param {object[]} columnsData Columns data.
   * @return {object[]} Chapters data.
   */
  findAllChapters(columnsData) {
    const chapters = [];
    for (let i = 0; i < columnsData.length; i++) {
      const sections = this.findSectionsInChapter(columnsData[i]);
      const chapterTitle = columnsData[i].metadata.title;
      const id = columnsData[i].subContentId;
      chapters.push({
        sections,
        title:chapterTitle,
        id
      });
    }
    return chapters;
  }

  /**
   * Edit chapter status.
   *
   * @param {HTMLElement} element Chapter.
   * @param {boolean} collapse If true, will collapse chapter.
   */
  editChapterStatus(element, collapse) {
    const arrow = element.getElementsByClassName('icon-collapsed')[0];

    if (collapse === true) {
      element.classList.add('h5p-digibook-navigation-closed');
      const chapterButton = element.querySelector('.h5p-digibook-navigation-chapter-button');
      chapterButton.setAttribute('aria-expanded', 'false');
      if (arrow) {
        arrow.classList.remove('icon-expanded');
        arrow.classList.add('icon-collapsed');
      }
    }
    else {
      element.classList.remove('h5p-digibook-navigation-closed');
      const chapterButton = element.querySelector('.h5p-digibook-navigation-chapter-button');
      chapterButton.setAttribute('aria-expanded', 'true');
      if (arrow) {
        arrow.classList.remove('icon-collapsed');
        arrow.classList.add('icon-expanded');
      }
    }
  }


  /**
   * Fires whenever a redirect is happening in parent
   * All chapters will be collapsed except for the active
   *
   * @param {number} newChapter The chapter that should stay open in the menu.
   */
  redirectHandler(newChapter) {
    this.chapterElems.filter(x =>
      this.chapterElems.indexOf(x) != newChapter).forEach(x => this.editChapterStatus(x, true));

    const targetElem = this.chapterElems[newChapter];
    this.editChapterStatus(targetElem, false);

    // Focus new chapter button if active chapter was closed
    if (newChapter !== this.focusedChapter) {
      const chapterButton = targetElem.querySelector('.h5p-digibook-navigation-chapter-button');
      this.setFocusToItem(chapterButton, newChapter, true);
    }
  }

  /**
   * Reset indicators.
   */
  resetIndicators() {
    this.chapterElems.forEach((element, index) => {
      // Reset chapter
      this.updateChapterProgressIndicator(index, 'BLANK');

      // Reset sections
      const sections = element.getElementsByClassName('h5p-digibook-navigation-section');
      for (let section of sections) {
        const icon = section.getElementsByTagName('span')[0];
        if (icon) {
          icon.classList.remove('icon-question-answered');
          icon.classList.add('icon-chapter-blank');
        }
      }
    });
  }

  /**
   * Manually set the target chapter as complete
   * @param {number} current - Current chapter
   */
  setChapterIndicatorComplete(current) {
    let targetElem = this.chapterElems[current].getElementsByClassName('h5p-digibook-navigation-chapter-button')[0];
    targetElem = targetElem.getElementsByClassName('h5p-digibook-navigation-chapter-progress')[0];
    targetElem.classList.remove('icon-chapter-blank');
    targetElem.classList.add('icon-chapter-done');
  }

  /**
   * Update the indicator on a specific chapter.
   *
   * @param {number} chapterId The chapter that should be updated.
   * @param {string} status Status.
   */
  updateChapterProgressIndicator(chapterId, status) {

    let targetElem = this.chapterElems[chapterId].getElementsByClassName('h5p-digibook-navigation-chapter-button')[0];
    targetElem = targetElem.getElementsByClassName('h5p-digibook-navigation-chapter-progress')[0];

    if (status === 'BLANK') {
      targetElem.classList.remove('icon-chapter-started');
      targetElem.classList.remove('icon-chapter-done');
      targetElem.classList.add('icon-chapter-blank');
    }
    else if (status === 'DONE') {
      targetElem.classList.remove('icon-chapter-blank');
      targetElem.classList.remove('icon-chapter-started');
      targetElem.classList.add('icon-chapter-done');
    }
    else if (status === 'STARTED') {
      targetElem.classList.remove('icon-chapter-blank');
      targetElem.classList.remove('icon-chapter-done');
      targetElem.classList.add('icon-chapter-started');
    }
  }

  /**
   * Set section marker.
   *
   * @param {number} chapterId Chapter Id.
   * @param {number} sectionId Section Id.
   */
  setSectionMarker(chapterId, sectionId) {
    const tmp = this.chapterElems[chapterId].getElementsByClassName('h5p-digibook-navigation-section')[sectionId];
    const icon = tmp.getElementsByTagName('span')[0];
    if (icon) {
      icon.classList.remove('icon-chapter-blank');
      icon.classList.add('icon-question-answered');
    }
  }

  /**
   * Toggle chapter.
   *
   * @param {HTMLElement} element Chapter element.
   */
  toggleChapter(element) {
    const x = element.currentTarget.parentElement;
    const bool = !(x.classList.contains('h5p-digibook-navigation-closed'));
    this.editChapterStatus(x, bool);
    this.parent.trigger('resize');
  }

  /**
   * Create chapter.
   *
   * @param {object} chapter Chapter data.
   * @param {number} chapterId Chapter Id.
   * @return {object} Chapter elements.
   */
  createElemFromChapter(chapter, chapterId) {
    const that = this;

    //Initialize elements
    const chapterDiv = document.createElement('li');
    const sectionsDiv = document.createElement('ul');
    const titleDiv = document.createElement('button');
    titleDiv.setAttribute('tabindex', chapterId === 0 ? '0' : '-1');
    const title = document.createElement('p');

    //Add classes
    titleDiv.classList.add('h5p-digibook-navigation-chapter-button');
    chapterDiv.classList.add('h5p-digibook-navigation-chapter');
    sectionsDiv.classList.add('h5p-digibook-navigation-sectionlist');
    const sectionsDivId = 'h5p-digibook-sectionlist-' + chapterId;
    sectionsDiv.id = sectionsDivId;

    title.innerHTML = chapter.title;
    title.setAttribute('title', chapter.title);

    const arrowIcon = document.createElement('span');
    const circleIcon = document.createElement('span');

    arrowIcon.classList.add('h5p-digibook-navigation-chapter-accordion');
    if (this.behaviour.progressIndicators) {
      circleIcon.classList.add('icon-chapter-blank');
      circleIcon.classList.add('h5p-digibook-navigation-chapter-progress');
    }

    if (this.parent.activeChapter !== chapterId) {
      chapterDiv.classList.add('h5p-digibook-navigation-closed');
      arrowIcon.classList.add('icon-collapsed');
      titleDiv.setAttribute('aria-expanded', 'false');
    }
    else {
      arrowIcon.classList.add('icon-expanded');
      titleDiv.setAttribute('aria-expanded', 'true');
    }
    titleDiv.setAttribute('aria-controls', sectionsDivId);

    titleDiv.appendChild(arrowIcon);
    titleDiv.appendChild(title);
    titleDiv.appendChild(circleIcon);
    chapterDiv.appendChild(titleDiv);

    titleDiv.onclick = (event) => {
      this.toggleChapter(event);
    };

    // Add sections to the chapter
    for (let i = 0; i < this.chapters[chapterId].sections.length; i++) {
      const section = this.chapters[chapterId].sections[i];

      const singleSection = document.createElement('li');
      const a = document.createElement('button');
      a.classList.add('section-button');
      a.setAttribute('tabindex', '-1');
      const span = document.createElement('span');
      const icon = document.createElement('span');
      singleSection.classList.add('h5p-digibook-navigation-section');
      span.innerHTML = section.title;
      span.setAttribute('title', section.title);
      span.classList.add('digibook-sectiontitle');
      icon.classList.add('icon-chapter-blank');

      if (this.parent.chapters[chapterId].sections[i].isTask) {
        icon.classList.add('h5p-digibook-navigation-section-task');
      }
      a.appendChild(icon);

      a.appendChild(span);
      singleSection.appendChild(a);

      sectionsDiv.appendChild(singleSection);
      a.onclick = e => {
        that.parent.trigger('newChapter', {
          h5pbookid: that.parent.contentId,
          chapter: this.chapters[chapterId].id,
          section: section.id
        });
        e.preventDefault();
      };
    }
    if (chapter.tasksLeft) {
      chapter.maxTasks = chapter.tasksLeft;
    }
    chapterDiv.appendChild(sectionsDiv);

    return {
      chapterDiv,
      sectionsDiv
    };
  }

  /**
   * Get chapter elements.
   *
   * @return {HTMLElement[]} Chapter elements.
   */
  getChapterElements() {
    let tmp = [];
    for (let i = 0; i < this.chapters.length; i++) {
      const chapter = this.chapters[i];
      const elem = this.createElemFromChapter(chapter, i);
      tmp.push(elem.chapterDiv);
    }
    this.focusedChapter = 0;
    return tmp;
  }

  /**
   * Add transform listener.
   */
  addTransformListener() {
    this.div.addEventListener('transitionend', (event) => {
      if (event.propertyName === 'flex-basis') {
        // TODO: Check what this check is used for
        this.parent.trigger('resize');
      }
    });
  }
}
export default SideBar;

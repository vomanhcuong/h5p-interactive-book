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
    this.content = document.createElement('div');
    this.content.classList.add('navigation-list');
    this.container = this.addSideBar();

    this.chapters = this.findAllChapters(config.chapters);
    this.chapterNodes = this.getChapterNodes();

    if (mainTitle) {
      this.titleElem = this.addMainTitle(mainTitle);
      this.container.appendChild(this.titleElem);
    }

    this.chapterNodes.forEach(element => {
      this.content.appendChild(element);
    });

    this.container.appendChild(this.content);

    this.addTransformListener();
    this.initializeNavigationControls();
  }

  initializeNavigationControls() {
    const keyCodes = Object.freeze({
      'UP': 38,
      'DOWN': 40,
    });

    this.chapterNodes.forEach((chapter, i) => {
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
    this.chapterNodes.forEach((chapter) => {
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
    const container = document.createElement('div');
    container.id = 'h5p-digibook-navigation-menu';
    container.classList.add('h5p-digibook-navigation');
    if (!this.behaviour.defaultTableOfContents) {
      container.classList.add('h5p-digibook-hide');
    }

    return container;
  }

  /**
   * Get main title.
   *
   * @param {string} title Title.
   * @return {HTMLElement} Title element.
   */
  addMainTitle(titleText) {
    const title = document.createElement('h2');
    title.classList.add('navigation-title');
    title.innerHTML = titleText;
    title.setAttribute('title', titleText);

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('h5p-digibook-navigation-maintitle');
    titleWrapper.appendChild(title);

    return titleWrapper;
  }

  /**
   * Find sections in chapter.
   *
   * @param {object} columnData Column data.
   * @return {object[]} Sections data.
   */
  findSectionsInChapter(columnData) {
    const sectionsData = [];
    const sections = columnData.params.content;
    for (let j = 0; j < sections.length; j++) {
      const content = sections[j].content;

      let title = '';
      switch (content.library.split(' ')[0]) {
        case 'H5P.Link':
          if (content.params.title) {
            title = content.params.title;
          }
          else if (content.params.linkWidget.url) {
            title = content.params.linkWidget.protocol + content.params.linkWidget.url;
          }
          else {
            title = 'Link';
          }
          break;
        default:
          title = content.metadata.title;
      }

      const id = content.subContentId;

      sectionsData.push({
        title,
        id
      });
    }

    return sectionsData;
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
        sections: sections,
        title: chapterTitle,
        id: id
      });
    }
    return chapters;
  }

  /**
   * Collapse/uncollapse chapter.
   *
   * @param {HTMLElement} chapterNode Chapter.
   * @param {boolean} collapse If true, will collapse chapter.
   */
  collapseChapter(chapterNode, collapse) {
    const arrow = chapterNode.getElementsByClassName('h5p-digibook-navigation-chapter-accordion')[0];

    if (collapse === true) {
      chapterNode.classList.add('h5p-digibook-navigation-closed');
      const chapterButton = chapterNode.querySelector('.h5p-digibook-navigation-chapter-button');
      chapterButton.setAttribute('aria-expanded', 'false');
      if (arrow) {
        arrow.classList.remove('icon-expanded');
        arrow.classList.add('icon-collapsed');
      }
    }
    else {
      chapterNode.classList.remove('h5p-digibook-navigation-closed');
      const chapterButton = chapterNode.querySelector('.h5p-digibook-navigation-chapter-button');
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
   * @param {number} chapterId The chapter that should stay open in the menu.
   */
  redirectHandler(chapterId) {
    this.chapterNodes.forEach((node, index) => {
      this.collapseChapter(node, index !== chapterId);
    });

    // Focus new chapter button if active chapter was closed
    if (chapterId !== this.focusedChapter) {
      const chapterButton = this.chapterNodes[chapterId].querySelector('.h5p-digibook-navigation-chapter-button');
      this.setFocusToItem(chapterButton, chapterId, true);
    }
  }

  /**
   * Reset indicators.
   */
  resetIndicators() {
    this.chapterNodes.forEach((node, index) => {
      // Reset chapter
      this.updateChapterProgressIndicator(index, 'BLANK');

      // Reset sections
      const sections = node.getElementsByClassName('h5p-digibook-navigation-section');
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
    const progressIndicator = this.chapterNodes[chapterId]
      .getElementsByClassName('h5p-digibook-navigation-chapter-progress')[0];

    if (status === 'BLANK') {
      progressIndicator.classList.remove('icon-chapter-started');
      progressIndicator.classList.remove('icon-chapter-done');
      progressIndicator.classList.add('icon-chapter-blank');
    }
    else if (status === 'DONE') {
      progressIndicator.classList.remove('icon-chapter-blank');
      progressIndicator.classList.remove('icon-chapter-started');
      progressIndicator.classList.add('icon-chapter-done');
    }
    else if (status === 'STARTED') {
      progressIndicator.classList.remove('icon-chapter-blank');
      progressIndicator.classList.remove('icon-chapter-done');
      progressIndicator.classList.add('icon-chapter-started');
    }
  }

  /**
   * Set section marker.
   *
   * @param {number} chapterId Chapter Id.
   * @param {number} sectionId Section Id.
   */
  setSectionMarker(chapterId, sectionId) {
    const icon = this.chapterNodes[chapterId]
      .getElementsByClassName('h5p-digibook-navigation-section')[sectionId]
      .getElementsByTagName('span')[0];

    if (icon) {
      icon.classList.remove('icon-chapter-blank');
      icon.classList.add('icon-question-answered');
    }
  }

  /**
   * Toggle chapter.
   *
   * @param {HTMLElement} chapterNode Chapter element.
   */
  toggleChapter(chapterNode) {
    const collapse = !(chapterNode.classList.contains('h5p-digibook-navigation-closed'));
    this.collapseChapter(chapterNode, collapse);
    this.parent.trigger('resize');
  }

  /**
   * Toggle sidebar visibility.
   */
  toggle() {
    this.container.classList.toggle('h5p-digibook-hide');
  }

  /**
   * Create chapter.
   *
   * @param {object} chapter Chapter data.
   * @param {number} chapterId Chapter Id.
   * @return {HTMLElement} Chapter node.
   */
  getNodesFromChapter(chapter, chapterId) {
    // TODO: Clean this up. Will require to receive chapter info from parent instead of building itself
    const chapterCollapseIcon = document.createElement('span');
    chapterCollapseIcon.classList.add('h5p-digibook-navigation-chapter-accordion');

    const chapterTitleText = document.createElement('p');
    chapterTitleText.innerHTML = chapter.title;
    chapterTitleText.setAttribute('title', chapter.title);

    const chapterCompletionIcon = document.createElement('span');
    if (this.behaviour.progressIndicators) {
      chapterCompletionIcon.classList.add('icon-chapter-blank', 'h5p-digibook-navigation-chapter-progress');
    }

    const chapterNodeTitle = document.createElement('button');
    chapterNodeTitle.setAttribute('tabindex', chapterId === 0 ? '0' : '-1');
    chapterNodeTitle.classList.add('h5p-digibook-navigation-chapter-button');
    if (this.parent.activeChapter !== chapterId) {
      chapterCollapseIcon.classList.add('icon-collapsed');
      chapterNodeTitle.setAttribute('aria-expanded', 'false');
    }
    else {
      chapterCollapseIcon.classList.add('icon-expanded');
      chapterNodeTitle.setAttribute('aria-expanded', 'true');
    }
    chapterNodeTitle.setAttribute('aria-controls', sectionsDivId);
    chapterNodeTitle.onclick = (event) => {
      this.toggleChapter(event.currentTarget.parentElement);
    };
    chapterNodeTitle.appendChild(chapterCollapseIcon);
    chapterNodeTitle.appendChild(chapterTitleText);
    chapterNodeTitle.appendChild(chapterCompletionIcon);

    const chapterNode = document.createElement('li');
    chapterNode.classList.add('h5p-digibook-navigation-chapter');
    chapterNode.appendChild(chapterNodeTitle);
    if (this.parent.activeChapter !== chapterId) {
      chapterNode.classList.add('h5p-digibook-navigation-closed');
    }

    const sectionsWrapper = document.createElement('ul');
    sectionsWrapper.classList.add('h5p-digibook-navigation-sectionlist');
    const sectionsDivId = 'h5p-digibook-sectionlist-' + chapterId;
    sectionsWrapper.id = sectionsDivId;
    // Add sections to the chapter
    for (let i = 0; i < this.chapters[chapterId].sections.length; i++) {
      const section = this.chapters[chapterId].sections[i];

      const sectionTitleText = document.createElement('span');
      sectionTitleText.innerHTML = section.title;
      sectionTitleText.setAttribute('title', section.title);
      sectionTitleText.classList.add('digibook-sectiontitle');

      const sectionCompletionIcon = document.createElement('span');
      sectionCompletionIcon.classList.add('icon-chapter-blank');
      if (this.parent.chapters[chapterId].sections[i].isTask) {
        sectionCompletionIcon.classList.add('h5p-digibook-navigation-section-task');
      }

      const sectionLink = document.createElement('button');
      sectionLink.classList.add('section-button');
      sectionLink.setAttribute('tabindex', '-1');
      sectionLink.onclick = (event) => {
        this.parent.trigger('newChapter', {
          h5pbookid: this.parent.contentId,
          chapter: this.chapters[chapterId].id,
          section: section.id
        });
        event.preventDefault();
      };
      sectionLink.appendChild(sectionCompletionIcon);
      sectionLink.appendChild(sectionTitleText);

      const sectionNode = document.createElement('li');
      sectionNode.classList.add('h5p-digibook-navigation-section');
      sectionNode.appendChild(sectionLink);

      sectionsWrapper.appendChild(sectionNode);
    }

    if (chapter.tasksLeft) {
      chapter.maxTasks = chapter.tasksLeft;
    }
    chapterNode.appendChild(sectionsWrapper);

    return chapterNode;
  }

  /**
   * Get chapter elements.
   *
   * @return {HTMLElement[]} Chapter elements.
   */
  getChapterNodes() {
    this.focusedChapter = 0;
    return this.chapters.map((chapter, index) => this.getNodesFromChapter(chapter, index));
  }

  /**
   * Add transform listener.
   */
  addTransformListener() {
    this.container.addEventListener('transitionend', (event) => {
      // propertyName is used trigger once, not for every property that has transitionend
      if (event.propertyName === 'flex-basis') {
        this.parent.trigger('resize');
      }
    });
  }
}
export default SideBar;

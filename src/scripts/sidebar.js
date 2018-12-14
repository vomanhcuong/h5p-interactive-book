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
  }

  /**
   * Get sidebar DOM.
   *
   * @return {HTMLElement} DOM for sidebar.
   */
  addSideBar() {
    const container = document.createElement('div');

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
    const title = document.createElement('p');
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
      if (arrow) {
        arrow.classList.remove('icon-expanded');
        arrow.classList.add('icon-collapsed');
      }
    }
    else {
      chapterNode.classList.remove('h5p-digibook-navigation-closed');
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
    if (this.parent.activeChapter !== chapterId) {
      chapterCollapseIcon.classList.add('icon-collapsed');
    }
    else {
      chapterCollapseIcon.classList.add('icon-expanded');
    }

    const chapterTitleText = document.createElement('p');
    chapterTitleText.innerHTML = chapter.title;
    chapterTitleText.setAttribute('title', chapter.title);

    const chapterCompletionIcon = document.createElement('span');
    if (this.behaviour.progressIndicators) {
      chapterCompletionIcon.classList.add('icon-chapter-blank', 'h5p-digibook-navigation-chapter-progress');
    }

    const chapterNodeTitle = document.createElement('div');
    chapterNodeTitle.classList.add('h5p-digibook-navigation-chapter-title');
    chapterNodeTitle.onclick = (event) => {
      this.toggleChapter(event.currentTarget.parentElement);
    };
    chapterNodeTitle.appendChild(chapterCollapseIcon);
    chapterNodeTitle.appendChild(chapterTitleText);
    chapterNodeTitle.appendChild(chapterCompletionIcon);

    const chapterNode = document.createElement('div');
    chapterNode.classList.add('h5p-digibook-navigation-chapter');
    chapterNode.appendChild(chapterNodeTitle);
    if (this.parent.activeChapter !== chapterId) {
      chapterNode.classList.add('h5p-digibook-navigation-closed');
    }

    const sectionsWrapper = document.createElement('div');
    sectionsWrapper.classList.add('h5p-digibook-navigation-sectionlist');
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

      const sectionLink = document.createElement('a');
      sectionLink.onclick = () => {
        this.parent.trigger('newChapter', {
          h5pbookid: this.parent.contentId,
          chapter: this.chapters[chapterId].id,
          section: section.id
        });
      };
      sectionLink.appendChild(sectionCompletionIcon);
      sectionLink.appendChild(sectionTitleText);

      const sectionNode = document.createElement('div');
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
    return this.chapters.map((chapter, index) => this.getNodesFromChapter(chapter, index));
  }

  /**
   * Add transform listener.
   */
  addTransformListener() {
    this.container.addEventListener('transitionend', (event) => {
      if (event.propertyName === 'flex-basis') {
        // TODO: Check what this check is used for
        this.parent.trigger('resize');
      }
    });
  }
}
export default SideBar;

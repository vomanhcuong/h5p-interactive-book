import URLTools from './urltools';
import SideBar from './sidebar';
import StatusBar from './statusbar';
import Cover from './cover';
import PageContent from './pagecontent';
import 'element-scroll-polyfill';

export default class InteractiveBook extends H5P.EventDispatcher {
  /**
   * @constructor
   *
   * @param {object} config
   * @param {string} contentId
   * @param {object} contentData
   */
  constructor(config, contentId, contentData = {}) {
    super();
    const self = this;
    this.contentId = contentId;
    this.activeChapter = 0;
    this.newHandler = {};

    this.completed = false;

    this.params = InteractiveBook.sanitizeConfig(config);
    this.params.behaviour = this.params.behaviour || {};
    this.mainWrapper = null;
    this.currentRatio = null;
    this.smallSurface = 'h5p-interactive-book-small';
    this.mediumSurface = 'h5p-interactive-book-medium';
    this.largeSurface = 'h5p-interactive-book-large';

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */
    this.params.behaviour.enableSolutionsButton = false;
    this.params.behaviour.enableRetry = false;

    /**
     * Check if result has been submitted or input has been given.
     *
     * @return {boolean} True, if answer was given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => this.chapters.reduce((accu, current) => {
      if (typeof current.instance.getAnswerGiven === 'function') {
        return accu && current.instance.getAnswerGiven();
      }
      return accu;
    }, true);

    /**
     * Get latest score.
     *
     * @return {number} Latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => this.chapters.reduce((accu, current) => {
      if (typeof current.instance.getScore === 'function') {
        return accu + current.instance.getScore();
      }
      return accu;
    }, 0);

    /**
     * Get maximum possible score.
     *
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => this.chapters.reduce((accu, current) => {
      if (typeof current.instance.getMaxScore === 'function') {
        return accu + current.instance.getMaxScore();
      }
      return accu;
    }, 0);

    /**
     * Show solutions.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      this.chapters.forEach(chapter => {
        if (typeof chapter.instance.toggleReadSpeaker === 'function') {
          chapter.instance.toggleReadSpeaker(true);
        }
        if (typeof chapter.instance.showSolutions === 'function') {
          chapter.instance.showSolutions();
        }
        if (typeof chapter.instance.toggleReadSpeaker === 'function') {
          chapter.instance.toggleReadSpeaker(false);
        }
      });
    };

    /**
     * Reset task.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.chapters.forEach(chapter => {
        if (typeof chapter.instance.resetTask === 'function') {
          chapter.instance.resetTask();
        }
      });

      this.sideBar.resetIndicators();
    };

    /**
     * Get xAPI data.
     *
     * @return {object} xAPI statement.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    this.getXAPIData = () => {
      const xAPIEvent = this.createXAPIEventTemplate('answered');
      this.addQuestionToXAPI(xAPIEvent);
      xAPIEvent.setScoredResult(this.getScore(),
        this.getMaxScore(),
        this,
        true,
        this.getScore() === this.getMaxScore()
      );

      return {
        statement: xAPIEvent.data.statement,
        children: this.getXAPIDataFromChildren(this.chapters.map(chapter => chapter.instance))
      };
    };

    /**
     * Get xAPI data from sub content types.
     *
     * @param {object[]} instances H5P instances.
     * @return {object[]} xAPI data objects used to build a report.
     */
    this.getXAPIDataFromChildren = instances => {
      return instances.map(instance => {
        if (typeof instance.getXAPIData === 'function') {
          return instance.getXAPIData();
        }
      }).filter(data => !!data);
    };

    /**
     * Add question itself to the definition part of an xAPIEvent.
     *
     * @param {H5P.XAPIEvent} xAPIEvent.
     */
    this.addQuestionToXAPI = xAPIEvent => {
      const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
      Object.assign(definition, this.getxAPIDefinition());
    };

    /**
     * Generate xAPI object definition used in xAPI statements.
     *
     * @return {object} xAPI definition.
     */
    this.getxAPIDefinition = () => ({
      interactionType: 'compound',
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
      description: {'en-US': ''}
    });

    /**
     * Check if there's a cover.
     *
     * @return {boolean} True, if there's a cover.
     */
    this.hasCover = () => this.cover && this.cover.container;

    /**
     * Check if there are valid chapters.
     *
     * @return {boolean} True, if there are valid(not empty) chapters.
     */
    this.hasValidChapters = () => this.params.chapters.length > 0;

    /**
     * Get number of active chapter.
     *
     * @return {number} Number of active chapter.
     */
    this.getActiveChapter = () => this.activeChapter;

    /**
     * Set number of active chapter.
     *
     * @param {number} chapterId Number of active chapter.
     */
    this.setActiveChapter = (chapterId) => {
      chapterId = parseInt(chapterId);
      if (!isNaN(chapterId)) {
        this.activeChapter = chapterId;
      }
    };

    /**
     * Validate fragments.
     *
     * @param {object} fragments Fragments object from URL.
     * @return {boolean} True, if fragments are valid.
     */
    this.validateFragments = (fragments) => {
      return fragments.chapter !== undefined &&
        parseInt(fragments.h5pbookid) === self.contentId;
    };

    /**
     * Bubble events from child to parent
     *
     * @param {object} origin Origin of the Event
     * @param {string} eventName Name of the Event
     * @param {object} target Target to trigger event on
     */
    this.bubbleUp = (origin, eventName, target) => {
      origin.on(eventName, function (event) {
        // Prevent target from sending event back down
        target.bubblingUpwards = true;

        // Trigger event
        target.trigger(eventName, event);

        // Reset
        target.bubblingUpwards = false;
      });
    };

    /**
     * Check if menu is open
     * @return {boolean}
     */
    this.isMenuOpen = () => this.statusBarHeader.isMenuOpen();

    /**
     * Detect if wrapper is a small surface
     * @return {*}
     */
    this.isSmallSurface = () => this.mainWrapper && this.mainWrapper.hasClass(this.smallSurface);

    /**
     * Get the ratio of the wrapper
     *
     * @return {number}
     */
    this.getRatio = () => this.mainWrapper.width() / parseFloat(this.mainWrapper.css('font-size'));

    /**
     * Add/remove classname based on the ratio
     * @param {jQuery} wrapper
     * @param {number} ratio
     */
    this.setWrapperClassFromRatio = (wrapper, ratio = this.getRatio()) => {
      if ( ratio === this.currentRatio) {
        return;
      }
      this.breakpoints().forEach(item => {
        if (item.shouldAdd(ratio)) {
          this.mainWrapper.addClass(item.className);
        }
        else {
          this.mainWrapper.removeClass(item.className);
        }
      });
      this.currentRatio = ratio;
    };

    /**
     * Handle resizing of the content
     */
    this.resize = () => {
      if (!this.pageContent || !this.hasValidChapters() || !this.mainWrapper) {
        return;
      }
      this.setWrapperClassFromRatio(this.mainWrapper);
      const currentChapterId = this.getActiveChapter();
      const currentNode = this.pageContent.columnNodes[currentChapterId];

      // Only resize the visible column
      if (currentNode.offsetParent !== null) {

        // Prevent re-resizing if called by instance
        if (!this.bubblingUpwards) {
          this.pageContent.chapters[currentChapterId].instance.trigger('resize');
        }

        // Resize if necessary and not animating
        if (this.pageContent.content.style.height !== `${currentNode.offsetHeight}px` && !currentNode.classList.contains('h5p-interactive-book-animate')) {
          this.pageContent.content.style.height = `${currentNode.offsetHeight}px`;

          this.pageContent.updateFooter();

          // Add some slack time before resizing again.
          setTimeout(() => {
            this.trigger('resize');
          }, 10);
        }
      }
    };

    /*
     * Establish all triggers
     */
    this.on('resize', this.resize, this);

    this.on('toggleMenu', () => {
      this.pageContent.toggleNavigationMenu();

      // Update the menu button
      this.statusBarHeader.menuToggleButton.setAttribute('aria-expanded', this.statusBarHeader.menuToggleButton.classList.toggle('h5p-interactive-book-status-menu-active') ? 'true' : 'false');

      // We need to resize the whole book since the interactions are getting
      // more width and those with a static ratio will increase their height.
      setTimeout(() => {
        this.trigger('resize');
      }, 150);
    });

    this.on('scrollToTop', () => {
      if (H5P.isFullscreen === true) {
        const container = this.pageContent.container;
        container.scrollBy(0, -container.scrollHeight);
      }
      else {
        this.statusBarHeader.wrapper.scrollIntoView(true);
      }
    });

    this.on('newChapter', (event) => {
      if (this.pageContent.columnNodes[this.getActiveChapter()].classList.contains('h5p-interactive-book-animate')) {
        return;
      }

      this.newHandler = event.data;

      // Create the new hash
      event.data.newHash = URLTools.createFragmentsString(this.newHandler);

      // Assert that the module itself is asking for a redirect
      this.newHandler.redirectFromComponent = true;

      if (this.getChapterId(event.data.chapter) === this.activeChapter) {
        const fragmentsEqual = URLTools.areFragmentsEqual(
          event.data,
          URLTools.extractFragmentsFromURL(this.validateFragments),
          ['h5pbookid', 'chapter', 'section', 'headerNumber']
        );

        if (fragmentsEqual) {
          // only trigger section redirect without changing hash
          this.pageContent.changeChapter(false, event.data);
          return;
        }
      }

      /*
       * Set final chapter read on entering automatically if it doesn't
       * contain tasks and if all other chapters have been completed
       */
      if (this.params.behaviour.progressAuto) {
        const id = this.getChapterId(this.newHandler.chapter);
        if (this.isFinalChapterWithoutTask(id)) {
          this.setChapterRead(id);
        }
      }

      H5P.trigger(this, 'changeHash', event.data);
      H5P.trigger(this, 'scrollToTop');
    });

    /**
     * Check if the current chapter is read.
     *
     * @returns {boolean} True, if current chapter was read.
     */
    this.isCurrentChapterRead = () => this.isChapterRead(this.activeChapter);

    /**
     * Checks if a chapter is read
     *
     * @param chapterId
     * @returns {boolean}
     */
    this.isChapterRead = chapterId => this.chapters[chapterId].completed;

    /**
     * Check if chapter is final one, has no tasks and all other chapters are done.
     *
     * @param {number} chapterId Chapter id.
     * @return {boolean} True, if final chapter without tasks and other chapters done.
     */
    this.isFinalChapterWithoutTask = (chapterId) => {
      return this.chapters[chapterId].maxTasks === 0 &&
        this.chapters.slice(0, chapterId).concat(this.chapters.slice(chapterId + 1))
          .every(chapter => chapter.tasksLeft === 0);
    };

    /**
     * Set the current chapter as completed.
     *
     * @param {number} [chapterId] Chapter Id, defaults to current chapter.
     * @param {boolean} [read=true] True for chapter read, false for not read.
     */
    this.setChapterRead = (chapterId = this.activeChapter, read = true) => {
      this.handleChapterCompletion(chapterId, read);
      this.sideBar.updateChapterProgressIndicator(chapterId, read ? 'DONE' : this.hasChapterStartedTasks(this.chapters[chapterId]) ? 'STARTED' : 'BLANK');
    };

    /**
     * Checks if chapter has started on any of the sections
     *
     * @param chapter
     * @return {boolean}
     */
    this.hasChapterStartedTasks = function (chapter) {
      return chapter.sections.filter(section => section.taskDone).length > 0;
    };

    /**
     * Update statistics on the main chapter.
     *
     * @param {number} chapterId Chapter Id.
     * @param {boolean} hasChangedChapter
     */
    this.updateChapterProgress = (chapterId, hasChangedChapter = false) => {
      if (!this.params.behaviour.progressIndicators) {
        return;
      }

      const chapter = this.chapters[chapterId];
      let status;
      if (!this.params.behaviour.progressAuto) {
        if ( this.isChapterRead(chapterId)) {
          status = "DONE";
        }
        else if ( this.hasChapterStartedTasks(chapter)) {
          status = 'STARTED';
        }
        else {
          status = 'BLANK';
        }
      }
      else if (chapter.maxTasks) {
        if (chapter.tasksLeft === chapter.maxTasks) {
          status = 'BLANK';
        }
        else if (chapter.tasksLeft === 0) {
          status = 'DONE';
        }
        else {
          status = 'STARTED';
        }
      }
      else if (chapter.maxTasks === 0) {
        if (hasChangedChapter) {
          status = 'DONE';
        }
        else {
          status = 'BLANK';
        }
      }
      else {
        status = 'DONE';
      }

      if (status === 'DONE') {
        this.handleChapterCompletion(chapterId);
      }
      this.sideBar.updateChapterProgressIndicator(chapterId, status);
    };

    /**
     * Get id of chapter.
     *
     * @param {string} chapterUUID ChapterUUID.
     * @return {number} Chapter Id.
     */
    this.getChapterId = (chapterUUID) => {
      chapterUUID = chapterUUID.replace('h5p-interactive-book-chapter-', '');

      return this.chapters
        .map(chapter => chapter.instance.subContentId).indexOf(chapterUUID);
    };

    /**
     * Handle chapter completion, e.g. trigger xAPI statements
     *
     * @param {number} chapterId Id of the chapter that was completed.
     * @param {boolean} [completed=true] True for completed, false for uncompleted.
     */
    this.handleChapterCompletion = (chapterId, completed = true) => {
      const chapter = this.chapters[chapterId];

      if (!completed) {
        // Reset chapter and book completion.
        chapter.completed = false;
        this.completed = false;
        return;
      }

      // New chapter completed
      if (!chapter.completed) {
        chapter.completed = true;
        chapter.instance.triggerXAPIScored(chapter.instance.getScore(), chapter.instance.getMaxScore(), 'completed');
      }

      // All chapters completed
      if (!this.completed && this.chapters.every(chapter => chapter.completed)) {
        this.completed = true;
        this.triggerXAPIScored(this.getScore(), this.getMaxScore(), 'completed');
      }
    };

    /**
     * Check if the content height exceeds the window.
     *
     * @param {number} chapterHeight Chapter height.
     */
    this.shouldFooterBeHidden = (chapterHeight) => {
      // Always show except for in fullscreen
      // Ideally we'd check on the top window size but we can't always get it.
      return this.isFullscreen;
    };

    /**
     * Get content container width.
     * @return {number} Container width or 0.
     */
    this.getContainerWidth = () => {
      return (this.pageContent && this.pageContent.container) ? this.pageContent.container.offsetWidth : 0;
    };

    /**
     * Change the current active chapter.
     *
     * @param {boolean} redirectOnLoad Is this a redirect which happens immediately?
     */
    this.changeChapter = (redirectOnLoad) => {
      this.pageContent.changeChapter(redirectOnLoad, this.newHandler);
      this.statusBarHeader.updateStatusBar();
      this.statusBarFooter.updateStatusBar();
      this.newHandler.redirectFromComponent = false;
    };

    /**
     * Get list of classname and conditions for when to add the classname to the content type
     *
     * @return {[{className: string, shouldAdd: (function(*): boolean)}, {className: string, shouldAdd: (function(*): boolean|boolean)}, {className: string, shouldAdd: (function(*): boolean)}]}
     */
    this.breakpoints = () => {
      return [
        {
          "className": this.smallSurface,
          "shouldAdd": ratio => ratio < 43,
        },
        {
          "className": this.mediumSurface,
          "shouldAdd": ratio => ratio >= 43 && ratio < 60,
        },
        {
          "className": this.largeSurface,
          "shouldAdd": ratio => ratio >= 60,
        },
      ];
    };

    /**
     * Triggers whenever the hash changes, indicating that a chapter redirect is happening
     */
    H5P.on(this, 'respondChangeHash', () => {
      const payload = URLTools.extractFragmentsFromURL(self.validateFragments);
      if (payload.h5pbookid && parseInt(payload.h5pbookid) === self.contentId) {
        this.redirectChapter(payload);
      }
    });

    H5P.on(this, 'changeHash', (event) => {
      if (event.data.h5pbookid === this.contentId) {
        top.location.hash = event.data.newHash;
      }
    });

    H5P.externalDispatcher.on('xAPI', function (event) {
      if (self !== this && (event.getVerb() === 'answered' || event.getVerb() === 'completed')) {
        self.setSectionStatusByID(this.subContentId || this.contentData.subContentId, self.activeChapter);
      }
    });

    /**
     * Redirect chapter.
     *
     * @param {object} target Target data.
     * @param {string} target.h5pbookid Book id.
     * @param {string} target.chapter Chapter UUID.
     * @param {string} target.section Section UUID.
     */
    this.redirectChapter = (target) => {
      /**
       * If true, we already have information regarding redirect in newHandler
       * When using browser history, a convert is neccecary
       */
      if (!this.newHandler.redirectFromComponent) {

        // Assert that the handler actually is from this content type.
        if (target.h5pbookid && parseInt(target.h5pbookid) === self.contentId) {
          self.newHandler = target;
        /**
         * H5p-context switch on no newhash = history backwards
         * Redirect to first chapter
         */
        }
        else {
          self.newHandler = {
            chapter: `h5p-interactive-book-chapter-${self.chapters[0].instance.subContentId}`,
            h5pbookid: self.h5pbookid
          };
        }
      }
      self.changeChapter(false);
    };

    /**
     * Set a section progress indicator.
     *
     * @param {string} sectionUUID UUID of target section.
     * @param {number} chapterId Number of targetchapter.
     */
    this.setSectionStatusByID = (sectionUUID, chapterId) => {
      this.chapters[chapterId].sections.forEach((section, index) => {
        const sectionInstance = section.instance;

        if (sectionInstance.subContentId === sectionUUID && !section.taskDone) {
          section.taskDone = true;
          this.sideBar.setSectionMarker(chapterId, index);
          this.chapters[chapterId].tasksLeft -= 1;
          this.updateChapterProgress(chapterId);
        }
      });
    };

    top.addEventListener('hashchange', (event) => {
      H5P.trigger(this, 'respondChangeHash', event);
    });

    /**
     * Attach library to wrapper
     * @param {jQuery} $wrapper
     */
    this.attach = ($wrapper) => {
      this.mainWrapper = $wrapper;
      // Needed to enable scrolling in fullscreen
      $wrapper.addClass('h5p-interactive-book h5p-scrollable-fullscreen');
      this.setWrapperClassFromRatio(this.mainWrapper);
      if (this.cover) {
        $wrapper.append(this.cover.container);
        $wrapper.addClass('covered');
      }

      $wrapper.append(this.statusBarHeader.wrapper);

      const first = this.pageContent.container.firstChild;
      if (first) {
        this.pageContent.container.insertBefore(this.sideBar.container, first);
      }

      $wrapper.append(this.pageContent.container);
      $wrapper.append(this.statusBarFooter.wrapper);

      if (this.params.behaviour.defaultTableOfContents && !this.isSmallSurface()) {
        this.trigger('toggleMenu');
      }

      this.pageContent.updateFooter();
    };

    /**
     * Hide all elements.
     *
     * @param {boolean} hide True to hide elements.
     */
    this.hideAllElements = function (hide) {
      const nodes = [
        this.statusBarHeader.wrapper,
        this.statusBarFooter.wrapper,
        this.pageContent.container
      ];

      if (hide) {
        nodes.forEach(node => {
          node.classList.add('h5p-content-hidden');
          node.classList.add('h5p-interactive-book-cover-present');
        });
      }
      else {
        nodes.forEach(node => {
          node.classList.remove('h5p-content-hidden');
          node.classList.remove('h5p-interactive-book-cover-present');
        });
      }
    };

    // Initialize the support components
    if (config.showCoverPage) {
      this.cover = new Cover(config.bookCover, contentData.metadata.title, config.read, contentId, this);
    }

    this.pageContent = new PageContent(config, contentId, contentData, this, {
      l10n: {
        markAsFinished: config.markAsFinished
      },
      behaviour: this.params.behaviour
    });
    this.chapters = this.pageContent.getChapters();

    this.sideBar = new SideBar(config, contentId, contentData.metadata.title, this);

    this.statusBarHeader = new StatusBar(contentId, config.chapters.length, this, {
      l10n: {
        nextPage: config.nextPage,
        previousPage: config.previousPage,
        navigateToTop: config.navigateToTop,
        fullscreen: this.params.fullscreen,
        exitFullscreen: this.params.exitFullscreen,
      },
      a11y: this.params.a11y,
      behaviour: this.params.behaviour,
      displayFullScreenButton: true,
    }, 'h5p-interactive-book-status-header');

    this.statusBarFooter = new StatusBar(contentId, config.chapters.length, this, {
      l10n: {
        nextPage: config.nextPage,
        previousPage: config.previousPage,
        navigateToTop: config.navigateToTop
      },
      a11y: this.params.a11y,
      behaviour: this.params.behaviour
    }, 'h5p-interactive-book-status-footer');

    if (this.hasCover()) {

      this.hideAllElements(true);

      this.on('coverRemoved', () => {
        this.hideAllElements(false);
        this.trigger('resize');

        // Focus header progress bar when cover is removed
        this.statusBarHeader.progressBar.progress.focus();
      });
    }

    if ( this.hasValidChapters() ) {
      // Kickstart the statusbar
      this.statusBarHeader.updateStatusBar();
      this.statusBarFooter.updateStatusBar();
    }
  }

  /**
   * Make sure that the config used is in a good state
   *
   * @param config
   * @return {*}
   */
  static sanitizeConfig(config) {
    config.chapters = config.chapters
      .map(chapter => {
        chapter.params.content = chapter.params.content.filter(content => content.content);
        return chapter;
      })
      .filter(chapter => chapter.params.content && chapter.params.content.length > 0);
    return config;
  }

}

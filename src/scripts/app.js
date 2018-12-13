import SideBar from './sidebar';
import StatusBar from './statusbar';
import Cover from './cover';
import PageContent from './pagecontent';

export default class DigiBook extends H5P.EventDispatcher {
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

    this.params = config;
    this.params.behaviour = this.params.behaviour || {};

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */
    this.params.behaviour.enableSolutionsButton = false;
    this.params.behaviour.enableRetry = false;

    this.animationInProgress = false;

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
     * @return {Object} xAPI statement.
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
     * @param {Object[]} instances H5P instances.
     * @return {Object[]} xAPI data objects used to build a report.
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
      H5P.jQuery.extend(definition, this.getxAPIDefinition());
    };

    /**
     * Generate xAPI object definition used in xAPI statements.
     *
     * @return {Object} xAPI definition.
     */
    this.getxAPIDefinition = () => ({
      interactionType: 'compound',
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
      description: {'en-US': ''}
    });

    this.doesCoverExist = () => {
      if (this.cover && this.cover.div) {
        return true;
      }
      return false;
    };


    this.getActiveChapter = () => {
      return this.activeChapter;
    };

    this.setActiveChapter = (input) => {
      const number = parseInt(input);
      if (!isNaN(number)) {
        this.activeChapter = parseInt(input);
      }
    };

    /**
     * Extract fragments from browser URL.
     *
     * @return {Object} Fragments.
     */
    this.extractFragmentsFromURL = (validate) => {
      if (!top.location.hash) {
        return {};
      }

      // Convert fragment string to object with properties
      const fragments = {};
      top.location.hash.replace('#', '').split('&')
        .forEach(fragment => {
          if (fragment.indexOf('=') === -1) {
            return; // Skip if incomplete pair
          }
          const argPair = fragment.split('=');
          fragments[argPair[0]] = argPair[1];
        });

      // Optionally validate and ignore fragments
      if (typeof validate === 'function' && !validate(fragments)) {
        return {};
      }

      return fragments;
    };

    /**
     * Validate fragments.
     *
     * @param {Object} fragments Fragments object from URL.
     * @return {boolean} True, if fragments are valid.
     */
    this.validateFragments = (fragments) => {
      return fragments.chapter !== undefined &&
        parseInt(fragments.h5pbookid) === self.contentId;
    };

    /**
     * Compare the current hash with the currently redirected hash.
     *
     * Used for checking if the user attempts to redirect to the same section twice
     * @param {object} hashObj - the object that should be compared to the hash
     * @param {String} hashObj.chapter
     * @param {String} hashObj.section
     * @param {number} hashObj.h5pbookid
     */
    this.isCurrentHashSameAsRedirect = (hashObj) => {
      const temp = this.extractFragmentsFromURL(this.validateFragments);
      for (const key in temp) {
        if (temp.hasOwnProperty(key)) {
          const element = temp[key];
          if (element != hashObj[key]) {
            return false;
          }
        }
      }
      return true;
    };

    /**
     * Establish all triggers
     */
    this.on('toggleMenu', () => {
      this.sideBar.div.classList.toggle('h5p-digibook-hide');
    });

    this.on('scrollToTop', () => {
      this.statusBar.header.scrollIntoView(true);
    });

    /**
     *
     */
    this.on('newChapter', (event) => {
      if (this.animationInProgress) {
        return;
      }
      this.newHandler = event.data;

      // Create the new hash
      event.data.newHash = this.createFragmentsString(this.newHandler);

      //Assert that the module itself is asking for a redirect
      this.newHandler.redirectFromComponent = true;

      if (event.data.chapter === this.activeChapter) {
        if (this.isCurrentHashSameAsRedirect(event.data)) {
          //only trigger section redirect without changing hash
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

      H5P.trigger(this, "changeHash", event.data);
    });

    /**
     * Create fragments string from fragments object.
     *
     * @param {Object} fragments Fragments.
     * @return {string} Fragments string.
     */
    this.createFragmentsString = (fragments) => {
      let parts = [];
      for (let fragment in fragments) {
        parts.push(`${fragment}=${fragments[fragment]}`);
      }
      return `#${parts.join('&')}`;
    };

    /**
     * Check if the current chapter is read
     *
     * @returns {boolean}
     */
    this.isCurrentChapterRead = () => {
      return this.chapters[this.activeChapter].completed;
    };

    /**
     * Check if chapter is final one, has no tasks and all other chapters are done.
     *
     * @param {number} id Chapter id.
     * @return {boolean} True, if final chapter without tasks and other chapters done.
     */
    this.isFinalChapterWithoutTask = function (id) {
      return this.chapters[id].maxTasks === 0 &&
        this.chapters.slice(0, id).concat(this.chapters.slice(id + 1))
          .every(chapter => chapter.completed);
    };

    /**
     * Set the current chapter as completed
     */
    this.setChapterRead = (id = this.activeChapter) => {
      this.handleChapterCompletion(id);
      this.sideBar.updateChapterProgressIndicator(id, 'DONE');
    };

    /**
     * Update statistics on the main chapter
     *
     * @param {number} targetChapter
     * @param {boolean} hasChangedChapter
     */
    this.updateChapterProgress = function (targetChapter, hasChangedChapter = false) {
      if (!this.params.behaviour.progressIndicators || !this.params.behaviour.progressAuto) {
        return;
      }

      const chapter = this.chapters[targetChapter];
      let status;
      if (chapter.maxTasks) {
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
        this.handleChapterCompletion(targetChapter);
      }
      this.sideBar.updateChapterProgressIndicator(targetChapter, status);
    };

    /**
     * Get id of chapter.
     *
     * @param {string} chapterString Identifier string/subContentId.
     * @return {number} Id of chapter.
     */
    this.getChapterId = function (chapterString) {
      return this.chapters.map(chapter => chapter.instance.subContentId).indexOf(chapterString);
    };

    /**
     * Handle chapter completion, e.g. trigger xAPI statements
     *
     * @param {number} chapterId Id of the chapter that was completed.
     */
    this.handleChapterCompletion = function (chapterId) {
      const chapter = this.chapters[chapterId];

      // New chapter completed
      if (!chapter.completed) {
        chapter.completed = true;
        chapter.instance.triggerXAPIScored(chapter.instance.getScore(), chapter.instance.getMaxScore(), 'completed');
      }

      // All chapters completed
      if (!this.completed && this.chapters.every(chapter => chapter.completed)) {
        this.completed = true;

        const xAPIData = this.getXAPIData();
        const xAPIEvent = new H5P.XAPIEvent();
        xAPIEvent.data.statement = xAPIData.statement;
        xAPIEvent.data.children = xAPIData.children;
        xAPIEvent.setVerb('completed');

        this.trigger(xAPIEvent);
      }
    };

    /**
     * Check if the content height exceeds the window
     * @param {div} chapterHeight
     */
    this.shouldFooterBeVisible = (chapterHeight) => {
      return chapterHeight <= window.outerHeight;
    };

    /**
     * Change the current active chapter
     * @param {boolean} redirectOnLoad - Is this a redirect which happens immediately?
     */
    this.changeChapter = (redirectOnLoad) => {
      this.pageContent.changeChapter(redirectOnLoad, this.newHandler);
      this.statusBar.updateStatusBar();
      this.newHandler.redirectFromComponent = false;
    };


    /**
     * Triggers whenever the hash changes, indicating that a chapter redirect is happening
     */
    H5P.on(this, 'respondChangeHash', () => {
      const payload = self.extractFragmentsFromURL(self.validateFragments);
      if (payload.h5pbookid && parseInt(payload.h5pbookid) === self.contentId) {
        this.redirectChapter(payload);
      }
    });

    H5P.on(this, 'changeHash', function (event) {
      if (event.data.h5pbookid === this.contentId) {
        top.location.hash = event.data.newHash;
      }
    });

    H5P.externalDispatcher.on('xAPI', function (event) {
      if (event.getVerb() === 'answered' || event.getVerb() === 'completed') {
        if (self.params.behaviour.progressIndicators && self !== this) {
          self.setSectionStatusByID(this.subContentId || this.contentData.subContentId, self.activeChapter);
        }
      }
    });

    this.redirectChapter = function (event) {
      /**
       * If true, we already have information regarding redirect in newHandler
       * When using browser history, a convert is neccecary
       */
      if (!this.newHandler.redirectFromComponent) {
        let tmpEvent;
        tmpEvent = event;
        // Assert that the handler actually is from this content type.
        if (tmpEvent.h5pbookid && parseInt(tmpEvent.h5pbookid) === self.contentId) {
          self.newHandler = tmpEvent;
        /**
         * H5p-context switch on no newhash = history backwards
         * Redirect to first chapter
         */
        }
        else {
          self.newHandler = {
            chapter: self.chapters[0].instance.subContentId,
            h5pbookid: self.h5pbookid
          };
        }
      }
      self.changeChapter(false);
    };

    /**
     * Set a section progress indicator
     *
     * @param {string} targetId
     * @param {string} targetChapter
     */
    this.setSectionStatusByID = function (targetId, targetChapter) {
      this.chapters[targetChapter].sections.forEach((section, index) => {
        const sectionInstance = section.instance;
        if (sectionInstance.subContentId === targetId && !section.taskDone) {
          section.taskDone = true;
          this.sideBar.setSectionMarker(targetChapter, index);
          this.chapters[targetChapter].tasksLeft -= 1;
          if (this.params.behaviour.progressAuto) {
            this.updateChapterProgress(targetChapter);
          }
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
    this.attach = function ($wrapper) {
      $wrapper[0].classList.add('h5p-scrollable-fullscreen');
      // Needed to enable scrolling in fullscreen
      $wrapper[0].id = "h5p-digibook";
      if (this.cover) {
        $wrapper.get(0).appendChild(this.cover.div);
      }
      $wrapper.get(0).appendChild(this.statusBar.header);

      const first = this.pageContent.div.firstChild;
      if (first) {
        this.pageContent.div.insertBefore(this.sideBar.div, first);
      }

      $wrapper.get(0).appendChild(this.pageContent.div);
      $wrapper.get(0).appendChild(this.statusBar.footer);
    };

    this.hideAllElements = function (hideElements) {

      const targetElements = [
        this.statusBar.header,
        this.statusBar.footer,
        this.pageContent.div
      ];

      if (hideElements) {
        targetElements.forEach(x => {
          x.classList.add('h5p-content-hidden');
          x.classList.add('digibook-cover-present');
        });
      }

      else {
        targetElements.forEach(x => {
          x.classList.remove('h5p-content-hidden');
          x.classList.remove('digibook-cover-present');
        });
      }
    };

    //Initialize the support components
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

    this.statusBar = new StatusBar(contentId, config.chapters.length, this, {
      l10n: {
        nextPage: config.nextPage,
        previousPage: config.previousPage,
        navigateToTop: config.navigateToTop
      },
      behaviour: this.params.behaviour
    });

    if (this.doesCoverExist()) {

      this.hideAllElements(true);

      this.on('coverRemoved', () => {
        this.hideAllElements(false);
        this.trigger('resize');
      });
    }

    //Kickstart the statusbar
    this.statusBar.updateStatusBar();
    this.pageContent.updateFooter();
  }
}

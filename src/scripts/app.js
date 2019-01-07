import URLTools from './urltools';
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

    /*
     * Establish all triggers
     */
    this.on('toggleMenu', () => {
      if (this.isMobilePhone()) {
        this.pageContent.toggle();
      }
      this.sideBar.toggle();
    });

    this.on('scrollToTop', () => {
      if (H5P.isFullscreen === true) {
        const content = this.pageContent.content;
        content.scrollBy(0, -content.scrollHeight);
      }
      else {
        this.statusBarHeader.wrapper.scrollIntoView(true);
      }
    });

    this.on('newChapter', (event) => {
      if (this.pageContent.columnNodes[this.getActiveChapter()].classList.contains('h5p-digibook-animate')) {
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
    });

    /**
     * Check if the current chapter is read.
     *
     * @returns {boolean} True, if current chapter was read.
     */
    this.isCurrentChapterRead = () => this.chapters[this.activeChapter].completed;

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
      this.sideBar.updateChapterProgressIndicator(chapterId, read ? 'DONE' : 'BLANK');
    };

    /**
     * Update statistics on the main chapter.
     *
     * @param {number} chapterId Chapter Id.
     * @param {boolean} hasChangedChapter
     */
    this.updateChapterProgress = (chapterId, hasChangedChapter = false) => {
      if (!this.params.behaviour.progressIndicators || !this.params.behaviour.progressAuto) {
        return;
      }

      const chapter = this.chapters[chapterId];
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
      chapterUUID = chapterUUID.replace('h5p-digibook-chapter-', '');

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
      return chapterHeight <= window.outerHeight && !this.isFullscreen;
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
      if (event.getVerb() === 'answered' || event.getVerb() === 'completed') {
        if (self.params.behaviour.progressIndicators && self !== this) {
          self.setSectionStatusByID(this.subContentId || this.contentData.subContentId, self.activeChapter);
        }
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
            chapter: `h5p-digibook-chapter-${self.chapters[0].instance.subContentId}`,
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
          if (this.params.behaviour.progressAuto) {
            this.updateChapterProgress(chapterId);
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
    this.attach = ($wrapper) => {
      // Needed to enable scrolling in fullscreen
      $wrapper[0].classList.add('h5p-digibook');
      $wrapper[0].classList.add('h5p-scrollable-fullscreen');
      if (this.cover) {
        $wrapper.get(0).appendChild(this.cover.container);
        $wrapper.get(0).classList.add('covered');
      }

      this.addFullScreenButton($wrapper);

      $wrapper.get(0).appendChild(this.statusBarHeader.wrapper);

      const first = this.pageContent.container.firstChild;
      if (first) {
        this.pageContent.container.insertBefore(this.sideBar.container, first);
      }

      $wrapper.get(0).appendChild(this.pageContent.container);
      $wrapper.get(0).appendChild(this.statusBarFooter.wrapper);
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
          node.classList.add('digibook-cover-present');
        });
      }
      else {
        nodes.forEach(node => {
          node.classList.remove('h5p-content-hidden');
          node.classList.remove('digibook-cover-present');
        });
      }
    };

    /**
     * Add fullscreen button.
     *
     * @param {jQuery} $wrapper HTMLElement to attach button to.
     */
    this.addFullScreenButton = function ($wrapper) {
      if (H5P.canHasFullScreen !== true) {
        return;
      }

      const toggleFullScreen = () => {
        if (H5P.isFullscreen === true) {
          H5P.exitFullScreen();
        }
        else {
          H5P.fullScreen($wrapper, this);
        }
      };

      this.fullScreenButton = document.createElement('button');
      this.fullScreenButton.classList.add('h5p-digibook-fullscreen-button');
      this.fullScreenButton.classList.add('h5p-digibook-enter-fullscreen');
      this.fullScreenButton.setAttribute('title', this.params.fullscreen);
      this.fullScreenButton.setAttribute('aria-label', this.params.fullscreen);
      this.fullScreenButton.addEventListener('click', toggleFullScreen);
      this.fullScreenButton.addEventListener('keyPress', (event) => {
        if (event.which === 13 || event.which === 32) {
          toggleFullScreen();
          event.preventDefault();
        }
      });

      this.on('enterFullScreen', () => {
        this.isFullscreen = true;
        this.fullScreenButton.classList.remove('h5p-digibook-enter-fullscreen');
        this.fullScreenButton.classList.add('h5p-digibook-exit-fullscreen');
        this.fullScreenButton.setAttribute('title', this.params.exitFullscreen);
        this.fullScreenButton.setAttribute('aria-label', this.params.exitFullScreen);

        this.pageContent.updateFooter();
      });

      this.on('exitFullScreen', () => {
        this.isFullscreen = false;
        this.fullScreenButton.classList.remove('h5p-digibook-exit-fullscreen');
        this.fullScreenButton.classList.add('h5p-digibook-enter-fullscreen');
        this.fullScreenButton.setAttribute('title', this.params.fullscreen);
        this.fullScreenButton.setAttribute('aria-label', this.params.fullscreen);

        this.pageContent.updateFooter();
      });

      const fullScreenButtonWrapper = document.createElement('div');
      fullScreenButtonWrapper.classList.add('h5p-digibook-fullscreen-button-wrapper');
      fullScreenButtonWrapper.appendChild(this.fullScreenButton);

      $wrapper.prepend(fullScreenButtonWrapper);
    };

    /**
     * Detect if we are using a mobile phone.
     *
     * @return {boolean} True, if device is a mobilePhone; false otherwise.
     */
    this.isMobilePhone = function () {
      return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(navigator.userAgent.substr(0,4));
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
        navigateToTop: config.navigateToTop
      },
      a11y: this.params.a11y,
      behaviour: this.params.behaviour
    }, 'h5p-digibook-status-header');

    this.statusBarFooter = new StatusBar(contentId, config.chapters.length, this, {
      l10n: {
        nextPage: config.nextPage,
        previousPage: config.previousPage,
        navigateToTop: config.navigateToTop
      },
      a11y: this.params.a11y,
      behaviour: this.params.behaviour
    }, 'h5p-digibook-status-footer');

    if (this.hasCover()) {

      this.hideAllElements(true);

      this.on('coverRemoved', () => {
        this.hideAllElements(false);
        this.trigger('resize');

        // Focus header progress bar when cover is removed
        this.statusBarHeader.progressBar.progress.focus();
      });
    }

    // Kickstart the statusbar
    this.statusBarHeader.updateStatusBar();
    this.statusBarFooter.updateStatusBar();
    this.pageContent.updateFooter();
  }
}

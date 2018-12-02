[1mdiff --git a/src/scripts/app.js b/src/scripts/app.js[m
[1mindex b04a036..09197e8 100644[m
[1m--- a/src/scripts/app.js[m
[1m+++ b/src/scripts/app.js[m
[36m@@ -203,8 +203,8 @@[m [mexport default class DigiBook extends H5P.EventDispatcher {[m
     /**[m
      * Triggers whenever the hash changes, indicating that a chapter redirect is happening[m
      */[m
[31m-    H5P.on(this, 'respondChangeHash', function (event) {[m
[31m-      const payload = self.retrieveHashFromUrl(new URL(event.data.newURL).hash);[m
[32m+[m[32m    H5P.on(this, 'respondChangeHash', () => {[m
[32m+[m[32m      const payload = self.retrieveHashFromUrl(top.location.hash);[m
       if (payload.h5pbookid) {[m
         this.redirectChapter(payload);[m
       }[m
[1mdiff --git a/src/scripts/sidebar.js b/src/scripts/sidebar.js[m
[1mindex ccb39b6..676858a 100644[m
[1m--- a/src/scripts/sidebar.js[m
[1m+++ b/src/scripts/sidebar.js[m
[36m@@ -13,8 +13,8 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
 [m
     this.chapters = this.findAllChapters(config.chapters);[m
     this.chapterElems = this.getChapterElements();[m
[31m-    [m
[31m-    [m
[32m+[m
[32m+[m
     if (mainTitle) {[m
       this.titleElem = this.addMainTitle(mainTitle);[m
       this.div.appendChild(this.titleElem.div);[m
[36m@@ -23,7 +23,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
     this.chapterElems.forEach(element => {[m
       this.content.appendChild(element);[m
     });[m
[31m-    [m
[32m+[m
     this.div.appendChild(this.content);[m
 [m
     this.addTransformListener();[m
[36m@@ -101,7 +101,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
         arrow.classList.remove('icon-expanded');[m
         arrow.classList.add('icon-collapsed');[m
       }[m
[31m-      [m
[32m+[m
     }[m
     else {[m
       element.classList.remove('h5p-digibook-navigation-closed');[m
[36m@@ -112,16 +112,16 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
       }[m
     }[m
   }[m
[31m-  [m
[32m+[m
 [m
   /**[m
    * Fires whenever a redirect is happening in parent[m
    * All chapters will be collapsed except for the active[m
[31m-   * [m
[31m-   * @param {number} newChapter - The chapter that should stay open in the menu [m
[32m+[m[32m   *[m
[32m+[m[32m   * @param {number} newChapter - The chapter that should stay open in the menu[m
    */[m
   redirectHandler(newChapter) {[m
[31m-    this.chapterElems.filter(x => [m
[32m+[m[32m    this.chapterElems.filter(x =>[m
       this.chapterElems.indexOf(x) != newChapter).forEach(x => this.editChapterStatus(x, true));[m
 [m
 [m
[36m@@ -142,7 +142,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
 [m
   /**[m
    * Update the indicator on a spesific chapter.[m
[31m-   * [m
[32m+[m[32m   *[m
    * @param {number} targetChapter - The chapter that should be updated[m
    */[m
   updateChapterProgressIndicator(targetChapter, status) {[m
[36m@@ -193,7 +193,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
     titleDiv.classList.add('h5p-digibook-navigation-chapter-title');[m
     chapterDiv.classList.add('h5p-digibook-navigation-chapter');[m
     sectionsDiv.classList.add('h5p-digibook-navigation-sectionlist');[m
[31m-    [m
[32m+[m
     title.innerHTML = chapter.title;[m
     title.setAttribute("title", chapter.title);[m
 [m
[36m@@ -217,7 +217,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
     // Add sections to the chapter[m
     for (let i = 0; i < this.chapters[chapterIndex].sections.length; i++) {[m
       const section = this.chapters[chapterIndex].sections[i];[m
[31m-      [m
[32m+[m
       const singleSection = document.createElement('div');[m
       const a = document.createElement('a');[m
       const span = document.createElement('span');[m
[36m@@ -227,7 +227,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
       span.setAttribute('title', section.title);[m
       span.classList.add('digibook-sectiontitle');[m
       icon.classList.add('icon-chapter-blank');[m
[31m-      [m
[32m+[m
       if (this.parent.instances[chapterIndex].childInstances[i].isTask) {[m
         icon.classList.add('h5p-digibook-navigation-section-task');[m
       }[m
[36m@@ -235,7 +235,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
 [m
       a.appendChild(span);[m
       singleSection.appendChild(a);[m
[31m-      [m
[32m+[m
       sectionsDiv.appendChild(singleSection);[m
       a.onclick = () => {[m
         that.parent.trigger('newChapter', {[m
[36m@@ -250,7 +250,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
     }[m
     chapterDiv.appendChild(sectionsDiv);[m
 [m
[31m-    [m
[32m+[m
     return {[m
       chapterDiv,[m
       sectionsDiv[m
[36m@@ -260,7 +260,7 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
   getChapterElements() {[m
     let tmp = [];[m
     for (let i = 0; i < this.chapters.length; i++) {[m
[31m-      const chapter = this.chapters[i];      [m
[32m+[m[32m      const chapter = this.chapters[i];[m
       const elem = this.createElemFromChapter(chapter, i);[m
       tmp.push(elem.chapterDiv);[m
     }[m
[36m@@ -277,4 +277,4 @@[m [mclass SideBar extends H5P.EventDispatcher {[m
 [m
 [m
 }[m
[31m-export default SideBar;[m
\ No newline at end of file[m
[32m+[m[32mexport default SideBar;[m

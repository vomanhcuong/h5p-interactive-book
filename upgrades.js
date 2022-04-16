var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.InteractiveBook'] = (function () {
  return {
    1: {
      /**
       * Upgrade cover description to not imply "centered"
       * @param {object} parameters Parameters of content.
       * @param {function} finished Callback.
       * @param {object} extras Metadata.
       */
      6: function (parameters, finished, extras) {
        if (parameters && parameters.bookCover && parameters.bookCover.coverDescription) {
          if (parameters.bookCover.coverDescription.substr(0, 2) !== '<p') {
            parameters.bookCover.coverDescription = '<p style="text-align: center;">' + parameters.bookCover.coverDescription + '</p>'; // was plain text
          }
          else {
            parameters.bookCover.coverDescription = parameters.bookCover.coverDescription.replace(/<p[^>]*>/g, '<p style="text-align: center;">');
          }
        }

        finished(null, parameters, extras);
      }
    }
  };
})();

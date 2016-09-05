var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.ImpressPresentation'] = (function () {
  return {
    1: {
      /**
       * Upgrades background selector widget
       *
       * @params {Object} parameters
       * @params {function} finished
       */
      2: function (parameters, finished) {
        parameters.viewsGroup.views.forEach(function (view) {
          if (view.backgroundGroup) {
            view.backgroundGroup.backgroundColor = '#' + view.backgroundGroup.backgroundColor;
          }
        });

        finished(null, parameters);
      },
    }
  }
})();

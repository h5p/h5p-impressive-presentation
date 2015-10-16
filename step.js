var H5P = H5P || {};
H5P.ImpressPresentation = H5P.ImpressPresentation ? H5P.ImpressPresentation : {};

/**
 * Step module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.ImpressPresentation.Step = (function ($, EventDispatcher) {

  /**
   * Step helper class for keeping track of step data
   * @param idCounter
   * @param params
   * @returns {H5P.ImpressPresentation.Step}
   */
  function Step(idCounter, params) {
    var self = this;

    /**
     * Step section element
     */
    var $element;

    /**
     * Library content
     */
    var library;

    /**
     * Library container element
     */
    var $libraryContainer;

    /**
     * Library semantics form
     */
    var $libraryForm;

    /**
     * Background container element
     */
    var $backgroundContainer;

    /**
     * Background semantics form
     */
    var $backgroundForm;

    /**
     * Keep track of step name
     */
    var userDefinedName;

    /**
     * Keep track of semantics
     * @type {Array}
     */
    self.children = [];

    /**
     * Inherit event functionality
     */
    EventDispatcher.call(this);

    /**
     * Initialize step
     */
    self.init = function () {
      createElement();
      createLibrary();

      return self;
    };

    /**
     * Create background for section
     */
    self.setBackground = function (contentId) {
      // Skip transparent steps
      if (params.backgroundGroup.transparentBackground) {
        if ($backgroundContainer) {
          $backgroundContainer.detach();
        }
        return self;
      }

      setBackgroundSize();
      $element.addClass('has-background');

      $backgroundContainer = $('<div>', {
        'class': 'h5p-impress-background'
      }).appendTo($element);

      // Check for image first
      if (params.backgroundGroup.backgroundImage) {
        setBackgroundImage($backgroundContainer, contentId)
      }

      if (params.backgroundGroup.backgroundColor) {
        $backgroundContainer.css('background-color', '#' + params.backgroundGroup.backgroundColor);
      }

      return self;
    };

    /**
     * Activate step dynamically for $jmpress element
     * @param {Object} jmpress
     */
    self.activateStep = function (jmpress) {
      jmpress.jmpress('canvas').append($element);
      jmpress.jmpress('init', $element);

      return self;
    };

    /**
     * Deactivate and remove step dynamically.
     * @param {Object} jmpress
     */
    self.removeStep = function (jmpress) {
      jmpress.jmpress('deinit', $element);
      $element.remove();
    };

    /**
     * Create example content
     */
    self.createExampleContent = function (libraries) {
      // Find Advanced Text library with correct version from semantics, should be more robust.
      var libraryOptions = libraries;
      var foundLib = false;
      for (var libIndex in libraryOptions) {
        if (libraryOptions.hasOwnProperty(libIndex) && !foundLib) {
          var library = libraryOptions[libIndex];
          if ((typeof library === 'string' || library instanceof String)
            && library.indexOf('AdvancedText') > -1) {
            params.action = {
              library: library,
              params: {
                text: '<p>Example content!</p>'
              },
              subContentId: H5P.createUUID()
            };
            self.updateLibrary();
            return self;
          }
        }
      }

      return self;
    };

    /**
     * Disable library interaction. Useful when editing.
     */
    self.disableContentInteraction = function () {
      // Overlay to prevent clicks in editor.
      $('<div>', {
        'class': 'h5p-content-overlay'
      }).click(function () {
        return false;
      }).appendTo($libraryContainer);

      return self;
    };

    /**
     * Update element. Used when params are changed.
     */
    self.updateLibrary = function () {
      createLibrary();

      return self;
    };

    /**
     * Get element
     * @returns {jQuery} $element
     */
    self.getElement = function () {
      return $element;
    };

    /**
     * Get step id
     * @returns {Number} idCounter
     */
    self.getId = function () {
      return idCounter;
    };

    /**
     * Get user defined name.
     * @returns {String}
     */
    self.getName = function () {
      return userDefinedName;
    };

    /**
     * Set user defined name.
     * @param {String} name
     * @returns {H5P.ImpressPresentation.Step}
     */
    self.setName = function (name) {
      userDefinedName = name;

      return self;
    };

    /**
     * Get step params
     * @returns {Object} params
     */
    self.getParams = function () {
      return params;
    };

    /**
     * Set step params
     * @param {Object} newParams
     */
    self.setParams = function (newParams) {
      params = newParams;

      return self;
    };

    /**
     * Get library form
     * @returns {jQuery} $libraryForm
     */
    self.getLibraryForm = function () {
      return $libraryForm;
    };

    /**
     * Set library form
     * @param {jQuery} $element Library form
     */
    self.setLibraryForm = function ($element) {
      $libraryForm = $element;

      return self;
    };

    /**
     * Get background form
     * @returns {jQuery} $backgroundForm
     */
    self.getBackgroundForm = function () {
      return $backgroundForm;
    };

    /**
     * Set background form
     * @param {jQuery} $element Background form
     */
    self.setBackgroundForm = function ($element) {
      $backgroundForm = $element;

      return self;
    };

    /**
     * Returns true if step is included in route.
     */
    self.getRouteState = function () {
      return params.ordering.includeInPath;
    };

    /**
     * Determines if step should be included in route.
     * @param {Boolean} includeInPath
     */
    self.setRouteState = function (includeInPath) {
      params.ordering.includeInPath = includeInPath;
    };

    /**
     * Append step section to wrapper
     * @param {jQuery} $wrapper
     */
    self.appendTo = function ($wrapper) {
      $element.appendTo($wrapper);

      return self;
    };

    /**
     * Create section element from parameters
     */
    var createElement = function () {
      var classString = 'h5p-standard-view' +
        (params.positioning.centerText ? ' h5p-center-view' : '');

      $element = $('<section>', {
        'class': classString,
        'id': H5P.ImpressPresentation.ID_PREFIX + idCounter,
        'data-x': params.positioning.x,
        'data-y': params.positioning.y,
        'data-z': params.positioning.z,
        'data-rotate-x': params.positioning.rotateX,
        'data-rotate-y': params.positioning.rotateY,
        'data-rotate-z': params.positioning.rotateZ,
        'data-exclude': !params.ordering.includeInPath
      });
    };

    /**
     * Create library and add it to section
     */
    var createLibrary = function () {
      if ($libraryContainer) {
        $libraryContainer.detach();
      }
      if (params.action && params.action.library) {

        $libraryContainer = $('<div>', {
          'class': 'h5p-impress-content'
        }).appendTo($element);

        library = new H5P.newRunnable(params.action, self.contentId, $libraryContainer);

        self.trigger('createdLibraryElement', $libraryContainer);
      }
    };

    /**
     * Set background size for section
     * @param {Number} [width]
     * @param {Number} [height]
     */
    var setBackgroundSize = function (width, height) {
      // Default to params
      width = width ? width : params.backgroundGroup.backgroundWidth;
      height = height ? height : params.backgroundGroup.backgroundHeight;

      $element.css({
        width: width,
        height: height
      });
    };

    /**
     * Set background image for section
     * @param {jQuery} $backgroundContainer
     * @param {Number} contentId Content id of image parent
     */
    var setBackgroundImage = function ($backgroundContainer, contentId) {

      // Create image and append to container
      var $img = $('<img>', {
        'src': H5P.getPath(params.backgroundGroup.backgroundImage.path, contentId),
        'class': 'h5p-impress-background-image'
      }).load(function () {

        // If image ratio is smaller than background ratio expand height of image
        var imageRatio = $img.width() / $img.height();
        var backgroundRatio = params.backgroundGroup.backgroundWidth / params.backgroundGroup.backgroundHeight;

        if (imageRatio < backgroundRatio) {
          $img.addClass('fit-to-height');
        }

      }).appendTo($backgroundContainer);
    };
  }

  // Inherit from event dispatcher
  Step.prototype = Object.create(EventDispatcher.prototype);
  Step.prototype.constructor = Step;

  return Step;
}(H5P.jQuery, H5P.EventDispatcher));

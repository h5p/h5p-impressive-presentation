var H5P = H5P || {};
H5P.ImpressPresentation = H5P.ImpressPresentation ? H5P.ImpressPresentation : {};

/**
 * Step module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.ImpressPresentation.Step = (function ($) {

  /**
   * Step helper class for keeping track of step data
   * @param idCounter
   * @param params
   * @returns {H5P.ImpressPresentation.Step}
   */
  function Step(idCounter, params) {
    var self = this;
    var $element;
    var library;

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
        return self;
      }

      setBackgroundSize();
      $element.addClass('has-background');

      var $backgroundContainer = $('<div>', {
        'class': 'h5p-impress-background'
      }).appendTo($element);

      // Check for image first
      if (params.backgroundGroup.backgroundImage) {
        setBackgroundImage($backgroundContainer, contentId)
      }
      else if (params.backgroundGroup.backgroundColor) {
        $backgroundContainer.css('background-color', '#' + params.backgroundGroup.backgroundColor);
      }

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
      if (params.action && params.action.library) {

        var $libraryContainer = $('<div>', {
          'class': 'h5p-impress-content'
        }).appendTo($element);

        library = new H5P.newRunnable(params.action, self.contentId, $libraryContainer);
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

  return Step;
}(H5P.jQuery));

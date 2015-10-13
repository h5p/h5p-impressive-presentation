var H5P = H5P || {};

/**
 * Impress Presentation module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.ImpressPresentation = (function ($, EventDispatcher) {

  var STANDARD_VIEW_CLASS = 'h5p-standard-view';

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} contentId Content identification
   * @returns {Object} ImpressPresentation ImpressPresentation instance
   */
  function ImpressPresentation(params, contentId) {
    var self = this;
    this.contentId = contentId;

    EventDispatcher.call(this);

    console.log(params);

    this.defaultStep = {
      action: {},
      backgroundGroup: {
        transparentBackground: true
      },
      positioning: {
        centerText: true,
        yPosition: 0,
        xPosition: 0,
        zPosition: 0,
        absoluteRotation: 0
      }
    };

    this.defaults = {
      viewsGroup: [
        this.defaultStep
      ],
      viewPortWidth: 640,
      viewPortHeight: 360,
      keyZoomAmount: 10
    };

    this.ID_PREFIX = 'h5p-impres-id-';
    this.idCounter = 0;
    this.editing = false;

    // Set default behavior.
    this.params = $.extend(true, this.defaults, params);

    // Keep track of view elements
    this.viewElements = [];

    // Array containing all libraries.
    this.content = [];

    this.on('resize', function () {
      self.resize();
    });
  }

  // Inherit from event dispatcher
  ImpressPresentation.prototype = Object.create(EventDispatcher.prototype);
  ImpressPresentation.prototype.constructor = ImpressPresentation;

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   *
   * @param {jQuery} $container The container which will be appended to.
   */
  ImpressPresentation.prototype.attach = function ($container) {
    $container.addClass('h5p-impress-presentation');

    this.$inner = $('<div>', {
      'class': "h5p-impress-wrapper"
    }).appendTo($container);

    // Process views
    var $viewsContainer = $('<article class="jmpress" tabindex="0"></article>');
    this.processViews(this.params.viewsGroup, $viewsContainer);
    $viewsContainer.appendTo(this.$inner);
    this.$jmpress = $('.jmpress', this.$inner);

    this.initJmpress();
    this.initZoomFunctionality();
    this.resize();
  };

  ImpressPresentation.prototype.processViews = function (viewsData, $wrapper) {
    console.log(viewsData);
    // Remove all children
    $wrapper.children().remove();

    var self = this;
    this.content = [];

    if (viewsData === undefined) {
      return $wrapper;
    }

    // Clear view elements before (re)populating it
    this.viewElements = [];

    viewsData.forEach(function (viewInstance) {
      var viewObject = self.createViewObject(self.idCounter, viewInstance);
      var $viewHtml = self.createViewHtml(viewObject);
      viewObject.$element = $viewHtml;
      self.createActionLibrary(viewObject);

      self.viewElements.push(viewObject);

      self.idCounter += 1;
      $viewHtml.appendTo($wrapper);
    });
  };

  ImpressPresentation.prototype.createActionLibrary = function (viewObject) {
    var self = this;
    var viewInstance = viewObject.params;
    var $viewHtml = viewObject.$element;
    if (viewInstance.action && viewInstance.action.library) {

      var $libraryContainer = $('<div>', {
        'class': 'h5p-impress-content'
      }).appendTo($viewHtml);

      var actionInstance = new H5P.newRunnable(viewInstance.action, self.contentId, $libraryContainer);
      this.content.push(actionInstance);
    }
  };

  /**
   *
   * @param idCounter
   * @param params
   * @param [$element]
   * @returns {{idCounter: *, params: *, $element: *}}
   */
  ImpressPresentation.prototype.createViewObject = function (idCounter, params, $element) {
    return {
      idCounter: idCounter,
      params: params,
      $element: $element
    }
  };

  ImpressPresentation.prototype.createViewHtml = function (viewInstance) {
    var self = this;
    debugger;
    var id = viewInstance.idCounter;
    var centerText = viewInstance.params.positioning.centerText;
    var yPos = viewInstance.params.positioning.yPosition;
    var xPos = viewInstance.params.positioning.xPosition;
    var zPos = viewInstance.params.positioning.zPosition;
    var rotation = viewInstance.params.positioning.absoluteRotation;
    var classString = STANDARD_VIEW_CLASS;
    if (centerText !== undefined && centerText) {
      classString += ' h5p-center-view';
    }

    var viewHtml =
      '<section class="' + classString +
      '" id="' + self.ID_PREFIX + id +
      '" data-y="' + yPos +
      '" data-x="' + xPos;

    if (zPos !== undefined && !isNaN(zPos)) {
      viewHtml += '" data-z="' + zPos;
    }

    if (rotation !== undefined && !isNaN(rotation)) {
      viewHtml += '" data-rotate="' + rotation;
    }

    viewHtml += '"></section>';

    return $(viewHtml);
  };

  /**
   * Initializes jmpress, this needs to be run to get proper behaviour from the container.
   */
  ImpressPresentation.prototype.initJmpress = function (width, height) {

    if (!width) {
      width = this.params.viewPortWidth;
    }

    if (!height) {
      height = this.params.viewPortHeight;
    }

    var config = {
      stepSelector: 'section',
      viewPort: {
        height: height,
        width: width
      },
      keyboard: {
        keys: {
          37: 'prev',
          39: 'next',
          49: 'zoomin',
          50: 'zoomout'
        },
        use: true
      },
      containerClass: 'jmpress-container',
      canvasClass: 'jmpress-canvas',
      areaClass: 'jmpress-area-camera',
      fullscreen: false,
      hash: { use: false}
    };

    this.$jmpress.jmpress(config);
  };

  ImpressPresentation.prototype.resize = function () {

    // Fit viewport to available space
    var containerWidth = this.$inner.width();
    var containerHeight = (containerWidth * 9) / 16;
    this.$inner.height(containerHeight);

    // Update jmpress viewport
    var settings = this.$jmpress.jmpress('settings');
    settings.viewPort.height = containerHeight;
    settings.viewPort.width = containerWidth;
    this.$jmpress.jmpress('reselect');
  };

  ImpressPresentation.prototype.initZoomFunctionality = function () {
    var self = this;
    this.$jmpress.jmpress("register", "zoomin", function () {
      if (self.editing) {
        var $activeSlide = $(this).jmpress('active');
        $activeSlide.data().stepData.z += self.params.keyZoomAmount;
        //self.reselectStep();
      }

    });
    this.$jmpress.jmpress("register", "zoomout", function () {
      if (self.editing) {
        var $activeSlide = $(this).jmpress('active');
        $activeSlide.data().stepData.z -= self.params.keyZoomAmount;
        //self.reselectStep();
      }
    });
  };

  ImpressPresentation.prototype.refocusView = function () {
    this.$jmpress.focus();
  };

  return ImpressPresentation;

}(H5P.jQuery, H5P.EventDispatcher));

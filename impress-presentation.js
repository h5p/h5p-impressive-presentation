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
    self.contentId = contentId;

    EventDispatcher.call(this);

    console.log(params);

    self.defaultStep = {
      action: {},
      backgroundGroup: {
        transparentBackground: true
      },
      positioning: {
        centerText: true,
        y: 0,
        x: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        absoluteRotation: 0
      }
    };

    self.defaults = {
      viewsGroup: [
        self.defaultStep
      ],
      viewPortWidth: 640,
      viewPortHeight: 360,
      keyZoomAmount: 10
    };

    self.ID_PREFIX = 'h5p-impres-id-';
    self.idCounter = 0;
    self.editing = false;

    // Set default behavior.
    self.params = $.extend(true, self.defaults, params);

    // Keep track of view elements
    self.viewElements = [];

    // Array containing all libraries.
    self.content = [];

    self.on('resize', function () {
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
    var self = this;
    $container.addClass('h5p-impress-presentation');

    self.$inner = $('<div>', {
      'class': "h5p-impress-wrapper"
    }).appendTo($container);

    // Process views
    var $viewsContainer = $('<article class="jmpress" tabindex="0"></article>');
    self.processViews(self.params.viewsGroup, $viewsContainer);
    $viewsContainer.appendTo(self.$inner);
    self.$jmpress = $('.jmpress', self.$inner);

    self.initJmpress();
    self.initZoomFunctionality();
    self.resize();
  };

  ImpressPresentation.prototype.processViews = function (viewsData, $wrapper) {
    console.log(viewsData);
    // Remove all children
    $wrapper.children().remove();

    var self = this;
    self.content = [];

    if (viewsData === undefined) {
      return $wrapper;
    }

    // Clear view elements before (re)populating it
    self.viewElements = [];

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
      self.content.push(actionInstance);
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

    var id = viewInstance.idCounter;
    var centerText = viewInstance.params.positioning.centerText;
    var classString = STANDARD_VIEW_CLASS;
    if (centerText !== undefined && centerText) {
      classString += ' h5p-center-view';
    }

    var viewHtml =
      '<section class="' + classString +
      '" id="' + self.ID_PREFIX + id +
      '" data-y="' + viewInstance.params.positioning.y +
      '" data-x="' + viewInstance.params.positioning.x +
      '" data-z="' + viewInstance.params.positioning.z +
      '" data-rotate-x="' + viewInstance.params.positioning.rotateX +
      '" data-rotate-y="' + viewInstance.params.positioning.rotateY +
      '" data-rotate-z="' + viewInstance.params.positioning.rotateZ;
    viewHtml += '"></section>';

    return $(viewHtml);
  };

  /**
   * Initializes jmpress, this needs to be run to get proper behaviour from the container.
   */
  ImpressPresentation.prototype.initJmpress = function (width, height) {
    var self = this;

    if (!width) {
      width = self.params.viewPortWidth;
    }

    if (!height) {
      height = self.params.viewPortHeight;
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

    self.$jmpress.jmpress(config);
  };

  ImpressPresentation.prototype.resize = function () {
    var self = this;

    // Fit viewport to available space
    var containerWidth = self.$inner.width();
    var containerHeight = (containerWidth * 9) / 16;
    self.$inner.height(containerHeight);

    // Update jmpress viewport
    var settings = self.$jmpress.jmpress('settings');
    settings.viewPort.height = containerHeight;
    settings.viewPort.width = containerWidth;
    self.$jmpress.jmpress('reselect');
  };

  ImpressPresentation.prototype.initZoomFunctionality = function () {
    var self = this;
    self.$jmpress.jmpress("register", "zoomin", function () {
      if (self.editing) {
        var $activeSlide = $(this).jmpress('active');
        $activeSlide.data().stepData.z += self.params.keyZoomAmount;
        //self.reselectStep();
      }

    });
    self.$jmpress.jmpress("register", "zoomout", function () {
      if (self.editing) {
        var $activeSlide = $(this).jmpress('active');
        $activeSlide.data().stepData.z -= self.params.keyZoomAmount;
        //self.reselectStep();
      }
    });
  };

  ImpressPresentation.prototype.refocusView = function () {
    var self = this;
    self.$jmpress.focus();
  };

  return ImpressPresentation;

}(H5P.jQuery, H5P.EventDispatcher));

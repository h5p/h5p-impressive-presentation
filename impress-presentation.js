var H5P = H5P || {};

/**
 * Impress Presentation module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.ImpressPresentation = (function ($, EventDispatcher) {
  var ID_PREFIX = 'h5p-impres-id-';
  var STANDARD_VIEW_CLASS = 'h5p-standard-view';

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   * @returns {Object} ImpressPresentation ImpressPresentation instance
   */
  function ImpressPresentation(params, contentId) {
    this.$ = $(this);
    this.contentId = contentId;

    EventDispatcher.call(this);

    console.log(params);

    this.defaults = {
      viewsGroup: [
        {
          centerText: true,
          yPosition: 0,
          xPosition: 0,
          zPosition: 0,
          absoluteRotation: 0,
          absoluteScale: 1,
          action: {}
        }
      ],
      viewPortWidth: 500,
      viewPortHeight: 500,
      keyZoomAmount: 10
    };

    this.idCounter = 0;
    this.editing = false;

    // Set default behavior.
    this.params = $.extend(true, this.defaults, params);

    // Array containing all libraries.
    this.content = [];
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
    var $viewsContainer = $(this.createViewsContainer());
    this.processViews(this.params.viewsGroup, $viewsContainer);
    $viewsContainer.appendTo(this.$inner);
    this.$jmpress = $('.jmpress', this.$inner);

    this.initJmpress();
    this.initZoomFunctionality();
  };

  ImpressPresentation.prototype.processViews = function (viewsData, $wrapper) {
    console.log(viewsData);
    // Remove all children
    $wrapper.children().remove();

    var self = this;
    var actionInstance = null;
    var actionArray = [];

    if (viewsData === undefined) {
      return $wrapper;
    }

    viewsData.forEach(function (viewInstance, viewInstanceIndex) {
      var $viewHtml = self.createViewHtml(self.idCounter,
        viewInstance.centerText,
        viewInstance.yPosition,
        viewInstance.xPosition,
        viewInstance.zPosition,
        viewInstance.absoluteRotation,
        viewInstance.absoluteScale);

      if (viewInstance.action.library !== undefined) {
        var $libraryContainer = $('<div>', {
          'class': 'h5p-impress-content'
        }).appendTo($viewHtml);
        actionInstance = new H5P.newRunnable(viewInstance.action, this.contentId, $libraryContainer);
        actionArray.push(actionInstance);
      }
      self.idCounter += 1;
      $viewHtml.appendTo($wrapper);
    });

    this.content = actionArray;
  };

  ImpressPresentation.prototype.createViewsContainer = function () {
    var viewsHtml = '<article class="jmpress" tabindex="0"></article>';

    return viewsHtml;
  };

  ImpressPresentation.prototype.createViewHtml = function (id, centerText, yPos, xPos, zPos, rotation, scale) {
    var classString = STANDARD_VIEW_CLASS;
    if (centerText !== undefined && centerText) {
      classString += ' h5p-center-view';
    }

    var viewHtml =
      '<section class="' + classString +
      '" id="' + ID_PREFIX + id +
      '" data-y="' + yPos +
      '" data-x="' + xPos;

    if (zPos !== undefined && !isNaN(zPos)) {
      viewHtml += '" data-z="' + zPos;
    }

    if (rotation !== undefined && !isNaN(rotation)) {
      viewHtml += '" data-rotate="' + rotation;
    }
    if (scale !== undefined && !isNaN(scale)) {
      viewHtml += '" data-scale="' + scale;
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
          49: 'zoomin',
          50: 'zoomout',
          51: 'scaleup',
          52: 'scaledown'
        }
      },
      containerClass: 'jmpress-container',
      canvasClass: 'jmpress-canvas',
      areaClass: 'jmpress-area-camera',
      fullscreen: false,
      hash: { use: false}
    };

    this.$jmpress.jmpress(config);
  };

  ImpressPresentation.prototype.initZoomFunctionality = function () {
    var self = this;
    this.$jmpress.jmpress("register", "zoomin", function () {
      if (this.editing) {
        var $activeSlide = $(this).jmpress('active');
        $activeSlide.data().stepData.z += self.params.keyZoomAmount;
        self.reselectStep();
      }

    });
    this.$jmpress.jmpress("register", "zoomout", function () {
      if (this.editing) {
        var $activeSlide = $(this).jmpress('active');
        $activeSlide.data().stepData.z -= self.params.keyZoomAmount;
        self.reselectStep();
      }
    });
  };

  /**
   * Reselct current step, needed for some steps to update.
   */
  ImpressPresentation.prototype.reselectStep = function () {
    var $activeSlide = this.$jmpress.jmpress('active');
    this.$jmpress.jmpress('reapply', $activeSlide);
    this.$jmpress.jmpress('select', $activeSlide, 'resize');
  };

  /**
   * Deinitializes jmpress, this needs to be used when dynamically removings steps.
   */
  ImpressPresentation.prototype.deinitJmpress = function () {
    this.$jmpress.jmpress('deinit');
  };

  ImpressPresentation.prototype.resize = function () {
    // Fit viewport to available space
    var containerWidth = this.$inner.width();
    var containerHeight = (containerWidth * 9) / 16;
    this.$inner.height(containerHeight);

    this.deinitJmpress();
    this.initJmpress(containerWidth, containerHeight);
  };

  ImpressPresentation.prototype.addStep = function () {
    // Initialize new step at the position of active step
    var $activeStep = this.$jmpress.jmpress('active');
    var activeStepData = $activeStep.data().stepData;
    var $newStep = this.createViewHtml(this.idCounter, true, activeStepData.y,
      activeStepData.x, activeStepData.z, activeStepData.rotate, activeStepData.scale);

    $('<div>', {
      'class': 'impres-edit-information',
      'html': 'Description on how to control the position of the slide!'
    }).appendTo($newStep);

    this.idCounter += 1;
    this.$jmpress.jmpress('canvas').append($newStep);
    this.$jmpress.jmpress('init', $newStep);

    // Set step as current
    this.$jmpress.jmpress('goTo', '#' + ID_PREFIX + this.getUniqueId($newStep));
  };

  /**
   * Toggle editor mode.
   */
  ImpressPresentation.prototype.toggleEditorMode = function () {
    console.log("toggle editor mode");
    console.log(this.editing);
    if (this.editing) {
      this.disableEditorMode();
    } else {
      this.enableEditorMode();
    }
  };

  /**
   * Enable editor mode, let's the user pan, zoom and rotate
   * the current step. Disables click navigation.
   */
  ImpressPresentation.prototype.enableEditorMode = function () {
    var settings = this.$jmpress.jmpress('settings');
    // Disable click navigation
    settings.mouse.clickSelects = false;
    this.editing = true;

    // Enable dragging
    this.initMouseListeners();
  };

  /**
   * Disable editor mode.
   */
  ImpressPresentation.prototype.disableEditorMode = function () {
    this.editing = false;
    var settings = this.$jmpress.jmpress('settings');
    settings.mouse.clickSelects = true;
  };

  ImpressPresentation.prototype.setUniqueId = function ($step, id) {
    $step.attr('id', ID_PREFIX + id);
  };

  ImpressPresentation.prototype.getUniqueId = function ($step) {
    var stepId = $step.attr('id');
    var id = stepId.split(ID_PREFIX);
    return id[1];
  };

  /**
   * Initializes mouse dragging functionality.
   */
  ImpressPresentation.prototype.initMouseListeners = function () {
    var self = this;
    var isDragging = false;
    var initialPos = {
      x: 0,
      y: 0
    };
    var currentPos = {
      x: 0,
      y: 0
    };
    var $activeStep;
    var initialData;

    this.$jmpress.mousedown(function (e) {
      if (self.editing) {
        initialPos.x = e.clientX;
        initialPos.y = e.clientY;
        isDragging = true;
        $activeStep = self.$jmpress.jmpress('active');
        initialData = $.extend({}, $activeStep.data().stepData);
      }
    });

    this.$jmpress.mouseup(function () {
      if (self.editing) {
        isDragging = false;

        // Record the latest coordinates into params
        var currentId = self.getUniqueId($activeStep);
        var activeStepData = $activeStep.data().stepData;
        var newStepParams = {
          yPosition: activeStepData.y,
          xPosition: activeStepData.x,
          zPosition: activeStepData.z,
          absoluteRotation: activeStepData.rotate,
          absoluteScale: activeStepData.scale
        };

        $.extend(self.params.viewsGroup[currentId], newStepParams);
        self.trigger('paramsChanged', self.params);
        console.log("params changed fired!");
      }
    });

    this.$jmpress.mousemove(function (e) {
      if (isDragging && self.editing) {
        currentPos.x = e.clientX;
        currentPos.y = e.clientY;

        // distance mouse moved since start of drag
        var deltaX = currentPos.x - initialPos.x;
        var deltaY = currentPos.y - initialPos.y;

        // Update active step
        $activeStep.data().stepData.x = initialData.x - deltaX;
        $activeStep.data().stepData.y = initialData.y - deltaY;
        self.reselectStep();

        // Do not propagate, prevents dragging of images/items
        return false;
      }
    });
  };

  ImpressPresentation.prototype.getSteps = function () {
    return this.$jmpress.jmpress('canvas').children();
  };

  ImpressPresentation.prototype.getActiveStepParamIndex = function () {
    var $steps = this.getSteps();
    var $activeStep = this.$jmpress.jmpress('active');
    var paramIndex = $steps.index($activeStep);
    console.log("active index");
    console.log(paramIndex);
    return paramIndex;
  };

  ImpressPresentation.prototype.refocusView = function () {
    this.$jmpress.focus();
  };

  return ImpressPresentation;

}(H5P.jQuery, H5P.EventDispatcher));

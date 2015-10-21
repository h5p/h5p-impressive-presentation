var H5P = H5P || {};

/**
 * Impress Presentation module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.ImpressPresentation = (function ($, EventDispatcher, Step, JoubelUI) {

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} contentId Content identification
   * @param {Object} [options] Options object
   * @param {Boolean} [options.disableNavLine] Disable navigation line
   * @returns {Object} ImpressPresentation ImpressPresentation instance
   */
  function ImpressPresentation(params, contentId, options) {
    var self = this;

    /**
     * Inherit event functionality
     */
    EventDispatcher.call(this);

    /**
     * Keep track of content id
     * @type {Number}
     */
    self.contentId = contentId;

    /**
     * Default step parameters
     */
    self.defaultStepParams = {
      action: {},
      backgroundGroup: {
        transparentBackground: true,
        backgroundColor: 'fff',
        backgroundWidth: 640,
        backgroundHeight: 360
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
      },
      ordering: {
        includeInPath: true,
        uniqueId: 0
      }
    };

    /**
     * Default IP parameters
     */
    self.defaultParams = {
      viewsGroup: {
        perspectiveRatio: 1,
        views: [
          self.defaultStepParams
        ]
      },
      viewPortWidth: 640,
      viewPortHeight: 360,
      keyZoomAmount: 10
    };

    // Extend default params
    self.params = $.extend(true, self.defaults, params);

    // Initialization options
    var defaultOptions = {
      disableNavLine: false
    };
    self.options = $.extend(true, defaultOptions, options);

    /**
     * Default jmpress config
     */
    self.jmpressConfig = {
      stepSelector: 'section',
      viewPort: {
        height: self.defaultParams.viewPortHeight,
        width: self.defaultParams.viewPortWidth
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

    /**
     * Keeps track of step id
     * @type {number}
     */
    self.idCounter = 0;

    /**
     * Keeps track of steps
     * @type {Array}
     */
    self.steps = [];

    /**
     * Keeps track of route order when navigating between steps
     * @type {Array}
     */
    self.route = [];

    self.on('resize', function () {
      self.resize();
    });
  }

  /**
   * Static final id prefix for sections.
   * @type {string}
   */
  ImpressPresentation.ID_PREFIX = 'h5p-impress-id-';

  // Inherit from event dispatcher
  ImpressPresentation.prototype = Object.create(EventDispatcher.prototype);
  ImpressPresentation.prototype.constructor = ImpressPresentation;

  /**
   * Attach function called by H5P framework to insert H5P content into page.
   * @param {jQuery} $container The container which will be appended to.
   */
  ImpressPresentation.prototype.attach = function ($container) {
    var self = this;
    $container.addClass('h5p-impress-presentation');

    self.$inner = $('<div>', {
      'class': "h5p-impress-wrapper"
    }).appendTo($container);

    // Process views
    self.$jmpress = $('<article class="jmpress" tabindex="0"></article>');
    self.processSteps(self.params.viewsGroup.views);
    self.$jmpress.appendTo(self.$inner);

    /**
     * Overlay for handling focus.
     * @type {*|HTMLElement}
     */
    self.$overlay = $('<div>', {
      'class': 'h5p-impress-overlay'
    }).click(function () {
      $(this).addClass('hide');
      self.$jmpress.focus();
      return false;
    }).appendTo(self.$jmpress);

    self.initJmpress();
    self.route = self.params.viewsGroup.route ? self.params.viewsGroup.route : self.route;
    self.$jmpress.jmpress('goTo', self.route[0]);

    if (!self.options.disableNavLine) {
      self.createNavLine().appendTo($container);
    }

    self.updateRoute();
    self.resize(true);
  };

  /**
   * Create navigation buttons
   */
  ImpressPresentation.prototype.createNavLine = function () {
    var self = this;

    var $navLine = $('<div>', {
      'class': 'h5p-impress-nav-line'
    });

    // Previous step
    JoubelUI.createButton({
      'class': 'h5p-impress-nav-button'
    }).click(function () {
      self.$jmpress.jmpress('prev');
    }).appendTo($navLine);

    // Next step
    JoubelUI.createButton({
      'class': 'h5p-impress-nav-button next'
    }).click(function () {
      self.$jmpress.jmpress('next');
    }).appendTo($navLine);

    return $navLine;
  };

  /**
   * Process view params, creating objects and attaching elements.
   * @param {Array} stepParams Array containing step params to be processed
   */
  ImpressPresentation.prototype.processSteps = function (stepParams) {
    var self = this;

    // No data
    if (stepParams === undefined) {
      return;
    }

    // Remove children before (re)populating
    self.$jmpress.children().remove();
    self.steps = [];

    stepParams.forEach(function (singleStepParams) {
      self.createStep(singleStepParams);
    });
  };

  /**
   * Create view and append it to wrapper.
   * @param {Object} singleStepParams
   * @param {Boolean} [addToParams]
   * @param {Number} [afterIndex]
   * @returns {Step} step
   */
  ImpressPresentation.prototype.createStep = function (singleStepParams, addToParams, afterIndex) {
    var self = this;

    addToParams = addToParams ? addToParams : false;

    var $stepContainer = self.$jmpress;
    if (self.$jmpress.jmpress('initialized')) {
      $stepContainer = self.$jmpress.jmpress('canvas');
    }

    // Add id counter to params
    if (singleStepParams.ordering.uniqueId !== undefined) {
      if (singleStepParams.ordering.uniqueId > self.idCounter) {
        self.idCounter = singleStepParams.ordering.uniqueId;
      }
    } else {
      singleStepParams.ordering.uniqueId = self.idCounter;
    }

    // Add id counter to params
    singleStepParams.ordering.uniqueId = self.idCounter;

    // Create object
    var step = new Step(self.idCounter, singleStepParams)
      .init()
      .setBackground(this.contentId)
      .appendTo($stepContainer);

    self.trigger('createdStep', step);
    if (addToParams) {
      self.params.viewsGroup.views.push(singleStepParams);
    }

    if (singleStepParams.ordering.includeInPath) {
      self.addToRoute(step.getId(), afterIndex);
    }

    self.steps.push(step);
    self.idCounter += 1;

    return step;
  };

  /**
   * Remove step corresponding to step id
   * @param {Number} stepId
   */
  ImpressPresentation.prototype.removeStep = function (stepId) {
    var self = this;
    self.steps.splice(stepId, 1);
    self.removeFromRoute(stepId);
    self.params.viewsGroup.views.splice(self.getStepParamsIndexById(stepId), 1);
    self.updateRoute();
  };

  /**
   * Add to navigation route
   * @param {Number} stepId
   * @param {Number} [insertAfterId] Element will be inserted after given id in route
   */
  ImpressPresentation.prototype.addToRoute = function (stepId, insertAfterId) {
    var self = this;
    var elementId = self.createUniqueElementId(stepId);

    // Already exists
    if (self.route.indexOf(stepId) > -1) {
      return;
    }

    var indexOfAfterElement;
    if (insertAfterId !== undefined) {
      var afterElementId = self.createUniqueElementId(insertAfterId);
      indexOfAfterElement = self.route.indexOf(afterElementId);
    }

    if (indexOfAfterElement !== undefined && indexOfAfterElement >= 0 && indexOfAfterElement < self.route.length - 1) {
      self.route.splice((indexOfAfterElement + 1), 0, elementId);
    }
    else {
      self.route.push(elementId);
    }
  };

  ImpressPresentation.prototype.removeFromRoute = function (stepId) {
    var self = this;
    var elementId = self.createUniqueElementId(stepId);
    var routeIndex = self.route.indexOf(elementId);
    if (routeIndex > -1) {
      self.route.splice(routeIndex, 1);
    }
  };

  /**
   * Update route.
   */
  ImpressPresentation.prototype.updateRoute = function () {
    var self = this;
    self.$jmpress.jmpress('route', $.merge($.merge([self.route[self.route.length - 1]], self.route), [self.route[0]]));
  };

  /**
   * Get step from unique id
   * @param {Number} uniqueId
   * @returns {H5P.ImpressPresentation.Step}
   */
  ImpressPresentation.prototype.getStep = function (uniqueId) {
    var self = this;
    var i;
    var step;
    for (i = 0; i < self.steps.length; i++) {
      if (self.steps[i].getId() === uniqueId) {
        step = self.steps[i];
        break;
      }
    }

    return step;
  };

  ImpressPresentation.prototype.createUniqueElementId = function (uniqueId) {
    return '#' + ImpressPresentation.ID_PREFIX + uniqueId;
  };

  /**
   * Get step param by id.
   * @param {Number} id
   * @returns {Object}
   */
  ImpressPresentation.prototype.getStepParamsIndexById = function (id) {
    var self = this;
    var i;
    for (i = 0; i < self.params.viewsGroup.views.length; i++) {
      if (self.params.viewsGroup.views[i].ordering.uniqueId === id) {
        return i;
      }
    }
  };

  /**
   * Initializes Jmpress.
   * @param {Object} [config] Falls back to default config
   */
  ImpressPresentation.prototype.initJmpress = function (config) {
    var self = this;
    config = config ? config : self.jmpressConfig;
    self.$jmpress.jmpress(config);
  };

  /**
   * Resize perspective to new wrapper size.
   * @param setViewPort
   */
  ImpressPresentation.prototype.resize = function (setViewPort) {
    var self = this;

    // Fit viewport to available space
    var containerWidth = self.$inner.width();
    var containerHeight = (containerWidth * 9) / 16;
    self.$inner.height(containerHeight);

    // Update jmpress viewport
    var settings = self.$jmpress.jmpress('settings');
    if (setViewPort) {
      self.$jmpress.jmpress('settings').viewPort.width = containerWidth;
      self.$jmpress.jmpress('settings').viewPort.height = containerHeight;
    }
    settings.perspective = containerWidth / self.params.viewsGroup.perspectiveRatio;

    self.$jmpress.jmpress('reselect');
  };

  ImpressPresentation.prototype.refocusView = function () {
    var self = this;
    self.$jmpress.focus();
  };

  return ImpressPresentation;

}(H5P.jQuery, H5P.EventDispatcher, H5P.ImpressPresentation.Step, H5P.JoubelUI));

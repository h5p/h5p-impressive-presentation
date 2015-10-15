var H5P = H5P || {};

/**
 * Impress Presentation module
 * @external {jQuery} $ H5P.jQuery
 */
H5P.ImpressPresentation = (function ($, EventDispatcher, Step) {

  /**
   * Initialize module.
   * @param {Object} params Behavior settings
   * @param {Number} contentId Content identification
   * @returns {Object} ImpressPresentation ImpressPresentation instance
   */
  function ImpressPresentation(params, contentId) {
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
        pathIndex: 1
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
    }).appendTo($container);

    self.initJmpress();
    self.resize();
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
   * @param {Boolean} addToParams
   * @returns {Step} step
   */
  ImpressPresentation.prototype.createStep = function (singleStepParams, addToParams) {
    var self = this;

    addToParams = addToParams ? addToParams : false;

    // Create object
    var step = new Step(self.idCounter, singleStepParams)
      .init()
      .setBackground(this.contentId)
      .appendTo(self.$jmpress);

    self.trigger('createdStep', step);
    if (addToParams) {
      self.params.viewsGroup.views.push(singleStepParams);
    }

    self.steps.push(step);
    self.idCounter += 1;

    return step;
  };

  /**
   * Get step from unique id
   * @param {Number} uniqueId
   * @returns {Step|undefined}
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

  ImpressPresentation.prototype.removeStep = function (uniqueId) {
    var self = this;
    self.steps.splice(uniqueId, 1);
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
    settings.perspective = containerWidth / self.params.viewsGroup.perspectiveRatio;

    self.$jmpress.jmpress('reselect');
  };

  ImpressPresentation.prototype.refocusView = function () {
    var self = this;
    self.$jmpress.focus();
  };

  return ImpressPresentation;

}(H5P.jQuery, H5P.EventDispatcher, H5P.ImpressPresentation.Step));

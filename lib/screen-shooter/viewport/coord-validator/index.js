'use strict';

const debug = require('debug');
const HeightViewportError = require('./errors/height-viewport-error');
const OffsetViewportError = require('./errors/offset-viewport-error');

const isOutsideOfViewport = (viewport, cropArea) =>
    cropArea.top < 0 || cropArea.left < 0 || cropArea.left + cropArea.width > viewport.width;

module.exports = class CoordValidator {
    static create(...args) {
        return new CoordValidator(...args);
    }

    /**
     * @param {Browser} browser session instance
     * @param {Object} opts
     * @param {Boolean} [opts.allowViewportOverflow=false] ignore OffsetViewportError
     */
    constructor(browser, {allowViewportOverflow = false} = {}) {
        this._log = debug('gemini-core:coord-validator:' + browser.id);
        this._allowViewportOverflow = allowViewportOverflow;
    }

    /**
     * Validates compatibility of viewport and crop area coordinates
     * @param {Object} viewport
     * @param {Object} cropArea
     */
    validate(viewport, cropArea) {
        this._log('viewport size', viewport);
        this._log('crop area', cropArea);

        if (!this._allowViewportOverflow && isOutsideOfViewport(viewport, cropArea)) {
            return this._reportOffsetViewportError();
        }

        if (cropArea.height > viewport.height) {
            return this._reportHeightViewportError(viewport, cropArea);
        }
    }

    /**
     * Reports error if crop area is outside of viewport
     * @returns {OffsetViewportError}
     * @private
     */
    _reportOffsetViewportError() {
        this._log('crop area is outside of the viewport left, top or right bounds');

        const message = `Can not capture the specified region of the viewport.
            Position of the region is outside of the viewport left, top or right bounds.
            Check that elements:
             - does not overflows the document
             - does not overflows browser viewport
            Alternatively, you can increase browser window size using
            "setWindowSize" or "windowSize" option in the config file.`;

        throw new OffsetViewportError(message);
    }

    /**
     * This case is handled specially because of Opera 12 browser.
     * Problem, described in error message occurs there much more often then
     * for other browsers and has different workaround
     * @param {Object} viewport
     * @param {Object} cropArea - crop area
     * @returns {HeightViewportError}
     * @private
     */
    _reportHeightViewportError(viewport, cropArea) {
        this._log('crop area bottom bound is outside of the viewport height');

        const message = `Can not capture the specified region of the viewport.
            The region bottom bound is outside of the viewport height.
            Alternatively, you can test such cases by setting "true" value to option "compositeImage" in the config file.
            Element position: ${cropArea.left}, ${cropArea.top}; size: ${cropArea.width}, ${cropArea.height}.
            Viewport size: ${viewport.width}, ${viewport.height}.`;

        throw new HeightViewportError(message);
    }
};

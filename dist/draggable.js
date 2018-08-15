//
// for each droppable, give Location => FastUpdate (move over/get bigger if needed) and Location => DropUpdate
// for each draggable predrag fastupdate (if mobile aimate drag icon), startdrag fastupdate (hide it!), drag renderer (to be put in an transformed box)
// scrollbucket -> dimensions. dimensions
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
define(["require", "exports", "react", "prop-types"], function (require, exports, React, prop_types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    var Draggable = /** @class */ (function (_super) {
        __extends(Draggable, _super);
        function Draggable() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.ref = null;
            // True if a drag event has possibly started, but we have to wait through a delay to be sure.
            _this.waitingToStartDrag = false;
            // True if we're actually dragging right now.
            _this.currentlyDragging = false;
            // Mouse drags require the mouse to move a certain distance before it counts
            // as a drag. We store the initial click location for comparison.
            _this.startLoc = { x: 0, y: 0 };
            _this.previousPos = { x: 0, y: 0 };
            _this.onPointerUp = function (e) {
                _this.waitingToStartDrag = false;
                if (_this.currentlyDragging) {
                    _this.manager().drop(e);
                }
                _this.currentlyDragging = false;
            };
            _this.strategies = {
                // WAIT FOR TIME STRATEGY: Time delay event become drags if you longpress.
                waitForTime: {
                    start: function (e) {
                        // We interact with this event after at timeout, so persist it.
                        if (_this.persistableEvent(e))
                            e.persist();
                        _this.waitingToStartDrag = true;
                        _this.manager().maybeStart(e);
                        // If we haven't moved after delay, then jump to dragging mode
                        setTimeout(function () {
                            if (!_this.ref)
                                return;
                            e.stopPropagation();
                            e.preventDefault();
                            if (!_this.waitingToStartDrag)
                                return;
                            _this.currentlyDragging = true;
                            _this.manager().start(e, _this.ref, _this.dragRenderer, _this.props.monitor, _this.props.onDrop);
                        }, _this.props.timeThresholdMs || 120);
                    },
                    move: function (e) {
                        if (_this.waitingToStartDrag) {
                            _this.waitingToStartDrag = false;
                            e.preventDefault();
                            _this.manager().cancelStart();
                        }
                        else if (_this.currentlyDragging) {
                            e.preventDefault();
                            // Touch event remain with the object that the touch started on, so for
                            // touch events, we have to transmit the event up to the manager.
                            _this.manager().move(e);
                        }
                    },
                    cancel: function (e) {
                        if (_this.waitingToStartDrag) {
                            _this.waitingToStartDrag = false;
                            _this.manager().cancelStart();
                        }
                        else if (_this.currentlyDragging) {
                            _this.onPointerUp(e);
                        }
                    }
                },
                // WAIT FOR MOTION STRATEGY: Wait until the pointer moves before triggering a drag (allows for clicks)
                // TODO make work for touch
                waitForMotion: {
                    start: function (e) {
                        if (!_this.isTouch(e) && e.button)
                            return; // left clicks only!
                        _this.waitingToStartDrag = true;
                        _this.manager().maybeStart(e);
                        _this.startLoc = _this.getEventPosition(e);
                        e.stopPropagation();
                    },
                    move: function (e) {
                        if (!_this.ref)
                            return;
                        if (_this.waitingToStartDrag) {
                            var loc = _this.getEventPosition(e);
                            var dx = loc.x - _this.startLoc.x;
                            var dy = loc.y - _this.startLoc.y;
                            if (dx * dx + dy * dy > 16) {
                                _this.manager().start(e, _this.ref, _this.dragRenderer, _this.props.monitor, _this.props.onDrop);
                                _this.waitingToStartDrag = false;
                                _this.currentlyDragging = true;
                            }
                        }
                        else {
                            // Touch event remain with the object that the touch started on, so for
                            // touch events, we have to transmit the motion event up to the manager.
                            _this.manager().move(e);
                        }
                    },
                    cancel: _this.onPointerUp
                },
                // INSTANT STRATEGY: Start dragging immediately
                instant: {
                    start: function (e) {
                        _this.waitingToStartDrag = true;
                        _this.currentlyDragging = true;
                        _this.manager().maybeStart(e);
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    move: function (e) {
                        if (!_this.ref)
                            return;
                        if (_this.waitingToStartDrag) {
                            _this.waitingToStartDrag = false;
                            _this.manager().start(e, _this.ref, _this.dragRenderer, _this.props.monitor, _this.props.onDrop);
                        }
                        else {
                            _this.manager().move(e);
                        }
                    },
                    cancel: _this.onPointerUp
                }
            };
            _this.dragRenderer = function () {
                if (_this.props.dragRender) {
                    return _this.props.dragRender();
                }
                else {
                    return React.createElement("div", { style: __assign({}, _this.props.style, style.wrapper) }, _this.props.children);
                }
            };
            _this.setRef = function (r) {
                _this.ref = r;
                if (!r)
                    return;
                var touchStrategy = _this.strategies[_this.props.touchStrategy];
                // We have to set touchstart and touchmove event handlers here, because they
                // must be made non-passive in order to preventDefault(); and react is
                // dragging its feet about providing a way to do so.
                r.addEventListener("touchstart", touchStrategy.start, { passive: false });
                r.addEventListener("touchmove", touchStrategy.move, { passive: false });
                r.addEventListener("touchcancel", touchStrategy.cancel, { passive: false });
            };
            return _this;
        }
        Draggable.prototype.manager = function () {
            return this.context.dragManagers[this.props.contextName];
        };
        // Unifying touch and mouse event locations:
        Draggable.prototype.isTouch = function (e) {
            return !!e['touches'];
        };
        Draggable.prototype.getEventPosition = function (e) {
            var pos;
            if (this.isTouch(e)) {
                if (e.touches[0]) {
                    pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
                else {
                    pos = this.previousPos;
                }
            }
            else {
                pos = { x: e.clientX, y: e.clientY };
            }
            this.previousPos = pos;
            return pos;
        };
        Draggable.prototype.persistableEvent = function (e) {
            return !!e['persist'];
        };
        Draggable.prototype.render = function () {
            if (this.props.disabled) {
                return React.createElement("div", { style: __assign({}, this.props.style, style.wrapper) }, this.props.children);
            }
            var mouseStrategy = this.strategies[this.props.mouseStrategy];
            return (React.createElement("div", __assign({ ref: this.setRef, onMouseDown: mouseStrategy.start, onMouseMove: mouseStrategy.move, onMouseUp: this.onPointerUp, onTouchEnd: this.onPointerUp }, style.wrapper, { style: __assign({}, this.props.style, style.wrapper) }), this.props.children));
        };
        Draggable.contextTypes = {
            dragManagers: prop_types_1.object
        };
        return Draggable;
    }(React.Component));
    exports.Draggable = Draggable;
    var style = {
        wrapper: {
            userSelect: 'none',
            touchCallout: 'none'
        }
    };
});
//# sourceMappingURL=draggable.js.map
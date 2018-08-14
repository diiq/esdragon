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
define("utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.vendorPrefix = (function () {
        var styles = window.getComputedStyle(document.documentElement, '');
        var pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/))[1];
        switch (pre) {
            case 'ms':
                return 'ms';
            default:
                return pre && pre.length ? pre[0].toUpperCase() + pre.substr(1) : '';
        }
    })();
    function fastMove(ref, loc) {
        ref.style[exports.vendorPrefix + "Transform"] = "translate3d(" + loc.x + "px," + loc.y + "px, 0)";
    }
    exports.fastMove = fastMove;
    function perimeterScroller(xScrollable, yScrollable) {
        var autoscrollInterval = null;
        function stop() {
            if (autoscrollInterval) {
                clearInterval(autoscrollInterval);
                autoscrollInterval = -1;
            }
            return;
        }
        return {
            // TODO rewrite this to look more like Timeline scroller
            scroll: function (loc) {
                // Safety valve; if things go borken, we don't want the page stuck in
                // permascroll hell.
                // This is probably hiding a bug on mobile.
                setTimeout(stop, 1000);
                var acceleration = 0.175;
                var scrollArea = 100;
                var x = loc.unscrolled.x;
                var y = loc.unscrolled.y;
                function speedGivenLocation(distanceFromEdge) {
                    if (distanceFromEdge < scrollArea) {
                        return (scrollArea - distanceFromEdge) * acceleration;
                    }
                    return 0;
                }
                var dy = speedGivenLocation(yScrollable.clientHeight - y) || -speedGivenLocation(y);
                var dx = speedGivenLocation(xScrollable.clientWidth - x) || -speedGivenLocation(x);
                if (autoscrollInterval) {
                    clearInterval(autoscrollInterval);
                    autoscrollInterval = null;
                }
                if (!isNaN(dx) || !isNaN(dy)) {
                    autoscrollInterval = setInterval(function () {
                        if (!isNaN(dx))
                            xScrollable.scrollLeft += dx;
                        if (!isNaN(dy))
                            yScrollable.scrollTop += dy;
                    }, 5);
                }
                ;
            },
            stop: stop
        };
    }
    exports.perimeterScroller = perimeterScroller;
    // When you gotta do something expensive while at the same time maintaining high
    // framerate, just do as much as you can each frame and continue next time.
    function framerateLoop(items, fn) {
        var i = 0;
        var ret = { done: false };
        var loop = function () {
            var startTime = Date.now();
            while (i < items.length && Date.now() - startTime < 32) {
                fn(items[i]);
                i++;
            }
            if (i < items.length) {
                requestAnimationFrame(loop);
            }
            else {
                ret.done = true;
            }
        };
        requestAnimationFrame(loop);
        return ret;
    }
    exports.framerateLoop = framerateLoop;
});
define("drag-context", ["require", "exports", "react", "prop-types", "utils"], function (require, exports, React, prop_types_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    var defaultProps = {
        xScroller: function () { return document.documentElement; },
        yScroller: function () { return document.documentElement; }
    };
    var DragContext = /** @class */ (function (_super) {
        __extends(DragContext, _super);
        function DragContext() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.state = {};
            _this.manager = null;
            _this.actors = {};
            _this.dragee = null;
            _this.hiddenDragee = null;
            _this.pointerOffset = { x: 0, y: 0 };
            _this.oldDisplay = null;
            _this.monitor = {};
            _this.dragStart = { done: false };
            _this.onDrop = null;
            _this.handlePreventTouchmoveWhenPanning = function (event) {
                if (_this.state.dragee) {
                    event.preventDefault();
                }
            };
            _this.addActor = function (id, props) {
                _this.actors[id] = props;
            };
            _this.removeActor = function (id, actor) {
                if (_this.actors[id] != actor)
                    return;
                delete _this.actors[id];
            };
            _this.maybeStart = function (e) {
                _this.setState({ maybeStart: true });
            };
            _this.cancelStart = function () {
                _this.setState({ maybeStart: false });
            };
            _this.start = function (e, ref, dragRenderer, monitor, onDrop) {
                // Prepare the env
                _this.onDrop = onDrop;
                _this.monitor = monitor;
                _this.hiddenDragee = ref;
                _this.setDrageeOffset(e, ref);
                // Place the draggable draggee
                _this.setState({ dragee: dragRenderer });
                _this.setDrageePosition(e);
                // Hide the undraggable dragee
                _this.oldDisplay = _this.hiddenDragee.style.display;
                _this.hiddenDragee.style.display = "none";
                // Tell all the actors we're starting
                _this.dragStart = utils_1.framerateLoop(_this.actorsArray(), function (a) { return a.dragStart && a.dragStart(_this.monitor); });
                // Don't do anything else.
                e.stopPropagation();
                e.preventDefault();
            };
            _this.move = function (e) {
                if (!_this.state.dragee)
                    return;
                _this.setDrageePosition(e);
                if (_this.dragStart.done) {
                    _this.actActors(e);
                }
                e.stopPropagation();
                e.preventDefault();
            };
            _this.drop = function (e) {
                _this.setState({ dragee: null });
                if (!_this.hiddenDragee)
                    return;
                _this.hiddenDragee.style.display = _this.oldDisplay;
                _this.actorsDo('dragStop', [_this.monitor, _this.richPosition(e)]);
                if (_this.onDrop)
                    _this.onDrop(_this.monitor);
                _this.monitor = null;
            };
            _this.previousPos = { x: 0, y: 0 };
            _this.setDragee = function (r) {
                _this.dragee = r;
            };
            return _this;
        }
        DragContext.prototype.componentDidMount = function () {
            window.document.body.addEventListener('touchmove', this.handlePreventTouchmoveWhenPanning, {
                passive: false
            });
        };
        DragContext.prototype.componentWillUnmount = function () {
            window.document.body.removeEventListener('touchmove', this.handlePreventTouchmoveWhenPanning, {
                passive: false
            });
        };
        DragContext.prototype.otherManagers = function () {
            return this.context.dragManagers || {};
        };
        DragContext.prototype.getChildContext = function () {
            var dragManagers = this.otherManagers();
            dragManagers[this.props.contextName] = {
                addActor: this.addActor,
                start: this.start,
                move: this.move,
                drop: this.drop,
                maybeStart: this.maybeStart,
                cancelStart: this.cancelStart,
                removeActor: this.removeActor
            };
            return { dragManagers: dragManagers };
        };
        DragContext.prototype.componentDidUpdate = function () {
            var scroller = utils_1.perimeterScroller(this.props.xScroller(), this.props.yScroller());
            this.actors["_scroller"] = {
                fastUpdate: scroller.scroll,
                dragStart: scroller.stop
            };
        };
        DragContext.prototype.actorsDo = function (action, args) {
            var _this = this;
            Object.keys(this.actors).forEach(function (actorId) {
                var _a;
                if (_this.actors[actorId][action]) {
                    (_a = _this.actors[actorId])[action].apply(_a, args);
                }
            });
        };
        DragContext.prototype.actActors = function (e) {
            var position = this.richPosition(e);
            this.actorsDo('fastUpdate', [position, this.monitor]);
        };
        // Helpers
        DragContext.prototype.actorsArray = function () {
            var _this = this;
            return Object.keys(this.actors).map(function (key) { return _this.actors[key]; });
        };
        DragContext.prototype.richPosition = function (e) {
            if (!this.dragee)
                return; // Could be an assertion instead, TBH
            var drageeSize = this.dragee.getBoundingClientRect();
            var pos = this.getEventPosition(e);
            var scrollTop = this.props.yScroller().scrollTop;
            var scrollLeft = this.props.xScroller().scrollLeft;
            return {
                centroid: {
                    x: pos.x + this.pointerOffset.x + drageeSize.width / 2 + scrollLeft,
                    y: pos.y + this.pointerOffset.y + drageeSize.height / 2 + scrollTop,
                },
                topLeft: {
                    x: pos.x + this.pointerOffset.x + scrollLeft,
                    y: pos.y + this.pointerOffset.y + scrollTop,
                },
                mouse: {
                    x: pos.x + scrollLeft,
                    y: pos.y + scrollTop
                },
                unscrolled: {
                    x: pos.x,
                    y: pos.y
                }
            };
        };
        DragContext.prototype.isTouch = function (e) {
            return !!e['touches'];
        };
        DragContext.prototype.getEventPosition = function (e) {
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
        DragContext.prototype.setDrageePosition = function (e) {
            if (!this.dragee)
                return;
            var pos = this.getEventPosition(e);
            var x = pos.x + this.pointerOffset.x;
            var y = pos.y + this.pointerOffset.y;
            utils_1.fastMove(this.dragee, { x: x, y: y });
        };
        DragContext.prototype.setDrageeOffset = function (e, ref) {
            var pos = this.getEventPosition(e);
            var drageeLoc = ref.getBoundingClientRect();
            this.pointerOffset = {
                x: drageeLoc.left - pos.x,
                y: drageeLoc.top - pos.y
            };
        };
        DragContext.prototype.render = function () {
            var _this = this;
            return (React.createElement("div", { style: this.props.style },
                React.createElement("div", { onMouseMove: this.move, ref: function (r) {
                        if (!r)
                            return;
                        r.addEventListener("touchmove", _this.move, { passive: false });
                    }, onTouchEnd: this.drop, onTouchCancel: this.drop, onMouseUp: this.drop, style: __assign({}, style.dragLayer, { pointerEvents: this.state.dragee ? 'all' : 'none' }) },
                    React.createElement("div", { style: style.dragee, ref: this.setDragee }, this.state.dragee && this.state.dragee())),
                this.props.children));
        };
        DragContext.childContextTypes = {
            dragManagers: prop_types_1.object
        };
        DragContext.contextTypes = {
            dragManagers: prop_types_1.object
        };
        DragContext.defaultProps = defaultProps;
        return DragContext;
    }(React.Component));
    exports.DragContext = DragContext;
    var style = {
        dragLayer: {
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 10000,
        },
        dragee: {
            position: 'absolute',
            top: 0,
            left: 0,
            userSelect: 'none',
            touchCallout: 'none'
        }
    };
});
//
// for each droppable, give Location => FastUpdate (move over/get bigger if needed) and Location => DropUpdate
// for each draggable predrag fastupdate (if mobile aimate drag icon), startdrag fastupdate (hide it!), drag renderer (to be put in an transformed box)
// scrollbucket -> dimensions. dimensions
define("drag-actor", ["require", "exports", "react", "prop-types"], function (require, exports, React, prop_types_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    var DragActor = /** @class */ (function (_super) {
        __extends(DragActor, _super);
        function DragActor() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.actor = null;
            return _this;
        }
        DragActor.prototype.manager = function () {
            return this.context.dragManagers[this.props.contextName];
        };
        DragActor.prototype.componentDidMount = function () {
            this.actor = {
                fastUpdate: this.props.fastUpdate,
                dragStop: this.props.dragStop,
                dragStart: this.props.dragStart
            };
            this.manager().addActor(this.props.id, this.actor);
        };
        DragActor.prototype.componentWillReceiveProps = function (props) {
            this.actor = {
                fastUpdate: props.fastUpdate,
                dragStop: props.dragStop,
                dragStart: props.dragStart
            };
            this.manager().addActor(this.props.id, this.actor);
        };
        // TODO performance?
        DragActor.prototype.componentWillUnmount = function () {
            if (!this.actor)
                return;
            this.manager().removeActor(this.props.id, this.actor);
        };
        DragActor.prototype.render = function () {
            return React.createElement("div", { style: this.props.style, ref: this.props.setRef }, this.props.children);
        };
        DragActor.contextTypes = {
            dragManagers: prop_types_2.object
        };
        return DragActor;
    }(React.Component));
    exports.DragActor = DragActor;
});
//
// for each droppable, give Location => FastUpdate (move over/get bigger if needed) and Location => DropUpdate
// for each draggable predrag fastupdate (if mobile aimate drag icon), startdrag fastupdate (hide it!), drag renderer (to be put in an transformed box)
// scrollbucket -> dimensions. dimensions
define("draggable", ["require", "exports", "react", "prop-types"], function (require, exports, React, prop_types_3) {
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
            dragManagers: prop_types_3.object
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
define("index", ["require", "exports", "utils", "drag-context", "drag-actor", "draggable"], function (require, exports, utils_2, drag_context_1, drag_actor_1, draggable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fastMove = utils_2.fastMove;
    exports.perimeterScroller = utils_2.perimeterScroller;
    exports.DragContext = drag_context_1.DragContext;
    exports.DragActor = drag_actor_1.DragActor;
    exports.Draggable = draggable_1.Draggable;
});
//# sourceMappingURL=index.js.map
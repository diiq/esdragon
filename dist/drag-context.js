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
define(["require", "exports", "react", "prop-types", "./utils"], function (require, exports, React, prop_types_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    exports.defaultProps = {
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
        DragContext.defaultProps = exports.defaultProps;
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
//# sourceMappingURL=drag-context.js.map
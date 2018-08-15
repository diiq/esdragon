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
define(["require", "exports", "react", "prop-types"], function (require, exports, React, prop_types_1) {
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
            dragManagers: prop_types_1.object
        };
        return DragActor;
    }(React.Component));
    exports.DragActor = DragActor;
});
//# sourceMappingURL=drag-actor.js.map
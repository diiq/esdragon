//
// for each droppable, give Location => FastUpdate (move over/get bigger if needed) and Location => DropUpdate
// for each draggable predrag fastupdate (if mobile aimate drag icon), startdrag fastupdate (hide it!), drag renderer (to be put in an transformed box)
// scrollbucket -> dimensions. dimensions

import * as React from "react";
import { object } from "prop-types";
import { DragManager, DragEvent } from "./drag-context";

export interface DraggableProps {
  contextName: string;
  monitor: any;
  style?: React.CSSProperties;
  className?: string;
  touchStrategy?: "waitForMotion" | "waitForTime" | "instant";
  mouseStrategy?: "waitForMotion" | "waitForTime" | "instant";
  timeThresholdMs?: number;
  motionThresholdPx?: number;
  dragRender?: () => JSX.Element;
  onDrop?: (monitor: any) => void;
  disabled?: boolean;
}

export class Draggable extends React.Component<DraggableProps, {}> {
  static contextTypes: { dragManagers: React.Requireable<object> } = {
    dragManagers: object
  };
  static defaultProps = {
    touchStrategy: "waitForTime",
    mouseStrategy: "instant"
  };
  ref: HTMLDivElement | null = null;
  // True if a drag event has possibly started, but we have to wait through a delay to be sure.
  waitingToStartDrag = false;
  // True if we're actually dragging right now.
  currentlyDragging = false;
  // Mouse drags require the mouse to move a certain distance before it counts
  // as a drag. We store the initial click location for comparison.
  startLoc = { x: 0, y: 0 };

  manager() {
    return this.context.dragManagers[this.props.contextName] as DragManager;
  }

  // Unifying touch and mouse event locations:
  isTouch(e: DragEvent): e is React.TouchEvent<any> | TouchEvent {
    return !!e["touches"];
  }
  previousPos = { x: 0, y: 0 };
  getEventPosition(e: DragEvent) {
    var pos;
    if (this.isTouch(e)) {
      if (e.touches[0]) {
        pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        pos = this.previousPos;
      }
    } else {
      pos = { x: e.clientX, y: e.clientY };
    }
    this.previousPos = pos;
    return pos;
  }

  persistableEvent(
    e: DragEvent
  ): e is React.TouchEvent<any> | React.MouseEvent<any> {
    return !!e["persist"];
  }

  onPointerUp = (e: DragEvent) => {
    this.waitingToStartDrag = false;
    if (this.currentlyDragging) {
      this.manager().drop(e);
    }
    this.currentlyDragging = false;
  };

  strategies = {
    // WAIT FOR TIME STRATEGY: Time delay event become drags if you longpress.
    waitForTime: {
      start: (e: DragEvent) => {
        // We interact with this event after at timeout, so persist it.

        if (this.persistableEvent(e)) e.persist();
        this.waitingToStartDrag = true;
        this.manager().maybeStart(e);
        // If we haven't moved after delay, then jump to dragging mode
        setTimeout(() => {
          if (!this.ref) return;
          e.stopPropagation();
          e.preventDefault();
          if (!this.waitingToStartDrag) return;
          this.currentlyDragging = true;
          this.manager().start(
            e,
            this.ref,
            this.dragRenderer,
            this.props.monitor,
            this.props.onDrop
          );
        }, this.props.timeThresholdMs || 120);
      },

      move: (e: DragEvent) => {
        if (this.waitingToStartDrag) {
          this.waitingToStartDrag = false;
          this.manager().cancelStart();
        } else if (this.currentlyDragging) {
          e.preventDefault();
          // Touch event remain with the object that the touch started on, so for
          // touch events, we have to transmit the event up to the manager.
          this.manager().move(e);
        }
      },

      cancel: (e: DragEvent) => {
        if (this.waitingToStartDrag) {
          this.waitingToStartDrag = false;
          this.manager().cancelStart();
        } else if (this.currentlyDragging) {
          this.onPointerUp(e);
        }
      }
    },

    // WAIT FOR MOTION STRATEGY: Wait until the pointer moves before triggering a drag (allows for clicks)
    // TODO make work for touch
    waitForMotion: {
      start: (e: DragEvent) => {
        if (!this.isTouch(e) && e.button) return; // left clicks only!
        this.waitingToStartDrag = true;
        this.manager().maybeStart(e);
        this.startLoc = this.getEventPosition(e);
        e.stopPropagation();
      },

      move: (e: DragEvent) => {
        if (!this.ref) return;
        if (this.waitingToStartDrag) {
          const loc = this.getEventPosition(e);
          const dx = loc.x - this.startLoc.x;
          const dy = loc.y - this.startLoc.y;
          if (dx * dx + dy * dy > 16) {
            this.manager().start(
              e,
              this.ref,
              this.dragRenderer,
              this.props.monitor,
              this.props.onDrop
            );
            this.waitingToStartDrag = false;
            this.currentlyDragging = true;
          }
        } else {
          // Touch event remain with the object that the touch started on, so for
          // touch events, we have to transmit the motion event up to the manager.
          this.manager().move(e);
        }
      },

      cancel: this.onPointerUp
    },

    // INSTANT STRATEGY: Start dragging immediately
    instant: {
      start: (e: DragEvent) => {
        this.waitingToStartDrag = true;
        this.currentlyDragging = true;
        this.manager().maybeStart(e);
        e.preventDefault();
        e.stopPropagation();
      },

      move: (e: DragEvent) => {
        if (!this.ref) return;
        if (this.waitingToStartDrag) {
          this.waitingToStartDrag = false;

          this.manager().start(
            e,
            this.ref,
            this.dragRenderer,
            this.props.monitor,
            this.props.onDrop
          );
        } else {
          this.manager().move(e);
        }
      },

      cancel: this.onPointerUp
    }
  };

  dragRenderer = () => {
    if (this.props.dragRender) {
      return this.props.dragRender();
    } else {
      return (
        <div style={{ ...this.props.style, ...style.wrapper }} className={this.props.className}>
          {this.props.children}
        </div>
      );
    }
  };

  setRef = (r: HTMLDivElement) => {
    this.ref = r;
    if (!r || !this.props.touchStrategy) return;
    const touchStrategy = this.strategies[this.props.touchStrategy];
    // We have to set touchstart and touchmove event handlers here, because they
    // must be made non-passive in order to preventDefault(); and react is
    // dragging its feet about providing a way to do so.
    (r.addEventListener as any)("touchstart", touchStrategy.start, {
      passive: false
    });
    (r.addEventListener as any)("touchmove", touchStrategy.move, {
      passive: false
    });
    (r.addEventListener as any)("touchcancel", touchStrategy.cancel, {
      passive: false
    });
  };

  render() {
    if (!this.props.mouseStrategy) return;
    if (this.props.disabled) {
      return (
        <div style={{ ...this.props.style, ...style.wrapper }} className={this.props.className}>
          {this.props.children}
        </div>
      );
    }
    const mouseStrategy = this.strategies[this.props.mouseStrategy];

    return (
      <div
        ref={this.setRef}
        onMouseDown={mouseStrategy.start}
        onMouseMove={mouseStrategy.move}
        onMouseUp={this.onPointerUp}
        onTouchEnd={this.onPointerUp}
        style={{ ...this.props.style, ...style.wrapper }}
        className={this.props.className}
      >
        {this.props.children}
      </div>
    );
  }
}

let style: { [klass: string]: React.CSSProperties } = {
  wrapper: {
    userSelect: "none",
    touchCallout: "none",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none"
  } as any
};

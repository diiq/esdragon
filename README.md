# Esdragon: react drag-and-drop with touch and mouse

Esdragon is not as easy to use as many other react d-n-d libraries. You should use esdragon if:

* you need to drag and drop links
* you have users that will drag on mobile, on desktop, and on hybrid devices like the Surface.
* you need to display hundreds of draggable objects simultaneously, performantly.

## Installing

`yarn add esdragon` or `npm install esdragon`.

Esdragon comes with typescript typings; no need to install them separately.

## Usage

Esdragon supplies three react components, `DragContext`, `DragActor`, and `Draggable`. Each component is designed to wrap around your own custom markup. 

### DragContext

A `DragContext` is the container in which all draggable object, and all objects that react to dragging actions, must live. For many apps, there will be only one `DragContext`, but contexts are named, and differently-named contexts can exist side-by-side, or even nested within one another.

### Required Attributes
* `name`: a unique name to distinguish this context from others on the page.

```
<DragContext contextName="myDragContext">
    [... most of your app probably lives here ]
</DragContext>
```

### Optional attributes
DragContexts may also, optionally, declare what DOM object should be scrolled when draggable items are dragged to the edges of the page. By default, the document body will be scrolled.

Scroll containers are declared in the form of a function that returns the container (in case you don't have a reference to the container when the DragContext is being initialized).

```
<DragContext contextName="myDragContext" 
  xScroller={() => document.getElementById("scrolly")} 
  yScroller={() => this.scrollRef}>
    [... most of your app probably lives here ]
</DragContext>
```

## Draggable

`Draggable` is a wrapper that makes a (single) child draggable. A `Draggable` may appear within any descendant of a `DragContext`, even in child components.

### Required Attributes
* `contextName`: The contextName must match the name of an ancestor `DragContext`.
* `monitor`: A monitor is just a plain old javascript object used to track any important but transient information about the object being dragged. The monitor is mutable. The monitor is where you'll store information about how to react to the object (if different draggables require different behaviors) and what to do when the object gets dropped.

```
<Draggable contextName="myDragContext" monitor={{trackingId: "12135"}}>
  <YourComponent />
</Draggable>
```

### Optional attributes
* `onDrop`: The onDrop callback gets called when the object is dropped; and the draggable's monitor object will be passed in as an argument.
* `style`: A style object.
* `touchStrategy`: must be one of "waitForMotion", "waitForTime", and "instant". "waitForMotion" does not start the drag action until the touch point has moved. "waitForTime" does not start the drag action until the touch point has remained static for a period of time longer than `timeThresholdMs`.  "instant" begins the drag action immediately. "waitForTime" is the default touch strategy, to allow users to scroll the page without accidentally triggering drag actions.
* `mouseStrategy`: must be one of "waitForMotion", "waitForTime", and "instant". "waitForMotion" does not start the drag action until the depressed mouse has moved. "waitForTime" does not start the drag action until the depressed mouse has remained static for a period of time longer than `timeThresholdMs`.  "instant" begins the drag action immediately. "instant" is the default mouse strategy.
* `timeThresholdMs`: the delay before starting a drag when the "waitForTime" strategy is used.
* `motionThresholdPx`: the minimum travel before starting a drag when "waitForMotion" strategy is used.
* `dragRender`: a render function to be used while dragging, if the draggable's appearance should be different (or more efficient) while dragging than while not.
* `disabled`: a boolean. Dragging is disabled if `disabled` is true. Default false.


## DragActor

`DragActor` is a component that reacts during drag actions. Anything on the page that you'd like to exhibit a behavior or modify the draggable monitor during drag actions should be wrapped in a DragActor.

### Required Attributes
* `contextName`: The contextName must match the name of an ancestor `DragContext`.
* `id`: A unique name for this actor. This is important so that actors can appear and disappear from the context without being called upon to react any more or less than once. `id` must be *unique~ among actors in the context!

```
<DragActor contextName="myDragContext" id="landing-pad-1">
  <div>Landing Pad</div>
</DragActor>
```

### Optional attributes
* `dragStart`: A function called when any drag action starts. The draggable's monitor object is passed in as an argument.
* `fastUpdate`: a function called on as many animation frames as possible while remaining performant. Receives two arguments: 
  *  a location object, shaped like:
    ```{
      centroid: { // The center of the draggable object
      x: number,
      y: number,
    },
    topLeft: { // the top-left corner of the draggable object
      x: number,
      y: number,
    },
    mouse: { // the location of the touch/cursor/pointer
      x: number,
      y: number
    },
    unscrolled: { // the location ignoring the scrolling context
      x: number,
      y: number
    }
    ```
  * monitor: the draggable's monitor object.

  `fastUpdate` should NOT be used to update React state if you want dragging to remain performant. `fastUpdate` is designed for making GPU-accelerated CSS updates that will complete inside a single animation frame.
* `dragStop`: a function. Takes a monitor and a location (like fastUpdate, but in the opposite order) and is called when a drag action completes.
* style: a style object.
* `setRef`: like `ref`, but with a reference to the DOM object of the actor, rather than the `DragActor` component itself. Useful for getting a client rect for calculating positions and motions relative to the actor during drag actions.

## Example usage

See [my interactive talk](https://github.com/diiq/drag-and-drop-talk) about drag and drop for the web.

See [my Lch color picker](https://palette.sambleckley.com) for a live demo.

See [Vistimo](https://www.vistimo.com) for a rich and complicated use-case.

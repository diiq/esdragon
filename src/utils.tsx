export const vendorPrefix = (function() {
  const styles = window.getComputedStyle(document.documentElement, "");
  const preSlice = Array.prototype.slice
    .call(styles)
    .join("")
    .match(/-(moz|webkit|ms)-/)
  
  if (!preSlice) return ""
  const pre = preSlice[1];

  switch (pre) {
    case "ms":
      return "ms";
    default:
      return pre && pre.length ? pre[0].toUpperCase() + pre.substr(1) : "";
  }
})();

export function fastMove(ref: HTMLElement, loc: { x: number; y: number }) {
  ref.style[`${vendorPrefix}Transform`] = `translate3d(${loc.x}px,${
    loc.y
  }px, 0)`;
}

export interface Scrollable {
  scrollLeft: number;
  scrollTop: number;
  clientHeight: number;
  clientWidth: number;
}

export interface Scroller {
  scroll(loc: { unscrolled: { x: number; y: number } }): void;
  stop(): void;
}

export function perimeterScroller(
  xScrollable: Scrollable,
  yScrollable: Scrollable
): Scroller {
  var autoscrollInterval: number | null = null;
  function stop() {
    if (autoscrollInterval) {
      clearInterval(autoscrollInterval as number);
      autoscrollInterval = -1;
    }
    return;
  }

  return {
    // TODO rewrite this to look more like Timeline scroller
    scroll(loc: { unscrolled: { x: number; y: number } }) {
      // Safety valve; if things go borken, we don't want the page stuck in
      // permascroll hell.
      // This is probably hiding a bug on mobile.
      setTimeout(stop, 1000);

      const acceleration = 0.175;
      const scrollArea = 100;
      const x = loc.unscrolled.x;
      const y = loc.unscrolled.y;
      function speedGivenLocation(distanceFromEdge: number) {
        if (distanceFromEdge < scrollArea) {
          return (scrollArea - distanceFromEdge) * acceleration;
        }
        return 0;
      }

      const dy =
        speedGivenLocation(yScrollable.clientHeight - y) ||
        -speedGivenLocation(y);
      const dx =
        speedGivenLocation(xScrollable.clientWidth - x) ||
        -speedGivenLocation(x);

      if (autoscrollInterval) {
        clearInterval(autoscrollInterval as number);
        autoscrollInterval = null;
      }

      if (!isNaN(dx) || !isNaN(dy)) {
        autoscrollInterval = setInterval(() => {
          if (!isNaN(dx)) xScrollable.scrollLeft += dx;
          if (!isNaN(dy)) yScrollable.scrollTop += dy;
        }, 5);
      }
    },

    stop: stop
  };
}

// When you gotta do something expensive while at the same time maintaining high
// framerate, just do as much as you can each frame and continue next time.
export function framerateLoop<T>(items: T[], fn: (o: T) => void) {
  var i = 0;
  var ret = { done: false };
  const loop = () => {
    var startTime = Date.now();
    while (i < items.length && Date.now() - startTime < 32) {
      fn(items[i]);
      i++;
    }
    if (i < items.length) {
      requestAnimationFrame(loop);
    } else {
      ret.done = true;
    }
  };
  requestAnimationFrame(loop);
  return ret;
}

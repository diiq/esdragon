define(["require", "exports"], function (require, exports) {
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
//# sourceMappingURL=utils.js.map
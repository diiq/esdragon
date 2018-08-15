export declare const vendorPrefix: any;
export declare function fastMove(ref: HTMLElement, loc: {
    x: number;
    y: number;
}): void;
export interface Scrollable {
    scrollLeft: number;
    scrollTop: number;
    clientHeight: number;
    clientWidth: number;
}
export interface Scroller {
    scroll(loc: {
        unscrolled: {
            x: number;
            y: number;
        };
    }): void;
    stop(): void;
}
export declare function perimeterScroller(xScrollable: Scrollable, yScrollable: Scrollable): Scroller;
export declare function framerateLoop<T>(items: T[], fn: (o: T) => void): {
    done: boolean;
};

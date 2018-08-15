import * as React from 'react';
export interface DragContextProps {
    contextName: string;
    xScroller?: () => Element;
    yScroller?: () => Element;
    style?: any;
}
export interface DragLocation {
    centroid: {
        x: number;
        y: number;
    };
    topLeft: {
        x: number;
        y: number;
    };
    mouse: {
        x: number;
        y: number;
    };
    unscrolled: {
        x: number;
        y: number;
    };
}
export interface Actor {
    dragStart?: (monitor: any) => void;
    fastUpdate?: (location: DragLocation, monitor: any) => void;
    dragStop?: (monitor: any) => void;
}
export interface DragManager {
    addActor(id: string, props: Actor): void;
    maybeStart(e: DragEvent): void;
    cancelStart(): void;
    start(e: DragEvent, ref: HTMLDivElement, render: () => JSX.Element, monitor: any, onDrop?: (monitor: any) => void): void;
    move(e: DragEvent): void;
    drop(e: DragEvent): void;
    removeActor(id: string, props: Actor): void;
}
export declare type DragEvent = React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | TouchEvent | MouseEvent;
export declare class DragContext extends React.Component<DragContextProps, {}> {
    static childContextTypes: {
        dragManagers: React.Requireable<object>;
    };
    static contextTypes: {
        dragManagers: React.Requireable<object>;
    };
    static defaultProps: {
        xScroller: () => HTMLElement;
        yScroller: () => HTMLElement;
    };
    state: {
        dragee?: () => JSX.Element;
        maybeStarting?: boolean;
    };
    manager: DragManager | null;
    actors: {
        [key: string]: Actor;
    };
    dragee: HTMLDivElement | null;
    hiddenDragee: HTMLDivElement | null;
    pointerOffset: {
        x: number;
        y: number;
    };
    oldDisplay: string | null;
    monitor: any;
    dragStart: {
        done: boolean;
    };
    onDrop: ((m: any) => void) | null;
    handlePreventTouchmoveWhenPanning: (event: any) => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    otherManagers(): any;
    getChildContext(): {
        dragManagers: any;
    };
    componentDidUpdate(): void;
    addActor: (id: string, props: Actor) => void;
    removeActor: (id: string, actor: Actor) => void;
    maybeStart: (e: DragEvent) => void;
    cancelStart: () => void;
    start: (e: DragEvent, ref: HTMLDivElement, dragRenderer: () => JSX.Element, monitor: any, onDrop: (m: any) => void) => void;
    move: (e: DragEvent) => void;
    drop: (e: DragEvent) => void;
    actorsDo(action: string, args: any[]): void;
    actActors(e: DragEvent): void;
    actorsArray(): Actor[];
    richPosition(e: DragEvent): {
        centroid: {
            x: number;
            y: number;
        };
        topLeft: {
            x: number;
            y: number;
        };
        mouse: {
            x: number;
            y: number;
        };
        unscrolled: {
            x: number;
            y: number;
        };
    } | undefined;
    isTouch(e: DragEvent): e is React.TouchEvent<any> | TouchEvent;
    previousPos: {
        x: number;
        y: number;
    };
    getEventPosition(e: DragEvent): {
        x: number;
        y: number;
    };
    setDrageePosition(e: DragEvent): void;
    setDrageeOffset(e: DragEvent, ref: HTMLDivElement): void;
    setDragee: (r: HTMLDivElement) => void;
    render(): JSX.Element;
}

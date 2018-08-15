import * as React from 'react';
import { DragManager, DragEvent } from './drag-context';
export interface DraggableProps {
    contextName: string;
    monitor: any;
    style?: {};
    touchStrategy: "waitForMotion" | "waitForTime" | "instant";
    mouseStrategy: "waitForMotion" | "waitForTime" | "instant";
    timeThresholdMs?: number;
    motionThresholdPx?: number;
    dragRender?: () => JSX.Element;
    onDrop?: (monitor: any) => void;
    disabled?: boolean;
}
export declare class Draggable extends React.Component<DraggableProps, {}> {
    static contextTypes: {
        dragManagers: React.Requireable<object>;
    };
    ref: HTMLDivElement | null;
    waitingToStartDrag: boolean;
    currentlyDragging: boolean;
    startLoc: {
        x: number;
        y: number;
    };
    manager(): DragManager;
    isTouch(e: DragEvent): e is React.TouchEvent<any> | TouchEvent;
    previousPos: {
        x: number;
        y: number;
    };
    getEventPosition(e: DragEvent): {
        x: number;
        y: number;
    };
    persistableEvent(e: DragEvent): e is React.TouchEvent<any> | React.MouseEvent<any>;
    onPointerUp: (e: DragEvent) => void;
    strategies: {
        waitForTime: {
            start: (e: DragEvent) => void;
            move: (e: DragEvent) => void;
            cancel: (e: DragEvent) => void;
        };
        waitForMotion: {
            start: (e: DragEvent) => void;
            move: (e: DragEvent) => void;
            cancel: (e: DragEvent) => void;
        };
        instant: {
            start: (e: DragEvent) => void;
            move: (e: DragEvent) => void;
            cancel: (e: DragEvent) => void;
        };
    };
    dragRenderer: () => JSX.Element;
    setRef: (r: HTMLDivElement) => void;
    render(): JSX.Element;
}

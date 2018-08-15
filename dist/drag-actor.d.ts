import * as React from 'react';
import { DragManager, DragLocation, Actor } from './drag-context';
export interface DragActorProps {
    contextName: string;
    id: any;
    fastUpdate?: (location: DragLocation, monitor: any) => void;
    dragStop?: (monitor?: any, position?: DragLocation) => void;
    dragStart?: (monitor: any) => void;
    style?: any;
    setRef?: (ref: HTMLDivElement) => void;
}
export declare class DragActor extends React.Component<DragActorProps, {}> {
    static contextTypes: {
        dragManagers: React.Requireable<object>;
    };
    actor: Actor | null;
    manager(): DragManager;
    componentDidMount(): void;
    componentWillReceiveProps(props: DragActorProps): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}

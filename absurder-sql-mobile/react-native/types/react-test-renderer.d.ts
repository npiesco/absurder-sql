// Type declarations for react-test-renderer
declare module 'react-test-renderer' {
  import { ReactElement } from 'react';
  
  interface ReactTestRenderer {
    toJSON(): any;
    toTree(): any;
    unmount(): void;
    update(element: ReactElement): void;
    root: ReactTestInstance;
  }

  interface ReactTestInstance {
    instance: any;
    type: string | Function;
    props: { [key: string]: any };
    parent: ReactTestInstance | null;
    children: Array<ReactTestInstance | string>;
    find(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance;
    findAll(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance[];
    findByType(type: Function | string): ReactTestInstance;
    findAllByType(type: Function | string): ReactTestInstance[];
    findByProps(props: { [key: string]: any }): ReactTestInstance;
    findAllByProps(props: { [key: string]: any }): ReactTestInstance[];
  }

  function create(element: ReactElement): ReactTestRenderer;
  function act(callback: () => void | Promise<void>): Promise<void>;

  const ReactTestRenderer: {
    create: typeof create;
    act: typeof act;
  };
  export default ReactTestRenderer;
  export { create, act, ReactTestRenderer, ReactTestInstance };
}

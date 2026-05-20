declare module "react-dom/client" {
  import type { ReactNode } from "react";

  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export interface RootOptions {
    identifierPrefix?: string;
    onCaughtError?: (error: unknown, errorInfo: { componentStack?: string }) => void;
    onRecoverableError?: (error: unknown, errorInfo: { componentStack?: string }) => void;
    onUncaughtError?: (error: unknown, errorInfo: { componentStack?: string }) => void;
  }

  export function createRoot(container: Element | DocumentFragment, options?: RootOptions): Root;
  export function hydrateRoot(
    container: Element | DocumentFragment,
    initialChildren: ReactNode,
    options?: RootOptions,
  ): Root;
}

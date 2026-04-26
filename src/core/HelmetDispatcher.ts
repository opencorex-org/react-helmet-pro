import { syncHelmetState } from "./HelmetManager";
import { buildServerState, createEmptyState, normalizeHelmetProps, reduceHelmetInstances } from "./helmetState";
import { getCanUseDOM } from "./runtime";

import type { HelmetDescriptor, HelmetInstance, HelmetProps, HelmetServerContext, HelmetServerState, HelmetState } from "../types";

const MANUAL_INSTANCE_ID = "__react_helmet_pro_manual__";

const isDescriptorEmpty = (descriptor: HelmetDescriptor) =>
  !descriptor.title &&
  !descriptor.defaultTitle &&
  !descriptor.titleTemplate &&
  !descriptor.base.length &&
  !descriptor.meta.length &&
  !descriptor.link.length &&
  !descriptor.script.length &&
  !descriptor.style.length &&
  !descriptor.noscript.length &&
  !Object.keys(descriptor.htmlAttributes).length &&
  !Object.keys(descriptor.bodyAttributes).length &&
  !Object.keys(descriptor.titleAttributes).length;

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(",")}}`;
};

const callbacksChanged = (
  previousCallbacks: Array<HelmetDescriptor["onChangeClientState"]>,
  nextCallbacks: Array<HelmetDescriptor["onChangeClientState"]>,
) =>
  previousCallbacks.length !== nextCallbacks.length ||
  previousCallbacks.some((callback, index) => callback !== nextCallbacks[index]);

export class HelmetDispatcher {
  private callbacks: Array<HelmetDescriptor["onChangeClientState"]> = [];
  private currentState: HelmetState = createEmptyState();
  private frameId: number | null = null;
  private instances = new Map<string, HelmetInstance>();
  private lastAppliedState: HelmetState = createEmptyState();
  private listeners = new Set<() => void>();
  private order = 0;

  constructor(
    private readonly options: {
      context?: HelmetServerContext;
      manageDom?: boolean;
    } = {},
  ) {
    if (this.options.context) {
      this.options.context.helmet = buildServerState(this.currentState);
    }
  }

  allocateOrder() {
    this.order += 1;
    return this.order;
  }

  getState() {
    return this.currentState;
  }

  peek(): HelmetServerState {
    return buildServerState(this.currentState);
  }

  remove(id: string) {
    if (!this.instances.delete(id)) {
      return;
    }

    this.updateState();
  }

  rewind(): HelmetServerState {
    const snapshot = this.peek();
    this.instances.clear();
    this.updateState();
    return snapshot;
  }

  setHead(data: Partial<HelmetProps>) {
    const descriptor = normalizeHelmetProps(data);

    if (isDescriptorEmpty(descriptor)) {
      this.remove(MANUAL_INSTANCE_ID);
      return;
    }

    this.upsert(MANUAL_INSTANCE_ID, descriptor, -1);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  upsert(id: string, data: HelmetDescriptor, order: number) {
    this.instances.set(id, { data, order });
    this.updateState();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  private scheduleDomCommit() {
    if (!this.options.manageDom || !getCanUseDOM()) {
      return;
    }

    if (this.frameId !== null && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    const commit = () => {
      const { addedTags, removedTags } = syncHelmetState(this.lastAppliedState, this.currentState);
      this.lastAppliedState = this.currentState;
      this.frameId = null;

      this.callbacks.forEach((callback) => {
        callback?.(this.currentState, addedTags, removedTags);
      });
    };

    if (
      this.currentState.defer !== false &&
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
    ) {
      this.frameId = window.requestAnimationFrame(commit);
      return;
    }

    commit();
  }

  private updateState() {
    const previousState = this.currentState;
    const reduced = reduceHelmetInstances(this.instances.values());
    const stateChanged = stableStringify(previousState) !== stableStringify(reduced.state);
    const nextCallbacks = reduced.callbacks;
    const didCallbacksChange = callbacksChanged(this.callbacks, nextCallbacks);

    this.currentState = reduced.state;
    this.callbacks = nextCallbacks;

    if (!stateChanged && !didCallbacksChange) {
      return;
    }

    if (this.options.context) {
      this.options.context.helmet = buildServerState(this.currentState);
    }

    if (stateChanged) {
      this.scheduleDomCommit();
      this.notifyListeners();
    }
  }
}

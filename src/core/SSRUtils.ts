import { Helmet } from "../components/Helmet";
import { HelmetData } from "./HelmetData";

import type { HelmetServerContext, HelmetServerState } from "../types";

const isServerContext = (
  value: HelmetData | HelmetServerContext | HelmetServerState,
): value is HelmetServerContext => "helmet" in value;

const resolveServerState = (
  value?: HelmetData | HelmetServerContext | HelmetServerState,
): HelmetServerState => {
  if (!value) {
    return Helmet.peek();
  }

  if (value instanceof HelmetData) {
    return value.context.helmet ?? value.dispatcher.peek();
  }

  if (isServerContext(value)) {
    return value.helmet ?? Helmet.peek();
  }

  return value as HelmetServerState;
};

export const collectHelmetTags = (
  value?: HelmetData | HelmetServerContext | HelmetServerState,
) => resolveServerState(value);

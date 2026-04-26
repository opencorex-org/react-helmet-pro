import { HelmetDispatcher } from "./HelmetDispatcher";
import { getCanUseDOM } from "./runtime";

import type { HelmetServerContext } from "../types";

export class HelmetData {
  context: HelmetServerContext;
  dispatcher: HelmetDispatcher;

  constructor(context: HelmetServerContext = {}) {
    this.context = context;
    this.dispatcher = new HelmetDispatcher({
      context,
      manageDom: getCanUseDOM(),
    });
  }
}

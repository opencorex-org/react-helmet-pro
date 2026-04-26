"use client";

import React, { useEffect, useMemo, useState } from "react";

import { HelmetDispatcher } from "../core/HelmetDispatcher";
import { getCanUseDOM, setCanUseDOM } from "../core/runtime";
import { HelmetContext } from "./HelmetContext";

import type { HelmetProviderProps } from "../types";

type HelmetProviderComponent = React.FC<HelmetProviderProps> & {
  canUseDOM: boolean;
};

const HelmetProviderBase: React.FC<HelmetProviderProps> = ({ children, context }) => {
  const dispatcher = useMemo(
    () =>
      new HelmetDispatcher({
        context,
        manageDom: getCanUseDOM(),
      }),
    [context],
  );
  const [state, setState] = useState(() => dispatcher.getState());

  useEffect(() => {
    setState(dispatcher.getState());
    return dispatcher.subscribe(() => {
      setState(dispatcher.getState());
    });
  }, [dispatcher]);

  const value = useMemo(
    () => ({
      ...state,
      dispatcher,
      setHead: dispatcher.setHead.bind(dispatcher),
    }),
    [dispatcher, state],
  );

  return <HelmetContext.Provider value={value}>{children}</HelmetContext.Provider>;
};

export const HelmetProvider = HelmetProviderBase as HelmetProviderComponent;

Object.defineProperty(HelmetProvider, "canUseDOM", {
  get: getCanUseDOM,
  set: setCanUseDOM,
});

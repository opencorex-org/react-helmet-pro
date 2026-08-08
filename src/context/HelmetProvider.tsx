"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";

import { HelmetDispatcher } from "../core/HelmetDispatcher";
import { getCanUseDOM, setCanUseDOM } from "../core/runtime";
import { mergeSeoDefaults } from "../utils/seoDefaults";
import { HelmetContext } from "./HelmetContext";

import type { HelmetProviderProps } from "../types";

type HelmetProviderComponent = React.FC<HelmetProviderProps> & {
  canUseDOM: boolean;
};

const HelmetProviderBase: React.FC<HelmetProviderProps> = ({
  auditOptions,
  children,
  context,
  defaults,
  enableDevDiagnostics,
  onError,
}) => {
  const parentContext = useContext(HelmetContext);

  const mergedDefaults = useMemo(
    () => mergeSeoDefaults(parentContext?.defaults, defaults),
    [parentContext?.defaults, defaults],
  );

  const dispatcher = useMemo(() => {
    if (parentContext?.dispatcher && !context) {
      return parentContext.dispatcher as HelmetDispatcher;
    }

    return new HelmetDispatcher({
      auditOptions,
      context,
      enableDevDiagnostics,
      manageDom: getCanUseDOM(),
      onError,
    });
  }, [auditOptions, context, enableDevDiagnostics, parentContext?.dispatcher, onError]);

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
      defaults: mergedDefaults,
      dispatcher,
      setHead: dispatcher.setHead.bind(dispatcher),
    }),
    [dispatcher, mergedDefaults, state],
  );

  return <HelmetContext.Provider value={value}>{children}</HelmetContext.Provider>;
};

export const HelmetProvider = HelmetProviderBase as HelmetProviderComponent;

Object.defineProperty(HelmetProvider, "canUseDOM", {
  get: getCanUseDOM,
  set: setCanUseDOM,
});

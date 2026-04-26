"use client";

import { DependencyList, useEffect } from "react";

import { useHelmet } from "./useHelmet";

export const useHelmetMiddleware = (
  middleware: (head: ReturnType<typeof useHelmet>) => Record<string, unknown> | void,
  deps: DependencyList = [],
) => {
  const helmet = useHelmet();

  useEffect(() => {
    const nextState = middleware?.(helmet);

    if (nextState && typeof nextState === "object") {
      helmet.setHead(nextState);
    }
  }, [helmet, middleware, ...deps]);
};

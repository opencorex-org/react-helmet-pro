"use client";

import React, { useMemo, useState } from "react";

import { HelmetContext } from "./HelmetContext";
import { HelmetData } from "../types";

export const HelmetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [head, setHead] = useState<HelmetData>({});
  const contextValue = useMemo(
    () => ({ setHead, title: head.title, meta: head.meta, link: head.link }),
    [setHead, head.title, head.meta, head.link]
  );
  return (
    <HelmetContext.Provider value={contextValue}>
      {children}
    </HelmetContext.Provider>
  );
};

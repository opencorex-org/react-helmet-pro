import { useContext } from "react";

import { HelmetContext } from "../context/HelmetContext";

export const useHelmet = () => {
  const context = useContext(HelmetContext);

  if (!context) {
    throw new Error("useHelmet must be used within a HelmetProvider");
  }

  return context;
};

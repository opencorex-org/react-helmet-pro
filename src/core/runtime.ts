let canUseDOM =
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof document.createElement === "function";

export const getCanUseDOM = () => canUseDOM;

export const setCanUseDOM = (value: boolean) => {
  canUseDOM = value;
};

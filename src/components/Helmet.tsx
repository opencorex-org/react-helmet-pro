"use client";

import React, { useContext, useEffect, useRef } from "react";

import { HelmetData } from "../core/HelmetData";
import { HelmetDispatcher } from "../core/HelmetDispatcher";
import { normalizeHelmetProps } from "../core/helmetState";
import { getCanUseDOM } from "../core/runtime";
import { HelmetContext } from "../context/HelmetContext";

import type { HelmetProps, HelmetServerState } from "../types";

type HelmetComponent = React.FC<HelmetProps> & {
  peek: () => HelmetServerState;
  renderStatic: () => HelmetServerState;
  rewind: () => HelmetServerState;
};

const globalHelmetData = new HelmetData({});

let helmetInstanceCounter = 0;

const nextHelmetInstanceId = () => {
  helmetInstanceCounter += 1;
  return `react-helmet-pro-${helmetInstanceCounter}`;
};

const resolveDispatcher = (
  contextDispatcher: unknown,
  explicitHelmetData?: HelmetProps["helmetData"],
) => {
  if (explicitHelmetData?.dispatcher instanceof HelmetDispatcher) {
    return explicitHelmetData.dispatcher;
  }

  if (contextDispatcher instanceof HelmetDispatcher) {
    return contextDispatcher;
  }

  return globalHelmetData.dispatcher;
};

const descriptorToProps = (descriptor: ReturnType<typeof normalizeHelmetProps>): Partial<HelmetProps> => ({
  base: descriptor.base[0],
  bodyAttributes: descriptor.bodyAttributes,
  defaultTitle: descriptor.defaultTitle,
  defer: descriptor.defer,
  encodeSpecialCharacters: descriptor.encodeSpecialCharacters,
  htmlAttributes: descriptor.htmlAttributes,
  link: descriptor.link,
  meta: descriptor.meta,
  noscript: descriptor.noscript,
  onChangeClientState: descriptor.onChangeClientState,
  prioritizeSeoTags: descriptor.prioritizeSeoTags,
  script: descriptor.script,
  style: descriptor.style,
  title: descriptor.title,
  titleAttributes: descriptor.titleAttributes,
  titleTemplate: descriptor.titleTemplate,
});

const HelmetBase: React.FC<HelmetProps> = (props) => {
  const context = useContext(HelmetContext);
  const dispatcher = resolveDispatcher(context?.dispatcher, props.helmetData);
  const idRef = useRef("");
  const orderRef = useRef<number | null>(null);
  const dispatcherRef = useRef(dispatcher);

  if (!idRef.current) {
    idRef.current = nextHelmetInstanceId();
  }

  if (dispatcherRef.current !== dispatcher) {
    dispatcherRef.current = dispatcher;
    orderRef.current = null;
  }

  if (orderRef.current === null) {
    orderRef.current = dispatcher.allocateOrder();
  }

  const descriptor = normalizeHelmetProps(props);

  if (!getCanUseDOM()) {
    dispatcher.upsert(idRef.current, descriptor, orderRef.current);
  }

  useEffect(() => {
    dispatcher.upsert(idRef.current, descriptor, orderRef.current ?? 0);
  });

  useEffect(() => {
    if (context && !(context.dispatcher instanceof HelmetDispatcher)) {
      context.setHead(descriptorToProps(descriptor));
    }
  });

  useEffect(
    () => () => {
      dispatcher.remove(idRef.current);
    },
    [dispatcher],
  );

  return null;
};

export const Helmet = HelmetBase as HelmetComponent;

Helmet.peek = () => globalHelmetData.dispatcher.peek();
Helmet.renderStatic = () => globalHelmetData.dispatcher.rewind();
Helmet.rewind = () => globalHelmetData.dispatcher.rewind();

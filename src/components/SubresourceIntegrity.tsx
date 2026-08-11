"use client";

import React from "react";

import type {
  ExternalScriptProps,
  ExternalStylesheetProps,
} from "../types/subresourceIntegrity";
import {
  buildExternalScript,
  buildExternalStylesheet,
} from "../utils/subresourceIntegrity";
import { Helmet } from "./Helmet";

export const ExternalScript: React.FC<ExternalScriptProps> = (props) => (
  <Helmet script={[buildExternalScript(props)]} />
);

export const ExternalStylesheet: React.FC<ExternalStylesheetProps> = (props) => (
  <Helmet link={[buildExternalStylesheet(props)]} />
);

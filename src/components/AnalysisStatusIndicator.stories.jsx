import React from "react";
import AnalysisStatusIndicator from "./AnalysisStatusIndicator.jsx";

export default {
  title: "Components/AnalysisStatusIndicator",
  component: AnalysisStatusIndicator,
};

export const OK = () => <AnalysisStatusIndicator status="OK" />;
export const NOK = () => <AnalysisStatusIndicator status="NOK" />;
export const PartialOK = () => <AnalysisStatusIndicator status="PARTIAL_OK" />;

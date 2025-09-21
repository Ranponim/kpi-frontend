import React from "react";
import { render, screen } from "@testing-library/react";
import AnalysisStatusIndicator from "./AnalysisStatusIndicator.jsx";

describe("AnalysisStatusIndicator", () => {
  it("renders OK status with green styling cues", () => {
    render(<AnalysisStatusIndicator status="OK" />);
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("renders NOK status with destructive variant", () => {
    render(<AnalysisStatusIndicator status="NOK" />);
    expect(screen.getByText("NOK")).toBeInTheDocument();
  });

  it("renders PARTIAL_OK status label", () => {
    render(<AnalysisStatusIndicator status="PARTIAL_OK" />);
    expect(screen.getByText(/Partial/i)).toBeInTheDocument();
  });
});

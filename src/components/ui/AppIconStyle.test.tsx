import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppIconStyleProvider, useAppIconWeight } from "./AppIconStyle";

function WeightProbe({ active = false }: { active?: boolean }) {
  return (
    <output aria-label={active ? "active" : "inactive"}>
      {useAppIconWeight(active)}
    </output>
  );
}

describe("AppIconStyle", () => {
  it("maps appearance preferences to consistent Phosphor weights", () => {
    const { rerender } = render(
      <AppIconStyleProvider style="outline">
        <WeightProbe />
        <WeightProbe active />
      </AppIconStyleProvider>,
    );

    expect(screen.getByLabelText("inactive")).toHaveTextContent("regular");
    expect(screen.getByLabelText("active")).toHaveTextContent("fill");

    rerender(
      <AppIconStyleProvider style="solid">
        <WeightProbe />
        <WeightProbe active />
      </AppIconStyleProvider>,
    );

    expect(screen.getByLabelText("inactive")).toHaveTextContent("bold");
    expect(screen.getByLabelText("active")).toHaveTextContent("fill");
  });
});

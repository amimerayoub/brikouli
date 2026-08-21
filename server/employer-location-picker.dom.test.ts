import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

const mutate = vi.fn();
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: any) => React.createElement("button", { type: "button", "aria-label": "خريطة اختيار موقع الفرصة", onClick: () => onClick({ lngLat: { lat: 33.58, lng: -7.61 } }) }, children),
  Marker: ({ children }: any) => React.createElement("span", { "data-testid": "draggable-marker" }, children),
  NavigationControl: () => React.createElement("span"),
}));
vi.mock("../client/src/lib/trpc", () => ({ trpc: { brikouli: { locations: { search: { useMutation: () => ({ mutate, isError: false, data: { success: true, data: [{ label: "المعاريف، الدار البيضاء", latitude: 33.57, longitude: -7.59 }] } }) } } } } }));
vi.mock("../client/src/lib/map/geolocation", () => ({ requestUserLocation: async () => ({ status: "ready", coordinates: { latitude: 33.56, longitude: -7.58 }, message: null }) }));

const { EmployerLocationPicker } = await import("../client/src/components/employer/EmployerLocationPicker");
afterEach(() => { cleanup(); mutate.mockReset(); });

it("supports explicit Arabic search, a location suggestion, current location, and map selection", async () => {
  const user = userEvent.setup(); const onChange = vi.fn(); const onLocationLabel = vi.fn();
  render(React.createElement(EmployerLocationPicker, { value: { latitude: 33.5731, longitude: -7.5898 }, onChange, onLocationLabel }));
  const input = screen.getByLabelText("ابحث عن موقع"); await user.type(input, "المعاريف"); await user.click(screen.getByRole("button", { name: "بحث عن موقع" }));
  expect(mutate).toHaveBeenCalledWith({ query: "المعاريف" });
  await user.click(screen.getByRole("option", { name: /المعاريف/ }));
  expect(onChange).toHaveBeenCalledWith({ latitude: 33.57, longitude: -7.59 }); expect(onLocationLabel).toHaveBeenCalledWith("المعاريف، الدار البيضاء");
  await user.click(screen.getByRole("button", { name: /استخدام موقعي الحالي/ })); expect(onChange).toHaveBeenCalledWith({ latitude: 33.56, longitude: -7.58 });
  fireEvent.click(screen.getByRole("button", { name: "خريطة اختيار موقع الفرصة" })); expect(onChange).toHaveBeenCalledWith({ latitude: 33.58, longitude: -7.61 });
  expect(screen.getByTestId("draggable-marker")).toBeTruthy();
});

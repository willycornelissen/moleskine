import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandIcon } from "@/components/BrandIcon";

describe("BrandIcon", () => {
  it("should render the Moleskine icon image with default sm size", () => {
    const { container } = render(<BrandIcon />);
    const img = screen.getByAltText("Ícone do Moleskine");

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/icon-192.png");
    expect(container.firstChild).toHaveClass("w-9", "h-9", "rounded-lg");
  });

  it("should support lg size and custom className", () => {
    const { container } = render(<BrandIcon size="lg" className="mb-5" />);

    expect(container.firstChild).toHaveClass("w-14", "h-14", "rounded-2xl", "mb-5");
  });
});

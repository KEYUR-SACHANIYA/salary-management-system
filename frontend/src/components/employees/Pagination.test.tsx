import { render, screen } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("links to the next server-side page while keeping filters", () => {
    render(
      <Pagination
        query={{ page: 2, search: "aarav", country: "Germany", pageSize: 20 }}
        page={2}
        pageSize={20}
        total={10000}
      />,
    );

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/employees?search=aarav&country=Germany",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/employees?search=aarav&country=Germany&page=3",
    );
    expect(screen.getByText(/Showing 21–40 of 10,000 employees/)).toBeInTheDocument();
  });

  it("disables previous on the first page", () => {
    render(
      <Pagination
        query={{ page: 1, pageSize: 20 }}
        page={1}
        pageSize={20}
        total={20}
      />,
    );

    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });
});

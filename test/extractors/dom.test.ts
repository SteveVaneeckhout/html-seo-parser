import { describe, it, expect } from "vitest";
import { load } from "cheerio";
import { textContent } from "../../src/extractors/dom.js";

describe("textContent", () => {
  it("returns the same text as cheerio's .text()", () => {
    const $ = load(`
      <div id="t">Hello <b>bold <i>and italic</i></b><!-- not this --> world
        <script>var s = 1;</script><style>p{}</style><br>tail</div>
    `);
    const el = $("#t")[0]!;
    expect(textContent(el)).toBe($("#t").text());
  });

  it("returns the data of a text node", () => {
    const $ = load("<p>just text</p>");
    expect(textContent($("p")[0]!.children[0]!)).toBe("just text");
  });

  it("returns an empty string for a comment", () => {
    const $ = load("<p><!-- c --></p>");
    expect(textContent($("p")[0]!.children[0]!)).toBe("");
  });

  it("handles markup nested deeper than the call stack allows", () => {
    // xml mode builds the deep tree in linear time; the HTML parser is quadratic in depth.
    const depth = 50_000;
    const $ = load("<a>".repeat(depth) + "deep" + "</a>".repeat(depth), { xml: true });
    expect(textContent($.root()[0]!)).toBe("deep");
  });
});

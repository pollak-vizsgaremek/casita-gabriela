import { normalizeImagesFromDb, parseId } from "../utils.js";

describe("utils", () => {
  test("parseId returns integer for valid positive id", () => {
    expect(parseId("12")).toBe(12);
  });

  test("parseId returns null for invalid values", () => {
    expect(parseId("0")).toBeNull();
    expect(parseId("-1")).toBeNull();
    expect(parseId("2.5")).toBeNull();
    expect(parseId("abc")).toBeNull();
  });

  test("normalizeImagesFromDb parses JSON array string", () => {
    const input = JSON.stringify(["/a.jpg", "/b.jpg"]);
    expect(normalizeImagesFromDb(input)).toEqual(["/a.jpg", "/b.jpg"]);
  });

  test("normalizeImagesFromDb wraps plain string as single-item array", () => {
    expect(normalizeImagesFromDb("/single.jpg")).toEqual(["/single.jpg"]);
  });

  test("normalizeImagesFromDb converts Buffer to base64 data url", () => {
    const buf = Buffer.from("test");
    const out = normalizeImagesFromDb(buf);
    expect(Array.isArray(out)).toBe(true);
    expect(out[0]).toMatch(/^data:image\/jpeg;base64,/);
  });

  test("normalizeImagesFromDb returns original array when input is already array", () => {
    const arr = ["/x.jpg", "/y.jpg"];
    expect(normalizeImagesFromDb(arr)).toEqual(arr);
  });

  test("normalizeImagesFromDb returns empty array for empty or unsupported input", () => {
    expect(normalizeImagesFromDb(null)).toEqual([]);
    expect(normalizeImagesFromDb(undefined)).toEqual([]);
    expect(normalizeImagesFromDb({ foo: "bar" })).toEqual([]);
  });
});

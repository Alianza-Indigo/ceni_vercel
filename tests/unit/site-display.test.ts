import { describe, expect, it } from "vitest";
import {
  ORG_SCOPE_LABEL,
  scopeDisplayName,
  scopeLabel,
  scopeLocation,
} from "@/lib/site-display";

const org = {
  tradeName: "Café Luz Cívica",
  city: "Ciudad de México",
  state: "Ciudad de México",
  latitude: 19.432,
  longitude: -99.133,
};

const primary = {
  name: "Sede principal",
  city: "Ciudad de México",
  state: "Ciudad de México",
  isPrimary: true,
  latitude: 19.432,
  longitude: -99.133,
};

const branch = {
  name: "Sucursal Roma",
  city: "Ciudad de México",
  state: "Ciudad de México",
  isPrimary: false,
  latitude: 19.417,
  longitude: -99.16,
};

describe("scopeDisplayName", () => {
  it("primary site shows the plain trade name", () => {
    expect(scopeDisplayName(org, primary)).toBe("Café Luz Cívica");
  });

  it("branches append the site name", () => {
    expect(scopeDisplayName(org, branch)).toBe("Café Luz Cívica · Sucursal Roma");
  });

  it("organization scope shows the plain trade name", () => {
    expect(scopeDisplayName(org, null)).toBe("Café Luz Cívica");
  });
});

describe("scopeLabel", () => {
  it("names the site, or the whole organization when siteId is null", () => {
    expect(scopeLabel(branch)).toBe("Sucursal Roma");
    expect(scopeLabel(null)).toBe(ORG_SCOPE_LABEL);
  });
});

describe("scopeLocation", () => {
  it("uses site coordinates when present", () => {
    expect(scopeLocation(org, branch)).toEqual({
      city: "Ciudad de México",
      state: "Ciudad de México",
      latitude: 19.417,
      longitude: -99.16,
    });
  });

  it("falls back to organization coordinates for org scope or missing coords", () => {
    expect(scopeLocation(org, null).latitude).toBe(19.432);
    expect(
      scopeLocation(org, { ...branch, latitude: null, longitude: null }).latitude,
    ).toBe(19.432);
  });
});

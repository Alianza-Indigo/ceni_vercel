/**
 * Public presentation of a certification scope.
 * - Site-scoped: primary sites show the plain trade name; branches append the
 *   site name so each certified location is distinguishable.
 * - Organization-scoped (siteId null, LABORAL only): the trade name with an
 *   explicit "whole organization" scope label.
 */

export interface SiteView {
  name: string;
  city: string;
  state: string;
  isPrimary: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface OrgView {
  tradeName: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

export const ORG_SCOPE_LABEL = "Toda la organización";

export function scopeDisplayName(org: OrgView, site: SiteView | null): string {
  if (!site || site.isPrimary) return org.tradeName;
  return `${org.tradeName} · ${site.name}`;
}

export function scopeLabel(site: SiteView | null): string {
  if (!site) return ORG_SCOPE_LABEL;
  return site.name;
}

export function scopeLocation(org: OrgView, site: SiteView | null): {
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
} {
  if (!site) {
    return {
      city: org.city,
      state: org.state,
      latitude: org.latitude,
      longitude: org.longitude,
    };
  }
  return {
    city: site.city,
    state: site.state,
    latitude: site.latitude ?? org.latitude,
    longitude: site.longitude ?? org.longitude,
  };
}

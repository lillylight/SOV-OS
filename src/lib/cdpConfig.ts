import type { Config, Theme } from "@coinbase/cdp-react";

export const cdpConfig: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "8d885400-2c82-473e-b9d0-bf5c580a9a5f",
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "Sovereign OS",
  appLogoUrl: "",
  authMethods: ["email","sms","oauth:x","oauth:google","oauth:apple","oauth:telegram"],
  showCoinbaseFooter: true,
};

export const cdpTheme: Partial<Theme> = {
  "colors-bg-default": "#0a0b0d",
  "colors-bg-alternate": "#22252d",
  "colors-bg-primary": "#578bfa",
  "colors-bg-secondary": "#22252d",
  "colors-fg-default": "#ffffff",
  "colors-fg-muted": "#8a919e",
  "colors-fg-primary": "#578bfa",
  "colors-fg-onPrimary": "#0a0b0d",
  "colors-fg-onSecondary": "#ffffff",
  "colors-fg-positive": "#27ad75",
  "colors-fg-negative": "#f0616d",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#252629",
  "colors-line-heavy": "#5a5d6a",
  "borderRadius-banner": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-cta": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-link": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-input": "var(--cdp-web-borderRadius-md)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-md)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-md)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-lg)",
};

export const PLATFORM_WALLET = '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

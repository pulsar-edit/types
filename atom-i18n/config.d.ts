// NOTE: intentional; needed for config extensibility
// eslint-disable-next-line @definitelytyped/no-declare-current-package

declare module "atom" {
  interface ConfigValues {
    /** Language for internationalization. */
    "atom-i18n.locale": string;
  }
}

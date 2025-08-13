/**
 * Represents the current name of the app and other details that may vary if
 * Atom is forked.
*/
export interface Branding {
  /** A lower-case fragment without spaces or special characters. */
  readonly id: string;
  /** The human-readable name of the application. */
  readonly name: string;

  /** The URL where the source code repository can be found. */
  readonly urlCoreRepo: string
  /** The URL for a discussion forum for the application. */
  readonly urlForum: string
  /** The URL of the organization on GitHub. */
  readonly urlGH: string
  /** The URL of the web site for the application */
  readonly urlWeb: string
}

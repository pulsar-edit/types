/**
 * Wraps an array of strings. The array describes a path from the root of the
 * syntax tree to a token including all scope names for the entire path.
 */
export interface ScopeDescriptor {
  /** Returns all scopes for this descriptor. */
  getScopesArray(): readonly string[];
}

/** The type itself plus all of its Schema.org supertypes. Results are cached. */
export declare function ancestorTypes(name: string): ReadonlySet<string>;
/** Union of `ancestorTypes` over several type names. */
export declare function ancestorsOf(names: readonly string[]): ReadonlySet<string>;

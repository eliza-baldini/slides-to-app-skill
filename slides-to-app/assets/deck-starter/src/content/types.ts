/**
 * Shared content types.
 *
 * Text fields typed `Rich` support lightweight inline markup (see RichText):
 *   [[text]]        highlighted (tone depends on the surface)
 *   [[text|tone]]   highlighted with a named tone: accent, positive, gold, violet
 *   *text*          italic
 *   **text**        bold
 */
export type Rich = string

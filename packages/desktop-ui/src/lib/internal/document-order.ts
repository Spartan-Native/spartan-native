/** Sorts items that own an element by where the element is in the document, for `Array.sort`. */
export function byDocumentOrder(a: { element: Element }, b: { element: Element }): number {
  if (a.element === b.element) return 0;
  return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

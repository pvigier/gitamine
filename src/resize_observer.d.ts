/**
 * The ResizeObserver interface reports changes to the content rectangle of an Element or 
 * the bounding box of an SVGElement.
 */
declare class ResizeObserver {
  /**
   * Creates and returns new ResizeObserver object.
   */
  constructor(callback: (entries: ResizeObserverEntry[]) => void);

  /**
   * Initiates observing of a specified Element.
   */
  observe(target: Element): void;

  /**
   * Unobserves all observed Element targets.
   */
  unobserve(target: Element): void;

  /**
   * Unobserves all observed Element targets.
   */
  disconnect(): void;
}

/**
 * The ResizeObserverEntry interface is the object passed to the callback ResizeObserver() constructor.
 */
interface ResizeObserverEntry {
  /**
   * A reference to the DOMRectReadOnly of the target of a resized element.
   */
  contentRect: DOMRectReadOnly;

  /**
   * A reference to an Element that was resized.
   */
  target: Element;
}
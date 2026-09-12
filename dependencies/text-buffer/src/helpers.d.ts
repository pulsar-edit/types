// import { ReadStream, WriteStream } from "fs";
import { Point, Range } from "./text-buffer";

export interface TextChange {
  newExtent: Point;
  oldExtent: Point;
  newRange: Range;
  oldRange: Range;
  newText: string;
  oldText: string;
  start: Point;
}

export interface ClipDirectionOptions {
  clipDirection?: "backward" | "forward" | "closest" | undefined;
}

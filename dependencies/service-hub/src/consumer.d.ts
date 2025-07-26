import { Range } from 'semver';
import { Service } from './util';

export interface Consumer {
  keyPath: string;
  callback: (service: Service) => void;
  versionRange: Range;
}

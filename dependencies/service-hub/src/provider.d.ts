import { CompositeDisposable, Disposable } from "../../event-kit";
import { SemVer } from 'semver';
import { Service } from './util';
import { Consumer } from './consumer';

export interface Provider  {
  consumersDisposable: CompositeDisposable;
  servicesByVersion: Record<string, Service | Record<string, Service>>;
  versions: SemVer[];

  provide(consumer: Consumer): void;

  destroy(): void;
}

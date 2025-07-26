import { Disposable } from 'atom';
import { Consumer } from './consumer';
import { Provider } from './provider';
import { Service } from './util';

export interface ServiceHub {
  providers: Provider[];
  consumers: Consumer[];

  /**
   * Provide a service by invoking the callback of all current and future
   * consumers matching the given key path and version range, passing the
   * provided service object to each one.
   *
   * @param keyPath A string of `.`-separated keys indicating the service’s
   *   location in the namespace of all services.
   * @param version A string containing a semantic version for the service’s
   *   API.
   * @param service An object exposing the service API.
   * @returns A {@link Disposable} on which `dispose` can be called to remove
   *   the provided service.
   */
  provide(keyPath: string, version: string, service: Service): Disposable;

  /**
   * Consume a service by invoking the given callback for all current and
   * future provided services matching the given key path and range.
   *
   * @param keyPath A string of `.`-separated keys indicating the service’s
   *   location in the namespace of all services.
   * @param version A string containing a semantic version for the service’s
   *   API.
   * @param callback A callback that will be invoked whenever this class can
   *   match a provider to a consumer. Takes the provider’s service object as
   *   the sole argument.
   * @returns A {@link Disposable} on which `dispose` can be called to remove
   *   the consumer.
   */
  consume(keyPath: string, version: string, callback: (providedService: Service) => unknown): Disposable;

  /**
   * Clear out all service consumes and providers, disposing of any
   * {@link Disposable}s returned by previous consumers.
   */
  clear(): void;
}

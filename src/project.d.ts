import {
  ConfigValues,
  Directory,
  Disposable,
  FilesystemChangeEvent,
  GitRepository,
  PathWatcher,
  TextBuffer,
} from "../index";

/** Represents a project that's opened in Atom. */
export interface Project {
  // Event Subscription
  /** Invoke the given callback when the project paths change. */
  onDidChangePaths(callback: (projectPaths: string[]) => void): Disposable;

  /** Invoke the given callback when a text buffer is added to the project. */
  onDidAddBuffer(callback: (buffer: TextBuffer) => void): Disposable;

  /**
   *  Invoke the given callback with all current and future text buffers in
   *  the project.
   */
  observeBuffers(callback: (buffer: TextBuffer) => void): Disposable;

  /**
   * Invoke a callback when a filesystem change occurs within any open project
   * path.
   */
  onDidChangeFiles(callback: (events: FilesystemChangeEvent) => void): Disposable;

  /**
   * Invoke a callback whenever the project's configuration has been replaced.
   */
  onDidReplace(
    callback: (projectSpec: ProjectSpecification | null | undefined) => void
  ): Disposable;

  // Accessing the Git Repository
  /**
   * Get an Array of GitRepositorys associated with the project's directories.
   *
   * This method will be removed in 2.0 because it does synchronous I/O.
   */
  getRepositories(): GitRepository[];

  /**
   * Invoke the given callback with all current and future repositories in the
   * project.
   */
  observeRepositories(callback: (repository: GitRepository) => void): Disposable;

  /** Invoke the given callback when a repository is added to the project. */
  onDidAddRepository(callback: (repository: GitRepository) => void): Disposable;

  /** Get the repository for a given directory asynchronously. */
  repositoryForDirectory(directory: Directory): Promise<GitRepository | null>;

  // Managing Paths
  /**
   * Get an Array of strings containing the paths of the project's directories.
   */
  getPaths(): string[];

  /** Set the paths of the project's directories. */
  setPaths(projectPaths: string[]): void;

  /** Add a path to the project's list of root paths. */
  addPath(projectPath: string): void;

  /**
   * Access a promise that resolves when the filesystem watcher associated with
   * a project root directory is ready to begin receiving events.
   */
  getWatcherPromise(projectPath: string): Promise<PathWatcher>;

  /** Remove a path from the project's list of root paths. */
  removePath(projectPath: string): void;

  /** Get an Array of {@link Directory}s associated with this project. */
  getDirectories(): Directory[];

  /**
   * Undocumented: Get the {@link Directory} associated with a path within this
   * project.
   */
  getDirectoryForProjectPath(projectPath: string): Directory;

  /** Get the relative path from the project directory to the given path. */
  relativize(fullPath: string): string;

  /**
   * Get the path to the project directory that contains the given path, and
   * the relative path from that project directory to the given path.
   */
  relativizePath(fullPath: string): [string | null, string];

  /**
   * Determines whether the given path (real or symbolic) is inside the
   * project's directory.
   */
  contains(pathToCheck: string): boolean;

  /**
   * Layers the contents of a project-specific configuration on top of the
   * current global configuration.
   */
  replace(projectSpecification: ProjectSpecification): void;

}

/**
 * A serialized representation of the attributes that identify this project.
 *
 * Most projects are opened against a single root path and can be described
 * entirely by that root path. But if customization does take place — addition
 * of other project roots, configuration overrides — the project now needs a
 * way to describe and serialize those customizations.
 *
 * Eventually, the destination for this information might be a project file.
 * For now, it's an object that can be passed to {@link Project#replace} and
 * will be included in the calllback to {@link Project#onDidReplace}.
 */
export interface ProjectSpecification {
  /** A set of project paths. */
  paths: string[];
  /** The location on disk of the project's configuration file. */
  originPath: string;
  /** The configuration overrides to be applied to this project. */
  config?: ConfigValues | undefined;
}

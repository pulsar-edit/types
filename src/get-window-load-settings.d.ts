type LocationToOpen = {
  exists: boolean;
  hasWaitSession: boolean;
  initialColumn: number | null;
  initialLine: number | null;
  isDirectory: boolean;
  isFile: boolean;
  pathToOpen: string | null;
};

export interface WindowLoadSettings {
  readonly appName: string;
  readonly appVersion: string;
  readonly atomHome: string;
  readonly clearWindowState: boolean;
  readonly devMode: boolean;
  readonly env?: { [key: string]: string | undefined } | undefined;
  readonly hasOpenFiles: boolean;
  readonly initialProjectRoots: string[];
  readonly locationsToOpen: LocationToOpen[];
  readonly resourcePath: string;
  readonly safeMode: boolean;
  readonly profileStartup?: boolean | undefined;
  readonly userSettings: object;
  readonly windowInitializationScript: string;
}

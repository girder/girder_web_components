declare module '@girder/components/src/components/Job/status' {
  interface Status {
    value: number;
    text: string;
    icon: string;
    color: string;
    indeterminate?: boolean;
  }
  type StatusMap = { [key: string]: Status; };
  export function all(): StatusMap;
  export function get(key: string): Status;
  export function getByValue(code: number): Status;
  export function register(obj: StatusMap): void;
}

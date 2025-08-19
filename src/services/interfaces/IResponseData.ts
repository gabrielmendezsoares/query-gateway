export interface IResponseData {
  message: string;
  suggestion: string;
}

export interface ICreateQueryDataResponseData { data: Record<string, any>; }

export interface IGetHealthResponseData {
  monitor: {
    cpuUsage: {
      name: string;
      value: string;
      isListeningModifiedEvent?: boolean;
    };
    memoryUsage: {
      name: string;
      value: string;
      isListeningModifiedEvent?: boolean;
    };
    port: {
      name: string;
      value: string;
      isListeningModifiedEvent?: boolean;
    };
    logLevel: {
      name: string;
      value: string;
      isListeningModifiedEvent?: boolean;
    };
  };
}

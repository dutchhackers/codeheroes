export interface IPubSubEvent {
  data: {
    message: {
      json: any;
    };
  };
}

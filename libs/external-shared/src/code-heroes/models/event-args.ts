export interface IEventArgs {
  sender?: string;
  pusher?: string;
  metrics?: IMetric[];
}

export interface IMetric {
  type: string;
  user: string;
  number_value?: number;
  string_value?: string;
  key?: string; // external key or reference
}

/** example  */
const example: IMetric[] = [
  { type: "github_push", user: "mschilling@move4mobile.com", number_value: 1 },
  { type: "github_commit", user: "mschilling@move4mobile.com", number_value: 3 },
  { type: "github_commit", user: "astrating@move4mobile.com", number_value: 3 },
];

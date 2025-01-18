export interface IActivity {
  id: string;
  timestamp: string;
  message: string;
  eventType: string;
  eventData: any;
  eventArgs: any;
  user: string;
  repo: string;
  photoURL?: string;
  childActivities: any; // should support child activities
}

/* 
export class IActivity {
  id: string;
  timestamp: string;
  message: string;
  eventType: string;
  eventData: any;
  eventArgs: any;
  user: string;
  repo: string;
  photoURL?: string;
}

export class Activity {
  id: number;
  timestamp: Date;
  message: string;
  eventType: string;
  eventData: object;
  user: string;
  repo: string;
  photoURL?: string;
  childActivities: any; // should support child activities
}
*/

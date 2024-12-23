export interface Player {
  uid: string;
  displayName: string;
  avatar: string;
  character: string;
  teamId: string;
  isTeamCaptain: boolean;
  score?: number;
}

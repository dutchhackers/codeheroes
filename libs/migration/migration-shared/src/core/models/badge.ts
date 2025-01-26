import { IBadgeRank } from './badge-rank';

export interface IBadge {
  avatar_ref: string;
  badge_id: string;
  badge_name: string;
  description: string;
  event_ref: string;
  ranks: IBadgeRank[];
}

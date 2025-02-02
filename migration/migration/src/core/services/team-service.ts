import { CoreService } from './abstract-service';
import { Game, Player, IUser, Team } from '@codeheroes/migration-shared';

const TEAMS_COLLECTION = 'teams';
const GAMES_COLLECTION = 'games';
const PLAYERS_COLLECTION = 'players';

export interface ITeamService {
  getTeam(userId: any): Promise<Team>;
  getTeams(): Promise<Team[]>;
}

export class TeamService extends CoreService implements ITeamService {
  constructor() {
    super();
  }

  async getTeam(teamId: string): Promise<Team> {
    const doc = await this.db.collection(TEAMS_COLLECTION).doc(teamId).get();
    if (doc !== null) {
      return <Team>doc.data();
    }
    return null;
  }

  async getTeams(): Promise<Team[]> {
    const snapshot = await this.db.collection(TEAMS_COLLECTION).get();
    return this.wrapAll<Team>(snapshot);
  }

  async getUserCurrentTeam(gameId: string, playerId: string) {
    const doc = await this.db
      .collection(GAMES_COLLECTION)
      .doc(gameId)
      .collection(PLAYERS_COLLECTION)
      .doc(playerId)
      .get();
    if (doc !== null) {
      const data = doc.data();
      if (data === undefined) {
        return null;
      } else {
        return data.teamID;
      }
    } else {
      return null;
    }
  }

  async createTeams(game: Game, teams: Array<Team>) {
    const gameRef = await this.db.collection(GAMES_COLLECTION).doc(game.id);
    for (const team of teams) {
      await gameRef.collection('teams').doc(team.id).set({
        avatar: team.avatar,
        name: team.name,
        id: team.id,
        score: 0,
      });
    }
    console.log('Teams created');
  }

  async assignPlayers(game: Game, users: Array<IUser>, teams: Array<Team>): Promise<Player[]> {
    const players: Player[] = [];
    let teamId = 0;
    let teamCount = 1;
    console.log('assignPlayers', users.length);
    const shuffledUsers = this.shuffle(users);

    for (const shuffledUser of shuffledUsers) {
      const displayName = shuffledUser.displayName;
      const uid = shuffledUser.email;
      const avatar = shuffledUser.photoUrl;
      const teamID = teams[teamId].id;

      const teamsRef = this.db.collection(GAMES_COLLECTION).doc(game.id);
      const playerRef = teamsRef.collection(PLAYERS_COLLECTION).doc(uid);
      const teamRef = teamsRef.collection('teams').doc(teamID);
      await teamRef.collection('members').doc(uid).set({
        displayName: displayName,
        teamID: teamID,
        avatar: avatar,
      });

      try {
        await playerRef.update({
          teamID: teamID,
          score: 0,
        });
      } catch (error) {
        console.error('assignPlayers', error);
      }

      teamId++;
      teamCount++;

      if (teamCount === teams.length + 1) {
        teamId = 0;
        teamCount = 1;
      }
    }

    return players;
  }

  shuffle(array) {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;
    //While there remain elements to shuffle:
    while (0 !== currentIndex) {
      //Picks a remaining element
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      //And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
}

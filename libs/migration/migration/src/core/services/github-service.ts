import { Scores } from '../enums';
import { ICreateScore } from '../interfaces';
import { Game } from '@codeheroes/migration-shared';
import { CoreService } from './abstract-service';
import { ScoresService } from './scores-service';
import { TeamService } from './team-service';

export class GitHubService extends CoreService {
  constructor() {
    super();
  }

  async analyzeScore(activity, author, currGame): Promise<any> {
    //check event type
    switch (activity.eventData.event) {
      case 'push':
        return this.analyzePush(activity, currGame);
      case 'pull_request':
        return this.analyzePullRequest(activity, author, currGame);
      case 'pull_request_review':
        return this.analyzePullRequestReview(activity, author, currGame);
      case 'issues':
        return this.analyzeIssues(activity, author, currGame);
      case 'release':
        return this.analyzeRelease(activity, author, currGame);
    }
  }

  async analyzePush(activity, currGame: Game): Promise<any> {
    const scoresService = new ScoresService();
    const teamService = new TeamService();

    const args = activity.eventArgs;
    if (args.commits.length === 0) {
      return;
    }

    try {
      const actions = [];
      for (const commit of args.commits) {
        const score = {
          score: Scores.GitHubDistinctCommit,
          eventType: 'commit',
          game: currGame.id,
          player: commit.user,
          time: new Date().toISOString(),
        } as ICreateScore;

        const teamID = await teamService.getUserCurrentTeam(currGame.id, commit.user);
        if (teamID) {
          score.team = teamID;
        }

        return scoresService.createScore(score);
      }

      //Let's try to push all scores in parallel
      return Promise.all(actions);
    } catch (e) {
      console.log('error in analyzePush', e);
    }
  }

  async analyzePullRequest(activity, author, currGame): Promise<any> {
    const scoresService = new ScoresService();
    const teamService = new TeamService();
    let user_reference;
    let teamID;
    let eventType;
    let earnedScore;
    if (author !== null) {
      if (author === null || author.email === null) {
        console.log('No player');
      } else {
        user_reference = author.email;
        teamID = await teamService.getUserCurrentTeam(currGame.id, author.email);
        if (teamID === undefined) {
          teamID = null;
        }

        switch (activity.eventData.action) {
          case 'opened':
            earnedScore = Scores.GitHubPullRequestOpened;
            eventType = 'pull_request_opened';
            break;
          case 'closed':
            earnedScore = Scores.GitHubPullRequestClosed;
            eventType = 'pull_request_closed';
            break;
          case 'merged':
            earnedScore = Scores.GitHubPullRequestMerged;
            eventType = 'pull_request_merged';
            break;
        }
        const score = {
          score: earnedScore,
          eventType: eventType,
          game: currGame.id,
          player: user_reference,
          time: activity.timestamp,
          team: teamID,
        } as ICreateScore;
        return scoresService.createScore(score);
      }
    } else {
      console.log('not a user');
    }
  }

  async analyzePullRequestReview(activity, author, currGame): Promise<any> {
    // const userService = new UserService(this.db);
    const scoresService = new ScoresService();
    const teamService = new TeamService();
    let user_reference;
    let teamID;
    let eventType;
    let earnedScore = 0;
    if (author !== null) {
      if (author === null || author.email === null) {
        console.log('No player');
      } else {
        user_reference = author.email;
        teamID = await teamService.getUserCurrentTeam(currGame.id, author.email);
        if (teamID === undefined) {
          teamID = null;
        }

        switch (activity.eventData.action) {
          case 'submitted':
            if (activity.eventData.review.state === 'approved') {
              console.log('PR approved => earned some points ;-)');
              earnedScore = Scores.GitHubPRReviewSubmittedApproved;
            } else {
              // For now: every event = +1 (including 'changes_requested')
              earnedScore = Scores.GitHubPRReviewSubmitted;
            }
            eventType = 'pull_request_review';
            break;
          default:
            console.log('action not supported', activity.eventData);
            break;
        }
        try {
          const score = {
            score: earnedScore,
            eventType: eventType,
            game: currGame.id,
            player: user_reference,
            time: activity.timestamp,
            team: teamID,
          } as ICreateScore;
          return scoresService.createScore(score);
        } catch (error) {
          console.log('Error when adding score', error);
        }
      }
    } else {
      console.log('not a user');
    }
  }

  async analyzeIssues(activity, author, currGame): Promise<any> {
    // const userService = new UserService(this.db);
    const scoresService = new ScoresService();
    const teamService = new TeamService();
    let user_reference;
    let teamID;
    let eventType;
    let earnedScore = 0;
    if (author !== null) {
      if (author === null || author.email === null) {
        console.log('No player');
      } else {
        user_reference = author.email;
        teamID = await teamService.getUserCurrentTeam(currGame.id, author.email);
        if (teamID === undefined) {
          teamID = null;
        }

        switch (activity.eventData.action) {
          case 'closed':
            if (activity.eventData.issue.state === 'closed') {
              console.log('Issue closed => earned some points ;-)');
              earnedScore = Scores.GitHubIssueClosed;
            } else {
              earnedScore = Scores.GitHubIssueOpened;
            }
            eventType = 'issue_closed';
            break;
          case 'opened':
            if (activity.eventData.issue.state === 'open') {
              eventType = 'issue_opened';
              console.log('Issue opened => earned some points ;-)');
              earnedScore = Scores.GitHubIssueOpened;
            }
            break;
          default:
            console.log('action not supported', activity.eventData);
            break;
        }
        try {
          const score = {
            score: earnedScore,
            eventType: eventType,
            game: currGame.id,
            player: user_reference,
            time: activity.timestamp,
            team: teamID,
          } as ICreateScore;
          return scoresService.createScore(score);
        } catch (error) {
          console.log('Error when adding score', error);
        }
      }
    } else {
      console.log('not a user');
    }
  }

  async analyzeRelease(activity, author, currGame): Promise<any> {
    // const userService = new UserService(this.db);
    const teamService = new TeamService();
    const scoresService = new ScoresService();

    let user_reference;
    let teamID;
    let eventType;
    let earnedScore = 0;
    if (author !== null) {
      if (author === null || author.email === null) {
        console.log('No player');
      } else {
        user_reference = author.email;
        teamID = await teamService.getUserCurrentTeam(currGame.id, author.email);
        if (teamID === undefined) {
          teamID = null;
        }

        switch (activity.eventData.action) {
          case 'published':
            earnedScore = Scores.GitHubRelease;
            eventType = 'release_published';
            break;
          default:
            console.log('action not supported', activity.eventData);
            break;
        }
        try {
          const score = {
            score: earnedScore,
            eventType: eventType,
            game: currGame.id,
            player: user_reference,
            time: activity.timestamp,
            team: teamID,
          } as ICreateScore;
          return scoresService.createScore(score);
        } catch (error) {
          console.log('Error when adding score', error);
        }
      }
    } else {
      console.log('not a user');
    }
  }
}

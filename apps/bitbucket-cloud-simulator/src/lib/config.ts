import * as fs from 'fs';
import * as path from 'path';

export interface BitbucketCloudUserConfig {
  accountId: string;
  displayName: string;
  nickname: string;
  uuid: string;
  email: string;
}

export interface TestRepositoryConfig {
  uuid: string;
  name: string;
  fullName: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceUuid: string;
}

export interface CodeheroesConfig {
  userId: string;
}

export interface Config {
  bitbucketCloud: BitbucketCloudUserConfig;
  codeheroes: CodeheroesConfig;
  testRepository: TestRepositoryConfig;
}

const CONFIG_PATH = '.claude/config.local.json';

export function loadConfig(): Config {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const configPath = path.join(dir, CONFIG_PATH);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content) as Config;
        validateConfig(config);
        return config;
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error(`Invalid JSON in config file: ${configPath}`);
        }
        throw error;
      }
    }
    dir = path.dirname(dir);
  }

  throw new Error(
    `Config file not found. Expected: ${CONFIG_PATH}\n` +
      'Create the file with the following structure:\n' +
      JSON.stringify(
        {
          bitbucketCloud: {
            accountId: '557058:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            displayName: 'Your Name',
            nickname: 'your-nickname',
            uuid: '{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}',
            email: 'your.name@example.com',
          },
          codeheroes: {
            userId: '1000001',
          },
          testRepository: {
            uuid: '{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}',
            name: 'repo-name',
            fullName: 'workspace/repo-name',
            workspaceSlug: 'workspace',
            workspaceName: 'My Workspace',
            workspaceUuid: '{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}',
          },
        },
        null,
        2
      )
  );
}

function validateConfig(config: Config): void {
  if (!config.bitbucketCloud) {
    throw new Error('Config missing "bitbucketCloud" section');
  }
  if (!config.bitbucketCloud.accountId || !config.bitbucketCloud.nickname) {
    throw new Error('Config missing required bitbucketCloud fields: accountId, nickname');
  }
  if (!config.codeheroes) {
    throw new Error('Config missing "codeheroes" section');
  }
  if (!config.codeheroes.userId) {
    throw new Error('Config missing required codeheroes fields: userId');
  }
  if (!config.testRepository) {
    throw new Error('Config missing "testRepository" section');
  }
  if (!config.testRepository.uuid || !config.testRepository.name || !config.testRepository.workspaceSlug) {
    throw new Error('Config missing required testRepository fields: uuid, name, workspaceSlug');
  }
}

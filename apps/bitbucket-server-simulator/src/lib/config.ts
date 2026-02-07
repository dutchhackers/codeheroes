import * as fs from 'fs';
import * as path from 'path';

export interface BitbucketServerUserConfig {
  id: number;
  name: string;
  emailAddress: string;
  displayName: string;
  slug: string;
}

export interface TestRepositoryConfig {
  id: number;
  slug: string;
  name: string;
  projectId: number;
  projectKey: string;
  projectName: string;
}

export interface CodeheroesConfig {
  userId: string;
}

export interface Config {
  bitbucketServer: BitbucketServerUserConfig;
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
          bitbucketServer: {
            id: 12345,
            name: 'your-username',
            emailAddress: 'your.name@example.com',
            displayName: 'Your Name',
            slug: 'your-username',
          },
          codeheroes: {
            userId: '1000001',
          },
          testRepository: {
            id: 1,
            slug: 'repo-name',
            name: 'repo-name',
            projectId: 10,
            projectKey: 'PROJ',
            projectName: 'My Project',
          },
        },
        null,
        2
      )
  );
}

function validateConfig(config: Config): void {
  if (!config.bitbucketServer) {
    throw new Error('Config missing "bitbucketServer" section');
  }
  if (!config.bitbucketServer.id || !config.bitbucketServer.name) {
    throw new Error('Config missing required bitbucketServer fields: id, name');
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
  if (!config.testRepository.id || !config.testRepository.slug || !config.testRepository.projectKey) {
    throw new Error('Config missing required testRepository fields: id, slug, projectKey');
  }
}

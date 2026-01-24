import * as fs from 'fs';
import * as path from 'path';

export interface GitHubUserConfig {
  userId: number;
  username: string;
  email: string;
  displayName: string;
  nodeId: string;
}

export interface CodeheroesConfig {
  userId: string;
}

export interface TestRepositoryConfig {
  id: number;
  name: string;
  owner: string;
  fullName: string;
  nodeId: string;
}

export interface Config {
  github: GitHubUserConfig;
  codeheroes: CodeheroesConfig;
  testRepository: TestRepositoryConfig;
}

const CONFIG_PATH = '.claude/config.local.json';

export function loadConfig(): Config {
  // Start from current working directory and walk up to find config
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
          github: {
            userId: 123456,
            username: 'your-username',
            email: 'your-email@example.com',
            displayName: 'Your Name',
            nodeId: 'MDQ6VXNlcjEyMzQ1Ng==',
          },
          codeheroes: {
            userId: '1000001',
          },
          testRepository: {
            id: 123456789,
            name: 'repo-name',
            owner: 'owner',
            fullName: 'owner/repo-name',
            nodeId: 'R_kgDOxxxxxxx',
          },
        },
        null,
        2
      )
  );
}

function validateConfig(config: Config): void {
  if (!config.github) {
    throw new Error('Config missing "github" section');
  }
  if (!config.github.userId || !config.github.username) {
    throw new Error('Config missing required github fields: userId, username');
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
  if (!config.testRepository.id || !config.testRepository.name || !config.testRepository.owner) {
    throw new Error('Config missing required testRepository fields: id, name, owner');
  }
}

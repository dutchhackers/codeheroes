import * as fs from 'fs';
import * as path from 'path';

export interface AzureUserConfig {
  userId: string;
  displayName: string;
  uniqueName: string;
  email: string;
}

export interface AzureTestRepositoryConfig {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
}

export interface CodeheroesConfig {
  userId: string;
}

export interface Config {
  azure: AzureUserConfig;
  codeheroes: CodeheroesConfig;
  azureTestRepository: AzureTestRepositoryConfig;
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
          azure: {
            userId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            displayName: 'Your Name',
            uniqueName: 'your.name@company.com',
            email: 'your.name@company.com',
          },
          codeheroes: {
            userId: '1000001',
          },
          azureTestRepository: {
            id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            name: 'repo-name',
            projectId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            projectName: 'ProjectName',
          },
        },
        null,
        2
      )
  );
}

function validateConfig(config: Config): void {
  if (!config.azure) {
    throw new Error('Config missing "azure" section');
  }
  if (!config.azure.userId || !config.azure.uniqueName) {
    throw new Error('Config missing required azure fields: userId, uniqueName');
  }
  if (!config.codeheroes) {
    throw new Error('Config missing "codeheroes" section');
  }
  if (!config.codeheroes.userId) {
    throw new Error('Config missing required codeheroes fields: userId');
  }
  if (!config.azureTestRepository) {
    throw new Error('Config missing "azureTestRepository" section');
  }
  if (!config.azureTestRepository.id || !config.azureTestRepository.name || !config.azureTestRepository.projectName) {
    throw new Error('Config missing required azureTestRepository fields: id, name, projectName');
  }
}

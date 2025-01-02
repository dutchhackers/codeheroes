import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function loadJsonData<T>(filename: string): Promise<T> {
  const projectRoot = process.cwd();
  const baseFilePath = join(projectRoot, 'libs', 'database-seeds', 'src', 'lib', 'data');
  const localFileName = filename.replace('.json', '.local.json');
  const localFilePath = join(baseFilePath, localFileName);
  
  // Check if local override exists
  const finalPath = existsSync(localFilePath) 
    ? localFilePath 
    : join(baseFilePath, filename);
    
  console.log(`Loading data from: ${finalPath}`);
  const fileContent = await readFile(finalPath, 'utf-8');
  return JSON.parse(fileContent);
}

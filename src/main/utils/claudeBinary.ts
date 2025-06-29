import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export class ClaudeBinaryFinder {
  private cachedPath: string | null = null;

  async findClaudeBinary(): Promise<string> {
    // Return cached path if available
    if (this.cachedPath && await this.verifyPath(this.cachedPath)) {
      return this.cachedPath;
    }

    // Try 'which' command first
    try {
      const { stdout } = await execAsync('which claude');
      const claudePath = stdout.trim();
      if (await this.verifyPath(claudePath)) {
        this.cachedPath = claudePath;
        return claudePath;
      }
    } catch (error) {
      console.log('which command failed:', (error as Error).message);
    }

    // Check common installation paths
    const paths = this.getSearchPaths();
    
    for (const searchPath of paths) {
      if (await this.verifyPath(searchPath)) {
        this.cachedPath = searchPath;
        return searchPath;
      }
    }

    throw new Error('Claude Code not found. Please ensure it\'s installed.');
  }

  private getSearchPaths(): string[] {
    const home = os.homedir();
    const platform = os.platform();
    
    const basePaths = [
      '/usr/local/bin/claude',
      '/usr/bin/claude',
      path.join(home, '.local/bin/claude'),
      path.join(home, '.npm-global/bin/claude'),
      path.join(home, '.yarn/bin/claude'),
      path.join(home, '.bun/bin/claude'),
    ];

    // Platform-specific paths
    if (platform === 'darwin') {
      basePaths.push('/opt/homebrew/bin/claude');
    }

    // Check NVM installations
    const nvmDir = path.join(home, '.nvm/versions/node');
    try {
      const nodeDirs = fs.readdir(nvmDir);
      nodeDirs.then(dirs => {
        dirs.forEach(dir => {
          basePaths.push(path.join(nvmDir, dir, 'bin/claude'));
        });
      }).catch(() => {
        // Silently ignore errors when reading NVM directories
      });
    } catch {
      // Silently ignore errors when accessing NVM directory
    }

    return basePaths;
  }

  private async verifyPath(claudePath: string): Promise<boolean> {
    try {
      await fs.access(claudePath, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getVersion(claudePath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`"${claudePath}" --version`);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SessionMetadata {
  customName?: string;
  isDeleted: boolean;
  deletedAt?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MetadataStore {
  sessions: {
    [claudeSessionId: string]: SessionMetadata;
  };
}

export class SessionMetadataStore {
  private static instance: SessionMetadataStore;
  private metadataPath: string;
  private metadata: MetadataStore = { sessions: {} };

  private constructor() {
    const dataDir = path.join(os.homedir(), '.claudecommander');
    this.metadataPath = path.join(dataDir, 'metadata.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.loadMetadata();
  }

  static getInstance(): SessionMetadataStore {
    if (!SessionMetadataStore.instance) {
      SessionMetadataStore.instance = new SessionMetadataStore();
    }
    return SessionMetadataStore.instance;
  }

  private loadMetadata(): void {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const data = fs.readFileSync(this.metadataPath, 'utf-8');
        this.metadata = JSON.parse(data);
      } else {
        this.metadata = { sessions: {} };
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
      this.metadata = { sessions: {} };
    }
  }

  private saveMetadata(): void {
    try {
      fs.writeFileSync(this.metadataPath, JSON.stringify(this.metadata, null, 2));
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  // Get metadata for a specific session
  getSessionMetadata(claudeSessionId: string): SessionMetadata | undefined {
    return this.metadata.sessions[claudeSessionId];
  }

  // Set custom name for a session
  setSessionName(claudeSessionId: string, customName: string): void {
    if (!this.metadata.sessions[claudeSessionId]) {
      this.metadata.sessions[claudeSessionId] = {
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    this.metadata.sessions[claudeSessionId].customName = customName;
    this.metadata.sessions[claudeSessionId].updatedAt = Date.now();
    
    this.saveMetadata();
  }

  // Soft delete a session
  deleteSession(claudeSessionId: string): void {
    if (!this.metadata.sessions[claudeSessionId]) {
      this.metadata.sessions[claudeSessionId] = {
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    this.metadata.sessions[claudeSessionId].isDeleted = true;
    this.metadata.sessions[claudeSessionId].deletedAt = Date.now();
    this.metadata.sessions[claudeSessionId].updatedAt = Date.now();
    
    this.saveMetadata();
  }

  // Restore a deleted session
  restoreSession(claudeSessionId: string): void {
    if (this.metadata.sessions[claudeSessionId]) {
      this.metadata.sessions[claudeSessionId].isDeleted = false;
      delete this.metadata.sessions[claudeSessionId].deletedAt;
      this.metadata.sessions[claudeSessionId].updatedAt = Date.now();
      
      this.saveMetadata();
    }
  }

  // Check if a session is deleted
  isSessionDeleted(claudeSessionId: string): boolean {
    const metadata = this.metadata.sessions[claudeSessionId];
    return metadata?.isDeleted || false;
  }

  // Get all session metadata
  getAllMetadata(): MetadataStore {
    return this.metadata;
  }

  // Add tags to a session
  addTags(claudeSessionId: string, tags: string[]): void {
    if (!this.metadata.sessions[claudeSessionId]) {
      this.metadata.sessions[claudeSessionId] = {
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    const existingTags = this.metadata.sessions[claudeSessionId].tags || [];
    const uniqueTags = Array.from(new Set([...existingTags, ...tags]));
    
    this.metadata.sessions[claudeSessionId].tags = uniqueTags;
    this.metadata.sessions[claudeSessionId].updatedAt = Date.now();
    
    this.saveMetadata();
  }

  // Remove tags from a session
  removeTags(claudeSessionId: string, tags: string[]): void {
    const metadata = this.metadata.sessions[claudeSessionId];
    if (metadata && metadata.tags) {
      metadata.tags = metadata.tags.filter(tag => !tags.includes(tag));
      metadata.updatedAt = Date.now();
      
      this.saveMetadata();
    }
  }
}
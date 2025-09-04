export interface CarmillaMeta {
  method: string;
  chain?: string[];
  passphrase_hint?: string;
  timestamp: string;
  user_id?: string;
  workspace_id?: string;
  project_id?: string;
  [key: string]: any;
}

export interface CarmillaPackage {
  meta: CarmillaMeta;
  data: string;
}

export interface EncryptionTarget {
  type: 'file' | 'obj' | 'text';
  path?: string;
  key?: string;
  data: string;
  intent: 'encrypt' | 'do-not-encrypt' | 'cannot-encrypt';
}

export interface EncryptionResult {
  type: string;
  path?: string;
  key?: string;
  intent: string;
  status: 'encrypted' | 'encryption-failed' | 'skipped' | 'cannot-encrypt';
  packaged?: string;
  error?: string;
  reason?: string;
  meta: CarmillaMeta;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  encrypted?: boolean;
  created_at: string;
  updated_at: string;
}
export enum DatabaseErrorCode {
  DB_NOT_OPEN = 'DB_NOT_OPEN',
  QUERY_FAILED = 'QUERY_FAILED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CONNECTION_CLOSED = 'CONNECTION_CLOSED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

export interface DatabaseErrorContext {
  code: DatabaseErrorCode;
  message: string;
  originalError?: Error;
  sql?: string;
  operation?: string;
  suggestion?: string;
  timestamp: number;
}

export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;
  public readonly originalError?: Error;
  public readonly sql?: string;
  public readonly operation?: string;
  public readonly suggestion?: string;
  public readonly timestamp: number;

  constructor(context: DatabaseErrorContext) {
    super(context.message);
    this.name = 'DatabaseError';
    this.code = context.code;
    this.originalError = context.originalError;
    this.sql = context.sql;
    this.operation = context.operation;
    this.suggestion = context.suggestion;
    this.timestamp = context.timestamp;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      sql: this.sql,
      operation: this.operation,
      suggestion: this.suggestion,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export class DatabaseNotOpenError extends DatabaseError {
  constructor(message: string = 'Database not opened') {
    super({
      code: DatabaseErrorCode.DB_NOT_OPEN,
      message,
      suggestion: 'Call open() before executing queries',
      timestamp: Date.now(),
    });
    this.name = 'DatabaseNotOpenError';
  }
}

export class QueryExecutionError extends DatabaseError {
  constructor(sql: string, originalError: Error) {
    super({
      code: DatabaseErrorCode.QUERY_FAILED,
      message: `Query execution failed: ${originalError.message}`,
      originalError,
      sql,
      suggestion: 'Check SQL syntax and parameters',
      timestamp: Date.now(),
    });
    this.name = 'QueryExecutionError';
  }
}

export class ImportExportError extends DatabaseError {
  constructor(operation: 'import' | 'export', originalError: Error) {
    super({
      code: operation === 'import' ? DatabaseErrorCode.IMPORT_FAILED : DatabaseErrorCode.EXPORT_FAILED,
      message: `${operation.charAt(0).toUpperCase() + operation.slice(1)} operation failed: ${originalError.message}`,
      originalError,
      operation,
      suggestion: operation === 'import' ? 'Ensure file is a valid SQLite database' : 'Check database state before export',
      timestamp: Date.now(),
    });
    this.name = 'ImportExportError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(originalError: Error) {
    super({
      code: DatabaseErrorCode.TRANSACTION_FAILED,
      message: `Transaction failed: ${originalError.message}`,
      originalError,
      suggestion: 'Transaction was rolled back. Check query syntax and constraints',
      timestamp: Date.now(),
    });
    this.name = 'TransactionError';
  }
}

export function logDatabaseError(error: DatabaseError): void {
  console.error('[DatabaseError]', {
    code: error.code,
    message: error.message,
    sql: error.sql,
    operation: error.operation,
    timestamp: new Date(error.timestamp).toISOString(),
    stack: error.stack,
  });

  if (error.originalError) {
    console.error('[Original Error]', error.originalError);
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

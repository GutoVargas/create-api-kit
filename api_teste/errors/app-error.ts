export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  /** Cria um erro HTTP com mensagem amigável, status e código estável da aplicação. */
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestTime?: number;
      requestId: string;
    }
  }
}

export {};

export class ApiError extends Error {
  public statusCode: number;
  public data: any;
  public success: boolean;
  public errors: any[];
  public code: string;

  constructor(
    statusCode: number,
    message = 'Something went wrong',
    errors: any[] = [],
    code = 'INTERNAL_ERROR',
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.code = code;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;

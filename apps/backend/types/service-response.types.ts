

export type ServiceResponse<T> =
  | { data: T }
  | {
      error: {
        message: string
        details?: string
        status: 404 | 500
      }
    }
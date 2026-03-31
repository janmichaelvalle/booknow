
export type BusinessRow = {
  id: string
  name: string
  slug: string
}

export type BusinessResult =
  | {
      error: {
        message: string
        details?: string
        status: 404 | 500
      }
    }
  | {
      business: BusinessRow
    }

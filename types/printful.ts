export interface SyncProduct {
  id: number
  name: string
  thumbnail_url: string | null
  variants: number
  synced: number
}

export interface SyncVariant {
  id: number
  sync_product_id: number
  name: string
  retail_price: string
  currency: string
  is_ignored: boolean
  sku: string
  files: PrintfulFile[]
  size: string
  color: string
  color_code: string
  color_code2: string | null
  in_stock: boolean
}

export interface PrintfulFile {
  type: string
  id: number
  url: string
  options: Array<{ id: string; value: string }>
  hash: string
  filename: string
  mime_type: string
  size: number
  width: number
  height: number
  dpi: number
  status: string
  created: number
  thumbnail_url: string | null
  preview_url: string | null
  visible: boolean
}

export interface PrintfulProductDetail {
  sync_product: SyncProduct
  sync_variants: SyncVariant[]
}

export interface PrintfulListResponse<T> {
  code: number
  result: T[]
  paging: {
    total: number
    offset: number
    limit: number
  }
}

export interface PrintfulDetailResponse<T> {
  code: number
  result: T
}

export interface PrintfulError {
  code: number
  result: string
  error: { reason: string; message: string }
}

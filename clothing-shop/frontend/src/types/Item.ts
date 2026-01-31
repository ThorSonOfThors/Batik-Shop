export interface Item {
  id: number
  name: string
  size: string
  material?: string
  producer?: string
  price: number
  category: string
  status?: string
  images: string[] // list of image URLs
  quantity: number // for cart management
  description : string
}

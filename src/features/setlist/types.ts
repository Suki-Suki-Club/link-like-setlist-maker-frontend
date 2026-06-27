export type LoveLiveSeries =
  | "μ's"
  | 'Aqours'
  | '虹ヶ咲'
  | 'Liella!'
  | '蓮ノ空'
  | 'その他'

export type Song = {
  id: string
  title: string
  titleJa?: string | null
  series: LoveLiveSeries
  unit: string
  unitId?: string
  tags: string[]
  releaseDate?: string | null
  sortOrder?: number
}

export type SetlistBreakType = "encore" | "mc" | "interlude"

export type SetlistBreak = {
  after: number
  type: SetlistBreakType
}

export type SetlistPrediction = {
  songIds: string[]
  encoreAfters: number[]
  breaks: SetlistBreak[]
}

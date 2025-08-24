import { ImageI } from './generate-image-utils'
import { VideoI } from './generate-video-utils'

export interface ExportMediaFieldI {
 label: string
 name?: string
 type: string
 prop?: string
 isUpdatable: boolean
 isMandatory?: boolean
 isExportVisible: boolean
 isExploreVisible: boolean
 options?: {
  value: string
  label: string
 }[]
}

export interface ExportMediaFormFieldsI {
 id: ExportMediaFieldI
 gcsURI: ExportMediaFieldI
 creationDate: ExportMediaFieldI
 leveragedModel: ExportMediaFieldI
 author: ExportMediaFieldI
 prompt: ExportMediaFieldI
 format: ExportMediaFieldI
 videoDuration: ExportMediaFieldI
 videoResolution: ExportMediaFieldI
 videoThumbnailGcsUri: ExportMediaFieldI
 aspectRatio: ExportMediaFieldI
 upscaleFactor: ExportMediaFieldI
 width: ExportMediaFieldI
 height: ExportMediaFieldI
 [key: string]: ExportMediaFieldI
}

export const exportStandardFields: ExportMediaFormFieldsI = {
 id: {
  label: '媒体 ID',
  type: 'text-info',
  prop: 'key',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: false,
 },
 gcsURI: {
  label: '媒体 GCS URI',
  type: 'text-info',
  prop: 'gcsUri',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: false,
 },
 creationDate: {
  label: '生成日期',
  type: 'text-info',
  prop: 'date',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: true,
 },
 leveragedModel: {
  label: '所用模型',
  type: 'text-info',
  prop: 'modelVersion',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: true,
 },
 mediaCreationMode: {
  label: '创建模式',
  type: 'text-info',
  prop: 'mode',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: true,
 },
 author: {
  label: '作者',
  type: 'text-info',
  prop: 'author',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: true,
 },
 prompt: {
  label: '提示词',
  type: 'text-info',
  prop: 'prompt',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 format: {
  label: '格式',
  type: 'text-info',
  prop: 'format',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 videoDuration: {
  label: '时长 (秒)',
  type: 'text-info',
  prop: 'duration',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 videoResolution: {
  label: '分辨率',
  type: 'text-info',
  prop: 'resolution',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 videoThumbnailGcsUri: {
  label: '视频缩略图 GCS URI',
  type: 'text-info',
  prop: 'videoThumbnailGcsUri',
  isUpdatable: false,
  isExportVisible: false,
  isExploreVisible: false,
 },
 aspectRatio: {
  label: '宽高比',
  type: 'text-info',
  prop: 'ratio',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 upscaleFactor: {
  label: '放大系数',
  type: 'radio-button',
  prop: 'upscaleFactor',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 width: {
  label: '宽度 (像素)',
  type: 'text-info',
  prop: 'width',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
 height: {
  label: '高度 (像素)',
  type: 'text-info',
  prop: 'height',
  isUpdatable: false,
  isExportVisible: true,
  isExploreVisible: true,
 },
}

// [汉化] 媒体库筛选器选项
export const exportMetaOptions = {
  associatedTeams: {
    name: 'associatedTeams',
    label: '关联团队',
    isExportVisible: true,
    isExploreVisible: true,
    isUpdatable: true,
    options: [
      { value: 'content_marketing', label: '内容营销' },
      { value: 'community_management', label: '社区管理' },
      { value: 'human_ressources', label: '人力资源' },
      { value: 'product_development', label: '产品开发' },
      { value: 'sales_enablement', label: '销售赋能' },
    ],
  },
  targettedPlatforms: {
    name: 'targettedPlatforms',
    label: '目标平台',
    isExportVisible: true,
    isExploreVisible: true,
    isUpdatable: true,
    options: [
      { value: 'mailing_campaign', label: '邮件营销' },
      { value: 'public_website', label: '公共网站' },
      { value: 'social_medias', label: '社交媒体' },
      { value: 'product_development', label: '产品开发' },
    ],
  },
  associatedBrands: {
    name: 'associatedBrands',
    label: '关联品牌',
    isExportVisible: true,
    isExploreVisible: true,
    isUpdatable: true,
    options: [
      { value: 'gemo', label: 'Gémo' },
      { value: 'mellow_yellow', label: 'Mellow Yellow' },
      { value: 'bocage', label: 'Bocage' },
      { value: 'maje', label: 'Maje' },
      { value: 'ba_sh', label: 'Ba&sh' },
      { value: 'sessun', label: 'Sessùn' },
      { value: 'american_vintage', label: 'American Vintage' },
      { value: 'the_kooples', label: 'The Kooples' },
    ],
  },
  associatedCollections: {
    name: 'associatedCollections',
    label: '关联系列',
    isExportVisible: true,
    isExploreVisible: true,
    isUpdatable: true,
    options: [
      { value: 'spring', label: '春季' },
      { value: 'summer', label: '夏季' },
      { value: 'fall', label: '秋季' },
      { value: 'winter', label: '冬季' },
    ],
  },
};


export interface ExportMediaFormI {
 mediaToExport: ImageI | VideoI
 upscaleFactor: string
 [key: string]: any
}

export interface FilterMediaFormI {
 [key: string]: any
}

export interface MediaMetadataI {
 id: string
 gcsURI: string
 creationDate: any
 leveragedModel: string
 author: string
 prompt: string
 format: string
 videoDuration?: number
 videoResolution?: string
 videoThumbnailGcsUri?: string
 aspectRatio: string
 upscaleFactor?: string
 width: number
 height: number
 userEmail?: string;
 [key: string]: any
}

export type MediaMetadataWithSignedUrl = MediaMetadataI & { signedUrl: string; videoThumbnailSignedUrl?: string }

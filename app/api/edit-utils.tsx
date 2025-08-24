export interface EditImageFieldStyleI {
 type: string
 label: string
 description?: string
 default?: number | string
 min?: number
 max?: number
 step?: number
 isDataResetable: boolean
 options?:
  | {
    value: string
    label: string
    indication?: string
    description?: string
    mandatoryPrompt?: boolean
    mandatoryMask?: boolean
    maskType?: string[]
   }[]
  | string[]
}

export interface EditImageFormFieldsI {
 modelVersion: EditImageFieldStyleI
 inputImage: EditImageFieldStyleI
 inputMask: EditImageFieldStyleI
 prompt: EditImageFieldStyleI
 sampleCount: EditImageFieldStyleI
 negativePrompt: EditImageFieldStyleI
 editMode: EditImageFieldStyleI
 maskDilation: EditImageFieldStyleI
 baseSteps: EditImageFieldStyleI
 outputOptions: EditImageFieldStyleI
 personGeneration: EditImageFieldStyleI
}

export const EditImageFormFields = {
 modelVersion: {
  type: 'select',
  label: '模型版本', // [汉化]
  default: 'imagen-3.0-capability-001',
  options: [
   {
    value: 'imagen-3.0-capability-001',
    label: 'Imagen 3',
    indication: '',
   },
  ],
  isDataResetable: false,
 },
 inputImage: {
  type: 'base64 encoded string',
  label: '输入图片', // [汉化]
  isDataResetable: true,
 },
 inputMask: {
  type: 'base64 encoded string',
  label: '输入蒙版', // [汉化]
  isDataResetable: true,
 },
 prompt: {
  type: 'textInput',
  label: '提示词', // [汉化]
  isDataResetable: true,
 },
 sampleCount: {
  label: '输出数量', // [汉化]
  type: 'chip-group',
  default: '1',
  options: ['1', '2'],
  isDataResetable: false,
 },
 negativePrompt: {
  label: '负面提示词', // [汉化]
  type: 'textInput',
  isDataResetable: true,
 },
 editMode: {
  type: 'in-place-menu',
  label: '您想对图片进行什么操作？', // [汉化]
  default: 'EDIT_MODE_INPAINT_INSERTION',
  options: [
   {
    value: 'EDIT_MODE_INPAINT_INSERTION',
    label: '插入', // [汉化]
    description: '添加新对象', // [汉化]
    icon: 'add_photo_alternate',
    mandatoryPrompt: true,
    promptIndication: '提示词 - 描述您想在选定区域插入的内容', // [汉化]
    mandatoryMask: true,
    maskButtonLabel: '选择区域', // [汉化]
    maskButtonIcon: 'ads_click',
    maskDialogTitle: '选择要插入的区域', // [汉化]
    maskDialogIndication: '只有区域内的像素可以且将被编辑', // [汉化]
    maskType: ['manual', 'background', 'foreground', 'semantic', 'interactive', 'prompt'],
    enabled: true,
    defaultMaskDilation: 0.01,
    defaultBaseSteps: 35,
   },
   {
    value: 'EDIT_MODE_INPAINT_REMOVAL',
    label: '移除', // [汉化]
    description: '擦除选定的对象', // [汉化]
    icon: 'cancel',
    mandatoryPrompt: false,
    mandatoryMask: true,
    maskButtonLabel: '选择对象', // [汉化]
    maskButtonIcon: 'category',
    maskDialogTitle: '选择要移除的对象', // [汉化]
    maskDialogIndication: '只有选定的像素可以且将被编辑', // [汉化]
    maskType: ['manual', 'background', 'foreground', 'semantic', 'interactive', 'prompt'],
    enabled: true,
    defaultMaskDilation: 0.01,
    defaultBaseSteps: 12,
   },
   {
    value: 'EDIT_MODE_OUTPAINT',
    label: '扩图', // [汉化]
    description: '扩展图片', // [汉化]
    icon: 'aspect_ratio',
    mandatoryPrompt: false,
    promptIndication: '提示词 (可选) - 具体说明要在扩展空间中放置什么', // [汉化]
    mandatoryMask: true,
    maskButtonLabel: '新比例', // [汉化]
    maskButtonIcon: 'crop',
    maskDialogTitle: '选择您的新图片格式', // [汉化]
    maskDialogIndication: '只有扩图区域中的像素会被编辑', // [汉化]
    maskType: ['outpaint'],
    enabled: true,
    defaultMaskDilation: 0.03,
    defaultBaseSteps: 35,
   },
   {
    value: 'EDIT_MODE_BGSWAP',
    label: '替换背景', // [汉化]
    description: '改变背景场景', // [汉化]
    icon: 'model_training',
    mandatoryPrompt: true,
    promptIndication: '提示词 - 描述您想将产品置于何种情境中', // [汉化]
    mandatoryMask: false,
    enabled: true,
    defaultMaskDilation: 0.0,
    defaultBaseSteps: 75,
   },
   {
    value: 'UPSCALE',
    label: '放大', // [汉化]
    description: '提升图片分辨率', // [汉化]
    icon: 'diamond',
    mandatoryPrompt: false,
    mandatoryMask: false,
    enabled: true,
    defaultMaskDilation: 0,
    defaultBaseSteps: 0,
   },
  ],
  isDataResetable: false,
 },
 maskDilation: {
  type: 'float',
  label: '蒙版扩展', // [汉化]
  description: '确定所提供蒙版的扩展百分比',
  default: 0.01,
  min: 0.0,
  max: 0.3,
  step: 0.01,
  isDataResetable: true,
 },
 baseSteps: {
  type: 'integer',
  label: '基础步数', // [汉化]
  description: '控制生成输出所使用的步数',
  default: 35,
  min: 1,
  max: 100,
  step: 1,
  isDataResetable: true,
 },
 outputOptions: {
  label: '输出格式', // [汉化]
  type: 'select',
  default: 'image/png',
  options: [
   { value: 'image/png', label: 'PNG' },
   { value: 'image/jpeg', label: 'JPEG' },
  ],
  isDataResetable: false,
 },
 personGeneration: {
  label: '人物生成', // [汉化]
  type: 'select',
  default: 'allow_adult',
  options: [
   { value: 'dont_allow', label: '不允许人物' }, // [汉化]
   { value: 'allow_adult', label: '仅限成人' }, // [汉化]
   { value: 'allow_all', label: '成人和儿童' }, // [汉化]
  ],
  isDataResetable: false,
 },
}

export const maskTypes = [
 {
  value: 'manual',
  label: '手动选择', // [汉化]
  description: '您手动刷过的一个或多个区域', // [汉化]
  readOnlyCanvas: false,
  requires: 'manualSelection',
 },
 {
  value: 'background',
  label: '背景', // [汉化]
  description: '除了主要物体、人物或主体之外的所有东西', // [汉化]
  readOnlyCanvas: true,
 },
 {
  value: 'foreground',
  label: '前景', // [汉化]
  description: '仅主要物体、人物或主体', // [汉化]
  readOnlyCanvas: true,
 },
 {
  value: 'outpaint',
  label: '配置扩图区域', // [汉化]
  description: '要在其中编辑的新图像格式', // [汉化]
  readOnlyCanvas: true,
  requires: 'ratioSelection',
 },
]


export const semanticClasses = [
  { class_id: 43, value: 'Floor' },
  { class_id: 94, value: 'Gravel' },
  { class_id: 95, value: 'Platform' },
  { class_id: 96, value: 'Playingfield' },
  { class_id: 186, value: 'River Lake' },
  { class_id: 98, value: 'Road' },
  { class_id: 101, value: 'Runway' },
  { class_id: 187, value: 'Sea' },
  { class_id: 100, value: 'Sidewalk Pavement' },
  { class_id: 142, value: 'Sky' },
  { class_id: 99, value: 'Snow' },
  { class_id: 189, value: 'Swimming Pool' },
  { class_id: 102, value: 'Terrain' },
  { class_id: 191, value: 'Wall' },
  { class_id: 188, value: 'Water' },
  { class_id: 190, value: 'Waterfall' },
]

// Interface of Edit form fields
export interface EditImageFormI {
  modelVersion: string
  inputImage: string
  ratio: string
  width: number
  height: number
  inputMask: string
  prompt: string
  sampleCount: string
  negativePrompt: string
  editMode: string
  maskMode?: string
  maskDilation: string
  baseSteps: string
  outputOptions: string
  personGeneration: string
}

// Sort out Edit fields depending on purpose
export interface EditSettingsFieldsI {
  sampleCount: EditImageFieldStyleI
  maskDilation: EditImageFieldStyleI
  baseSteps: EditImageFieldStyleI
  outputOptions: EditImageFieldStyleI
  personGeneration: EditImageFieldStyleI
  negativePrompt: EditImageFieldStyleI
}
export const editSettingsFields: EditSettingsFieldsI = {
  sampleCount: EditImageFormFields.sampleCount,
  maskDilation: EditImageFormFields.maskDilation,
  baseSteps: EditImageFormFields.baseSteps,
  outputOptions: EditImageFormFields.outputOptions,
  personGeneration: EditImageFormFields.personGeneration,
  negativePrompt: EditImageFormFields.negativePrompt,
}

// Set default values for Edit Form
const editFieldList: [keyof EditImageFormFieldsI] = Object.keys(EditImageFormFields) as [keyof EditImageFormFieldsI]
export var formDataEditDefaults: any
editFieldList.forEach((field) => {
  const fieldParams: EditImageFieldStyleI = EditImageFormFields[field]
  const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
  formDataEditDefaults = { ...formDataEditDefaults, [field]: defaultValue }
})

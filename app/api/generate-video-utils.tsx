import {
  advancedSettingsI,
  generalSettingsI,
  GenerateFieldI1,
  GenerateFieldSecondartStyleI,
  GenerateFieldStyleI,
  selectFieldsI,
} from './generate-image-utils'

export interface GenerateVideoFormFieldsI {
  prompt: GenerateFieldI1
  modelVersion: GenerateFieldI1
  sampleCount: GenerateFieldI1
  negativePrompt: GenerateFieldI1
  seedNumber: GenerateFieldI1
  aspectRatio: GenerateFieldI1
  resolution: GenerateFieldI1
  durationSeconds: GenerateFieldI1
  personGeneration: GenerateFieldI1
  style: GenerateFieldStyleI
  secondary_style: GenerateFieldSecondartStyleI
  motion: GenerateFieldI1
  effects: GenerateFieldI1
  framing: GenerateFieldI1
  angle: GenerateFieldI1
  ambiance: GenerateFieldI1
  interpolImageFirst: GenerateFieldI1
  interpolImageLast: GenerateFieldI1
  cameraPreset: GenerateFieldI1
}

export const GenerateVideoFormFields = {
  prompt: {
    type: 'textInput',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  modelVersion: {
    type: 'select',
    default: 'veo-3.0-generate-preview',
    options: [
      {
        value: 'veo-3.0-generate-preview',
        label: 'Veo 3',
        indication: '标准模型版本：文本到视频 & 图像到视频 + 音频',
      },
      {
        value: 'veo-3.0-fast-generate-preview',
        label: 'Veo 3 Fast',
        indication: '低延迟模型版本：文本到视频 + 音频',
      },
      {
        value: 'veo-2.0-generate-001',
        label: 'Veo 2',
        indication: '标准模型版本：文本到视频 & 图像到视频',
      },
    ],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  isVideoWithAudio: {
    type: 'toggleSwitch',
    default: true,
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  sampleCount: {
    label: '输出数量',
    type: 'chip-group',
    default: '1',
    options: ['1', '2'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  negativePrompt: {
    type: 'textInput',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  seedNumber: {
    type: 'numberInput',
    default: '',
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  aspectRatio: {
    label: '宽高比',
    type: 'chip-group',
    default: '16:9',
    options: ['16:9', '9:16'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  resolution: {
    label: '分辨率',
    type: 'chip-group',
    default: '720p',
    options: ['720p'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  durationSeconds: {
    label: '视频时长（秒）',
    type: 'chip-group',
    default: '5',
    options: ['5', '6', '7', '8'],
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  personGeneration: {
    label: '人物生成',
    type: 'select',
    default: 'allow_adult',
    options: [
      {
        value: 'allow_adult',
        label: '仅限成人',
      },
      {
        value: 'dont_allow',
        label: '不生成人物',
      },
    ],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  style: {
    type: 'select',
    default: 'cinematic',
    defaultSub: 'cinematicSub',
    options: [
      {
        value: 'cinematic',
        label: '电影风格',
        subID: 'cinematicSub',
      },
      {
        value: 'animation',
        label: '动画风格',
        subID: 'animationSub',
      },
    ],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  secondary_style: {
    type: 'controled-chip-group',
    options: [
      {
        label: '电影风格子类型',
        subID: 'cinematicSub',
        type: 'select',
        options: [
          '电影',
          '黑白',
          '恐怖',
          '奇幻',
          '西部',
          '默片',
          '复古',
          '纪录片',
          '动作场面',
          '素材片段',
          '航拍镜头',
        ],
        default: '',
      },
      {
        label: '动画风格子类型',
        subID: 'animationSub',
        type: 'select',
        options: [
          '3D 动画',
          '3D 卡通',
          '日本动漫',
          '经典卡通',
          '漫画风格',
          '定格动画',
          '黏土动画',
          '像素艺术',
          '矢量艺术',
          '运动图形',
          '白板动画',
          '剪纸',
        ],
        default: '',
      },
    ],
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  motion: {
    label: '相机运动',
    type: 'chip-group',
    options: ['航拍', '跟随', '第一视角', '环绕', '放大', '缩小', '静态', '平移', '俯仰', '手持'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  framing: {
    label: '取景',
    type: 'chip-group',
    options: ['极宽景', '宽景', '中景', '特写', '极特写', '肩越过视角'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  angle: {
    label: '角度',
    type: 'chip-group',
    options: ['高角度', '低角度', '平视', '鸟瞰'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  ambiance: {
    label: '氛围',
    type: 'chip-group',
    options: ['明亮日光', '金色时刻', '夜景', '沉郁', '单色', '霓虹', '剪影', '戏剧化'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  effects: {
    label: '特效',
    type: 'chip-group',
    options: [
      '电影颗粒',
      '慢动作',
      '延时摄影',
      '分屏',
      '故障效果',
      '模拟噪点',
      '投影',
      '视觉拼贴',
      '运动模糊',
    ],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  interpolImageFirst: {
    type: 'image',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  interpolImageLast: {
    type: 'image',
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  cameraPreset: {
    label: '相机预设',
    type: 'chip-group',
    default: '',
    options: [
      '固定',
      '左平移',
      '右平移',
      '推进',
      '拉远',
      '升降台下',
      '升降台上',
      '车左移',
      '车右移',
      '俯仰下',
      '俯仰上',
    ],
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
}

// 相机预设选项
export const cameraPresetsOptions = [
  {
    value: 'FIXED',
    label: '固定',
  },
  {
    value: 'PAN_LEFT',
    label: '左平移',
  },
  {
    value: 'PAN_RIGHT',
    label: '右平移',
  },
  {
    value: 'PULL_OUT',
    label: '拉远',
  },
  {
    value: 'PUSH_IN',
    label: '推进',
  },
  {
    value: 'PEDESTAL_DOWN',
    label: '升降台下',
  },
  {
    value: 'PEDESTAL_UP',
    label: '升降台上',
  },
  {
    value: 'TRUCK_LEFT',
    label: '车左移',
  },
  {
    value: 'TRUCK_RIGHT',
    label: '车右移',
  },
  {
    value: 'TILT_DOWN',
    label: '俯仰下',
  },
  {
    value: 'TILT_UP',
    label: '俯仰上',
  },
]

// 用于视频插值的图像默认值
export const InterpolImageDefaults = {
  format: 'image/png',
  base64Image: '',
  purpose: '',
  ratio: '',
  width: 0,
  height: 0,
}

export interface InterpolImageI {
  format: string
  base64Image: string
  purpose: 'first' | 'last'
  ratio: string
  width: number
  height: number
}

// 为生成表单设置默认值
const generateFieldList: [keyof GenerateVideoFormFieldsI] = Object.keys(GenerateVideoFormFields) as [
  keyof GenerateVideoFormFieldsI
]
var formDataDefaults: any
generateFieldList.forEach((field) => {
  const fieldParams: GenerateFieldI1 | GenerateFieldStyleI | GenerateFieldSecondartStyleI =
    GenerateVideoFormFields[field]
  const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
  formDataDefaults = { ...formDataDefaults, [field]: defaultValue }
})
formDataDefaults.interpolImageFirst = { ...InterpolImageDefaults, purpose: 'first' }
formDataDefaults.interpolImageLast = { ...InterpolImageDefaults, purpose: 'last' }

interface CompositionFieldsI {
  motion: GenerateFieldI1
  framing: GenerateFieldI1
  ambiance: GenerateFieldI1
  effects: GenerateFieldI1
  angle: GenerateFieldI1
}
export interface VideoGenerationFieldsI {
  model: GenerateFieldI1
  settings: generalSettingsI
  advancedSettings: advancedSettingsI
  styleOptions: GenerateFieldStyleI
  subStyleOptions: GenerateFieldSecondartStyleI
  compositionOptions: CompositionFieldsI
  cameraPreset: GenerateFieldI1
  resetableFields: (keyof GenerateVideoFormFieldsI)[]
  fullPromptFields: (keyof GenerateVideoFormFieldsI)[]
  defaultValues: any
}

// 根据用途整理生成字段
export const videoGenerationUtils: VideoGenerationFieldsI = {
  model: GenerateVideoFormFields.modelVersion,
  settings: {
    aspectRatio: GenerateVideoFormFields.aspectRatio,
    resolution: GenerateVideoFormFields.resolution,
    durationSeconds: GenerateVideoFormFields.durationSeconds,
    sampleCount: GenerateVideoFormFields.sampleCount,
  },
  advancedSettings: {
    personGeneration: GenerateVideoFormFields.personGeneration,
  },
  styleOptions: GenerateVideoFormFields.style,
  subStyleOptions: GenerateVideoFormFields.secondary_style,
  compositionOptions: {
    ambiance: GenerateVideoFormFields.ambiance,
    effects: GenerateVideoFormFields.effects,
    framing: GenerateVideoFormFields.framing,
    motion: GenerateVideoFormFields.motion,
    angle: GenerateVideoFormFields.angle,
  },
  cameraPreset: GenerateVideoFormFields.cameraPreset,
  resetableFields: generateFieldList.filter((field) => GenerateVideoFormFields[field].isDataResetable == true),
  fullPromptFields: generateFieldList.filter(
    (field) => GenerateVideoFormFields[field].isFullPromptAdditionalField == true
  ),
  defaultValues: formDataDefaults,
}

// TODO 临时 - 在 Veo 3 完全发布后移除
export const tempVeo3specificSettings = {
  sampleCount: {
    label: '输出数量',
    type: 'chip-group',
    default: '1',
    options: ['1'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  aspectRatio: {
    label: '宽高比',
    type: 'chip-group',
    default: '16:9',
    options: ['16:9'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  durationSeconds: {
    label: '视频时长（秒）',
    type: 'chip-group',
    default: '8',
    options: ['8'],
    isDataResetable: true,
    isFullPromptAdditionalField: false,
  },
  resolution: {
    label: '分辨率',
    type: 'chip-group',
    default: '1080p',
    options: ['720p', '1080p'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
}

// 生成表单字段接口
export interface GenerateVideoFormI {
  prompt: string
  modelVersion: string
  isVideoWithAudio: boolean
  sampleCount: string
  negativePrompt: string
  seedNumber: string
  aspectRatio: string
  durationSeconds: string
  resolution: string
  personGeneration: string
  style: string
  secondary_style: string
  motion: string
  effects: string
  composition: string
  angle: string
  ambiance: string
  interpolImageFirst: InterpolImageI
  interpolImageLast: InterpolImageI
  cameraPreset: string
}

// 视频生成后创建的视频对象接口
export interface VideoI {
  src: string
  gcsUri: string
  ratio: string
  resolution: string
  duration: number
  thumbnailGcsUri: string
  width: number
  height: number
  altText: string
  key: string
  format: string
  prompt: string
  date: string
  author: string
  modelVersion: string
  mode: string
}

// 成功发起请求时的返回接口
export interface GenerateVideoInitiationResult {
  operationName: string
  prompt: string
}

// 错误返回接口
export interface ErrorResult {
  error: string
}

// 用于轮询的接口定义
export interface VideoSample {
  video: { uri: string; encoding: string }
}
export interface PollingSuccessResponse {
  '@type': string
  generatedSamples: VideoSample[]
}
export interface PollingResponse {
  name: string
  done: boolean
  error?: { code: number; message: string; details: any[] }
  response?: {
    raiMediaFilteredReasons: boolean
    '@type': string
    videos?: VideoSample[]
  }
}

export interface VideoGenerationStatusResult {
  done: boolean
  name?: string
  videos?: VideoI[]
  error?: string
}

// Veo 在 GCS 中返回的结果对象接口
export interface VeoModelResultI {
  gcsUri: string
  mimeType: string
}

// 输入结构说明接口，用于增强类型安全
export interface BuildVideoListParams {
  videosInGCS: VeoModelResultI[]
  aspectRatio: string
  resolution: string
  duration: number
  width: number
  height: number
  usedPrompt: string
  userID: string
  modelVersion: string
  mode: string
}

// map 处理后在过滤前可能产生的输出类型
export type ProcessedVideoResult = VideoI | { warning: string } | { error: string }

// 轮询结果处理所需的元数据
export interface OperationMetadataI {
  formData: GenerateVideoFormI
  prompt: string
}

// 支持的宽高比与对应生成像素
export const VideoRatioToPixel = [
  { ratio: '9:16', width: 720, height: 1280 },
  { ratio: '16:9', width: 1280, height: 720 },
]

// 随机提示词列表（供用户在缺乏灵感时使用）
// Random prompt list the user can use if they lack prompt ideas
export const VideoRandomPrompts = [
  'A cinematic advertisement for a luxury watch. The video starts with an extreme close-up on the watch face, the second hand sweeping smoothly. The camera pulls back to reveal a man in a tailored suit dialing a vintage rotary phone in a moody, dimly lit office. The shallow depth of field and green neon light from the window create a mysterious, film noir atmosphere, associating the product with sophistication and intrigue.',
  'A tracking drone shot for a car commercial. A new model red convertible drives along the scenic coastal highways of California. The video is shot in a retro 1970s film style with warm sunlight, long shadows, and a slight film grain, evoking a sense of freedom, nostalgia, and classic cool. The focus is on the car’s sleek design and smooth handling on the open road.',
  'A cinematic for a narrative-driven video game. The shot is a POV from the driver\'s seat of a car moving through the rain-slicked, neon-lit streets of Tokyo at night. The mood is atmospheric and mysterious, setting the tone for a cyberpunk thriller. The windshield wipers swipe back and forth, momentarily clearing the view of the dense, futuristic cityscape.',
  'A scene from a horror movie trailer. The shot is over the shoulder of a young woman in the passenger seat of a car, looking nervously into the back seat. The scene is styled to look like a 1970s horror film, with heavy film grain and dark, ominous lighting. The car is driving down a deserted country road at night, building suspense and a sense of dread.',
  'A cinematic trailer for a detective video game. In a classic black and white, film noir style, a detective and a mysterious woman walk together on a foggy, rain-soaked street. The high-contrast lighting from a single streetlamp casts long shadows, creating an atmosphere of mystery and suspense as they discuss a case in hushed tones.',
  'An animated character reveal for a new family movie or video game. A cute creature with soft, white, snow leopard-like fur and big, expressive blue eyes playfully walks through a magical, sparkling winter forest. The animation is a high-quality 3D render with smooth, fluid movements and a whimsical, heartwarming style.',
  'An architectural fly-through video for a luxury real estate advertisement. The camera smoothly glides around a stunning, futuristic apartment building made of white concrete with flowing, organic shapes. The building is covered in lush greenery and integrated with advanced technology, showcasing a utopian vision of sustainable, high-end living.',
  'An opening cinematic for a sci-fi movie or game. An extreme close-up of a character\'s eye. Reflected in their shimmering iris is a vast, futuristic cityscape with flying vehicles and towering skyscrapers. The camera slowly pushes in on the eye, the reflection becoming clearer, building a sense of wonder and epic scale.',
  'An advertisement for a travel destination or surfwear brand. A wide, slow-motion cinematic shot of a surfer walking on a beautiful, secluded beach, carrying their surfboard. The sun is setting over the ocean, casting a warm, golden glow over the entire scene and creating a silhouette effect. The mood is peaceful, aspirational, and serene.',
  'A commercial for a pet food brand or animal shelter. A heartwarming, cinematic close-up of a young girl giggling as she holds an adorable, fluffy golden retriever puppy. They are in a park, and the scene is backlit by warm, bright sunlight, creating a soft, dreamy glow and emphasizing a moment of pure joy and connection.',
  'A scene from a dramatic indie film. A cinematic close-up of a sad woman riding a public bus at night as rain streaks down the window next to her. The scene is shot with cool, blue tones, and the reflection of blurred city lights plays across her melancholic face, perfectly capturing a mood of loneliness and introspection.',
  'An artistic brand video for a fashion or perfume company. A beautiful double exposure shot combines the silhouette of a woman walking gracefully with cinematic footage of a misty, enchanted forest and a serene lake at dawn. The effect is ethereal and dreamlike, connecting the brand to nature, beauty, and introspection.',
  'A high-fashion makeup or technology advertisement. A stunning close-up shot of a model’s face in a dark studio. Bright blue light and complex geometric patterns are projected onto her face, highlighting her features and the product. The camera slowly pans across her face, creating a futuristic, artistic, and visually arresting look.',
  'An opening title sequence for a TV series or film. The silhouette of a man in a long coat walks resolutely forward against a dynamic, fast-moving collage of international cityscapes at different times of day. The visual style is modern and graphic, suggesting a story involving global travel, espionage, or a character navigating a complex world.',
  'A music video or an ad for a cutting-edge tech brand. A dynamic, glitchy camera effect is used on a close-up of a woman’s face as she speaks or sings. The image flickers, distorts, and is saturated with vibrant neon colors and digital artifacts, creating a high-energy, futuristic, and cyberpunk aesthetic.',
]

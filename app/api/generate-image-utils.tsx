// 文件路径: app/api/generate-image-utils.ts (最终汉化修复版)

export interface GenerateFieldI1 {
 label?: string
 type?: string
 default?: string
 options?:
 | string[]
 | {
  value: string
  label: string
  indication?: string
  type?: string
  }[]
 isDataResetable: boolean
 isFullPromptAdditionalField: boolean
}
export interface GenerateFieldStyleI {
 type: string
 default: string
 defaultSub: string
 options: {
 value: string
 label: string
 subID: string
 }[]
 isDataResetable: boolean
 isFullPromptAdditionalField: boolean
}

export interface GenerateFieldSecondartStyleI {
 type: string
 options: {
 label: string
 subID: string
 type: string
 options: string[]
 default: string
 }[]
 isDataResetable: boolean
 isFullPromptAdditionalField: boolean
}

export interface GenerateImageFormFieldsI {
 prompt: GenerateFieldI1
 modelVersion: GenerateFieldI1
 sampleCount: GenerateFieldI1
 negativePrompt: GenerateFieldI1
 seedNumber: GenerateFieldI1
 aspectRatio: GenerateFieldI1
 personGeneration: GenerateFieldI1
 safetySetting: GenerateFieldI1
 outputOptions: GenerateFieldI1
 style: GenerateFieldStyleI
 secondary_style: GenerateFieldSecondartStyleI
 light: GenerateFieldI1
 light_coming_from: GenerateFieldI1
 shot_from: GenerateFieldI1
 perspective: GenerateFieldI1
 image_colors: GenerateFieldI1
 use_case: GenerateFieldI1
}

export const GenerateImageFormFields = {
 prompt: {
 type: 'textInput',
 isDataResetable: true,
 isFullPromptAdditionalField: false,
 },
 modelVersion: {
 type: 'select',
 default: 'imagen-4.0-generate-001',
 options: [
  {
  value: 'imagen-4.0-generate-001',
  label: 'Imagen 4',
  indication: '标准',
  },
  {
  value: 'imagen-4.0-ultra-generate-001',
  label: 'imagen 4 Ultra',
  indication: '专业',
  },
  {
  value: 'imagen-4.0-fast-generate-001',
  label: 'Imagen-4 Fast',
  indication: '快速',
  },
 ],
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
 label: '纵横比',
 type: 'chip-group',
 default: '16:9',
 options: ['1:1', '9:16', '16:9', '3:4', '4:3'],
 isDataResetable: false,
 isFullPromptAdditionalField: false,
 },
 personGeneration: {
 label: '人物生成',
 type: 'select',
 default: 'allow_all',
 options: [
  {
  value: 'dont_allow',
  label: '没有人',
  },
  {
  value: 'allow_adult',
  label: '仅限成人',
  },
  {
  value: 'allow_all',
  label: '成人和儿童',
  },
 ],
 isDataResetable: false,
 isFullPromptAdditionalField: false,
 },
 safetySetting: {
 label: '安全过滤级别',
 type: 'select',
 default: 'block_none',
 options: [
  {
   value: 'block_low_and_above',
   label: '最强',
  },
  {
   value: 'block_medium_and_above',
   label: '中等',
  },
  {
   value: 'block_only_high',
   label: '较弱',
  },
  {
   value: 'block_none',
   label: '无',
  },
 ],
 isDataResetable: false,
 isFullPromptAdditionalField: false,
 },
 outputOptions: {
 label: '输出格式',
 type: 'select',
 default: 'image/png',
 options: [
  {
  value: 'image/png',
  label: 'PNG',
  },
  {
  value: 'image/jpeg',
  label: 'JPEG',
  },
 ],
 isDataResetable: false,
 isFullPromptAdditionalField: false,
 },
 style: {
 type: 'select',
 default: 'photo',
 defaultSub: 'photographySub',
 options: [
  {
  value: 'photo',
  label: '摄影',
  subID: 'photographySub',
  },
  {
  value: 'drawing',
  label: '绘画',
  subID: 'drawingSub',
  },
  {
  value: 'painting',
  label: '油画',
  subID: 'paintingSub',
  },
  {
  value: 'computer digital creation',
  label: '数字艺术',
  subID: 'digitalSub',
  },
 ],
 isDataResetable: false,
 isFullPromptAdditionalField: false,
 },
 secondary_style: {
 type: 'controled-chip-group',
 options: [
  {
  label: '摄影风格',
  subID: 'photographySub',
  type: 'select',
  options: [
   '风景', '工作室', '肖像', '抓拍', '街头', '建筑', '野生动物', '新闻摄影', '时尚', '美食', '旅行', '美术', '宝丽来', '天文',
  ],
  default: '',
  },
  {
  label: '绘画风格',
  subID: 'drawingSub',
  type: 'select',
  options: [
   '技术铅笔', '彩色铅笔', '卡通', '漫画小说', '木炭', '粉彩', '墨水', '素描', '涂鸦',
  ],
  default: '',
  },
  {
  label: '油画风格',
  subID: 'paintingSub',
  type: 'select',
  options: [
   '水粉', '油彩', '水彩', '粉彩', '街头艺术', '印象派', '表现主义', '超现实主义', '抽象', '极简主义',
  ],
  default: '',
  },
  {
  label: '数字创作风格',
  subID: 'digitalSub',
  type: 'select',
  options: [
   '排版', '数字插画', '波普艺术', '赛博朋克海报', '像素艺术', '矢量艺术', '3D渲染', '视频游戏', '动画', '视觉效果', '动态图形',
  ],
  default: '',
  },
 ],
 isDataResetable: true,
 isFullPromptAdditionalField: false,
 },
 light: {
 label: '光照',
 type: 'chip-group',
 options: ['自然光', '明亮太阳光', '黄金时刻', '夜间', '戏剧性', '暖光', '冷光'],
 isDataResetable: true,
 isFullPromptAdditionalField: true,
 },
 light_coming_from: {
 label: '光源方向',
 type: 'chip-group',
 options: ['正面', '背面', '上方', '下方', '侧面'],
 isDataResetable: true,
 isFullPromptAdditionalField: true,
 },
 shot_from: {
 label: '视角',
 type: 'chip-group',
 options: ['正面', '背面', '上方', '下方', '侧面'],
 isDataResetable: true,
 isFullPromptAdditionalField: true,
 },
 perspective: {
 label: '透视',
 type: 'chip-group',
 options: ['微距', '特写', '标准', '广角', '超广角', '航拍'],
 isDataResetable: true,
 isFullPromptAdditionalField: true,
 },
 image_colors: {
 label: '色彩',
 type: 'chip-group',
 options: ['彩色', '明亮', '黑暗', '黑白', '复古', '电影颗粒感'],
 isDataResetable: true,
 isFullPromptAdditionalField: true,
 },
 use_case: {
 label: '特定用例',
 type: 'chip-group',
 options: [
  '食物, 昆虫, 植物 (静物)',
  '体育, 野生动物 (动态)',
  '天文, 风景 (广角)',
 ],
 isDataResetable: true,
 isFullPromptAdditionalField: false,
 },
 referenceObjects: {
 type: 'array',
 isDataResetable: true,
 },
}

export const referenceTypeField = {
 label: '参考类型',
 options: ['Person', 'Animal', 'Product', 'Style', 'Default'],
}
export const referenceTypeMatching = {
 Person: {
 referenceType: 'REFERENCE_TYPE_SUBJECT',
 subjectType: 'SUBJECT_TYPE_PERSON',
 },
 Animal: {
 referenceType: 'REFERENCE_TYPE_SUBJECT',
 subjectType: 'SUBJECT_TYPE_ANIMAL',
 },
 Product: {
 referenceType: 'REFERENCE_TYPE_SUBJECT',
 subjectType: 'SUBJECT_TYPE_PRODUCT',
 },
 Style: {
 referenceType: 'REFERENCE_TYPE_STYLE',
 subjectType: '',
 },
 Default: {
 referenceType: 'REFERENCE_TYPE_SUBJECT',
 subjectType: 'SUBJECT_TYPE_DEFAULT',
 },
}

export interface ReferenceObjectI {
 referenceType: string
 base64Image: string
 description: string
 ratio: string
 width: number
 height: number
 refId: number
 objectKey: string
 isAdditionalImage: boolean
}

export const ReferenceObjectDefaults = {
 referenceType: '',
 base64Image: '',
 description: '',
 ratio: '',
 width: 0,
 height: 0,
 isAdditionalImage: false,
 refId: 0,
 objectKey: '',
}

export const ReferenceObjectInit: ReferenceObjectI[] = [
 { ...ReferenceObjectDefaults, objectKey: Math.random().toString(36).substring(2, 15), refId: 1 },
]

export const maxReferences = 4

export interface GenerateImageFormI {
 prompt: string
 modelVersion: string
 sampleCount: string
 negativePrompt: string
 seedNumber: string
 aspectRatio: string
 personGeneration: string
 safetySetting: string
 outputOptions: string
 style: string
 secondary_style: string
 light: string
 light_coming_from: string
 shot_from: string
 perspective: string
 image_colors: string
 use_case: string
 referenceObjects: ReferenceObjectI[]
}

var formDataDefaults: any
const generateFieldList: (keyof GenerateImageFormFieldsI)[] = Object.keys(GenerateImageFormFields) as (
 keyof GenerateImageFormFieldsI
)[]
generateFieldList.forEach((field) => {
 const fieldParams: GenerateFieldI1 | GenerateFieldStyleI | GenerateFieldSecondartStyleI =
 GenerateImageFormFields[field]
 const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
 formDataDefaults = { ...formDataDefaults, [field]: defaultValue }
})
formDataDefaults.referenceObjects = ReferenceObjectInit

export interface chipGroupFieldsI {
 label: string
 subID?: string
 default?: string | number
 options: string[]
}

export interface selectFieldsI {
 label?: string
 default: string
 options: {
 value: string
 label: string
 indication?: string
 }[]
}

export interface generalSettingsI {
 aspectRatio: chipGroupFieldsI
 resolution?: chipGroupFieldsI
 durationSeconds?: chipGroupFieldsI
 sampleCount: chipGroupFieldsI
}
export interface advancedSettingsI {
 personGeneration: selectFieldsI
 safetySetting?: selectFieldsI
 outputOptions?: selectFieldsI
}

interface CompositionFieldsI {
 light: GenerateFieldI1
 perspective: GenerateFieldI1
 image_colors: GenerateFieldI1
 use_case: GenerateFieldI1
 light_coming_from: GenerateFieldI1
 shot_from: GenerateFieldI1
}

export interface ImageGenerationFieldsI {
 model: GenerateFieldI1
 settings: generalSettingsI
 advancedSettings: advancedSettingsI
 styleOptions: GenerateFieldStyleI
 subStyleOptions: GenerateFieldSecondartStyleI
 compositionOptions: CompositionFieldsI
 resetableFields: (keyof GenerateImageFormFieldsI)[]
 fullPromptFields: (keyof GenerateImageFormFieldsI)[]
 defaultValues: any
}

export const imageGenerationUtils: ImageGenerationFieldsI = {
 model: GenerateImageFormFields.modelVersion,
 settings: {
 aspectRatio: GenerateImageFormFields.aspectRatio,
 sampleCount: GenerateImageFormFields.sampleCount,
 },
 advancedSettings: {
 personGeneration: GenerateImageFormFields.personGeneration,
 safetySetting: GenerateImageFormFields.safetySetting,
 outputOptions: GenerateImageFormFields.outputOptions,
 },
 styleOptions: GenerateImageFormFields.style,
 subStyleOptions: GenerateImageFormFields.secondary_style,
 compositionOptions: {
 light: GenerateImageFormFields.light,
 perspective: GenerateImageFormFields.perspective,
 image_colors: GenerateImageFormFields.image_colors,
 use_case: GenerateImageFormFields.use_case,
 light_coming_from: GenerateImageFormFields.light_coming_from,
 shot_from: GenerateImageFormFields.shot_from,
 },
 resetableFields: generateFieldList.filter((field) => GenerateImageFormFields[field].isDataResetable == true),
 fullPromptFields: generateFieldList.filter(
 (field) => GenerateImageFormFields[field].isFullPromptAdditionalField == true
 ),
 defaultValues: formDataDefaults,
}

export interface ImagenModelResultI {
 gcsUri?: string
 bytesBase64Encoded?: string
 mimeType: string
 prompt?: string
}

export interface ImageI {
 src: string
 gcsUri: string
 ratio: string
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

export const RatioToPixel = [
 { ratio: '1:1', width: 1024, height: 1024 },
 { ratio: '9:16', width: 768, height: 1408 },
 { ratio: '16:9', width: 1408, height: 768 },
 { ratio: '3:4', width: 896, height: 1280 },
 { ratio: '4:3', width: 1280, height: 896 },
]

export const ImageRandomPrompts = [
 'Sci-fi, cyberpunk, photorealistic character concept art of a void assassin, wearing a sleek, form-fitting stealth suit that bends light and a featureless black visor helmet, in a crouched pose on a skyscraper edge wielding two short, glowing energy daggers, lit by neon signs from below overlooking a futuristic city, stealthy, cinematic, sharp focus, negative prompt: painting, drawing, illustration, cartoon, anime, daylight, bright, deformed, disfigured, poorly drawn hands, blurry, aspect ratio 16:9',
 'Photorealistic, dark fantasy character concept art of an abyssal paladin, wearing ancient, barnacle-encrusted plate armor with bioluminescent coral growing on it, in a stance of standing guard in a sunken cathedral while wielding a trident that glows with faint blue light, dramatic underwater god rays, highly detailed, cinematic, 8k, negative prompt: painting, drawing, illustration, cartoon, anime, 3d render, deformed, disfigured, poorly drawn hands, blurry, low-resolution, aspect ratio 16:9.',
 'Cel-shaded, anime key visual style character concept art of a celestial scribe, an androgynous figure with wings made of pure starlight, wearing flowing white and gold silk robes, in a pose of magically writing in a floating ethereal tome with a phoenix feather quill, soft and divine lighting in a library made of clouds, ethereal, graceful, clean line art, negative prompt: photorealistic, realistic, photo, 3d render, messy, blurry, grainy, deformed hands, aspect ratio 16:9.',
 'An advertisement-style photograph, focusing on a close-up of rugged, waterproof hiking boots reflected in a clear puddle on a mountain trail. In the background, majestic, snow-capped mountains are visible under a dramatic, cloudy sky. The composition uses a low, dramatic angle to make the boots appear heroic. Lit with the crisp, cool light of early morning, creating high contrast and saturated earth tones. Shot on a 35mm lens at f/2.8 to keep both the boots and mountains in sharp focus, 8k, photorealistic, with hyperdetailed textures on the leather and water droplets.',
 'A candid lifestyle photograph for a clothing brand, featuring three women laughing together on a coastal bluff. The woman in the foreground is slightly out of focus, drawing the eye to the two subjects in the mid-ground who are wearing the brand\'s latest collection. The setting sun behind them creates a beautiful lens flare and a warm, golden-hour glow that highlights their hair. A wide aperture of f/1.8 creates a soft, dreamy bokeh effect in the background, enhancing the intimate and happy moment. The image emulates the warm, nostalgic feel of Portra 400 film, hyperdetailed, capturing a genuine moment of connection.',
 'A macro e-commerce photograph showcasing a person\'s hands sculpting a small, delicate bird from grey clay. One hand gently holds the figurine while the other uses a fine modeling tool to carve intricate feather details. The artist\'s hands are covered in a fine layer of clay dust, emphasizing the tactile nature of the craft. The shot is a tight close-up, using a 100mm macro lens at f/2.2 to create a very shallow depth of field, focusing intensely on the point of contact between the tool and the clay. The lighting is soft and directional, like light from a nearby window, highlighting the rich texture of the clay and the craftsmanship, for an online art supply store.',
 'A photorealistic 3D render for an e-commerce website, showcasing a white, fluffy teddy bear toy sleeping peacefully on the floor of a beautifully decorated baby\'s bedroom. The room is filled with soft, pastel-colored toy boxes and other toys scattered playfully around. The composition is a gentle, slightly high-angle shot. The scene is illuminated by soft, diffused light from a large window, creating a warm and inviting atmosphere. Rendered in 8k with hyperdetailed fur textures to emphasize the toy\'s softness and quality.',
 'A professional studio photograph for a high-end restaurant\'s advertising campaign, featuring perfectly golden french fries artfully arranged in a minimalist ceramic container. The fries are sprinkled with sea salt and a sprig of fresh rosemary. The background is a dark, textured slate surface. The lighting is dramatic and directional, using a single key light to create deep shadows and highlight the crispy texture of the fries, in the style of a premium food magazine. Shot with a 105mm macro lens at f/4, ensuring every detail is sharp, hyperdetailed, and appetizing.',
 'A close-up product photograph for an e-commerce store, showing the rich texture of a warm and fuzzy, colorful Peruvian poncho draped elegantly over a rustic wooden chair. The shot is taken during the day with bright, natural light flooding in from the side, making the vibrant colors pop. The composition is a tight, detailed shot focusing on the intricate weave and fabric. Shot on an 85mm lens at f/2.0 to create a soft focus on the background, emphasizing the poncho\'s quality and craftsmanship, hyperdetailed.',
 'An advertising product photograph of a premium dark chocolate bar resting on a cool, marble kitchen counter. One square is broken off, revealing a rich, glossy texture. A few cocoa beans and a single mint leaf are placed artfully beside it. The lighting is sophisticated and moody, with a soft key light highlighting the chocolate\'s sheen and creating elegant shadows. Shot with a 100mm macro lens at f/2.8 for a shallow depth of field, focusing on the brand\'s logo embossed on the chocolate, photorealistic, 8k.',
 'A studio e-commerce photograph of a modern, minimalist armchair with clean lines and a neutral-toned fabric. The chair is set against a seamless, dark grey background. The lighting is dramatic and sculptural, using a three-point lighting setup to define the chair\'s form and create a sense of high-end luxury. The composition is a clean, centered, three-quarter view. Shot on a 50mm lens at f/8 to ensure the entire product is in sharp focus, hyperdetailed, 4k.',
 'A charcoal drawing-style advertisement concept for a new, angular, and sporty electric sedan. The car is the central focus, depicted with sleek, dynamic lines, while the background features the blurred, abstract shapes of futuristic skyscrapers at dusk. The color palette is monochromatic with electric blue highlights on the car\'s headlights and trim. The composition is a low-angle shot to give the car a powerful and dominant presence, emphasizing innovation and style.',
 'A close-up advertising photograph for a men\'s fashion brand, featuring a man in all-white linen clothing sitting on a serene, sandy beach. The shot is tightly framed on his torso and the texture of the fabric. The lighting is the warm, soft glow of the golden hour, creating long shadows and a relaxed, luxurious mood. Shot on an 85mm lens at f/1.8, the background of gentle waves is beautifully blurred, focusing all attention on the clothing, photorealistic.',
 'A high-action advertising photograph capturing the peak moment of a winning touchdown in a professional football game. The shot uses a very fast shutter speed to freeze the motion of the running back crossing the goal line, with beads of sweat and flying turf visible. The camera is tracking the player\'s movement, creating a slight motion blur in the packed stadium background. The lighting is bright stadium floodlights, creating dramatic highlights and shadows. The colors are vibrant and saturated, emphasizing the energy of the moment, hyperdetailed, 8k.',
 'An advertisement photograph for a new camera, demonstrating its fast shutter speed and movement tracking capabilities. The subject is a majestic deer, frozen in mid-sprint as it runs through a dense, misty forest. Rays of sunlight pierce through the canopy, illuminating the scene. The deer is in perfect, sharp focus while the background shows a subtle motion blur, highlighting the camera\'s tracking technology. Shot with a 400mm telephoto lens, photorealistic, hyperdetailed.',
 'A digital cartoon-style concept art for an animated film or video game. A weathered, wooden mech robot, covered in blooming pink and white vines, stands peacefully in a field of tall, vibrant wildflowers. A small, bright bluebird is perched on its outstretched, gentle hand. In the background, a massive cliff with a cascading waterfall looms under a soft, partly cloudy sky. The style features warm colors, soft lines, and a whimsical, Ghibli-esque atmosphere.',
 'A single panel of concept art for an animated series, styled like a late 1990s comic book. An old, wise-looking dog and an adult man sit together on a grassy hill, looking out at a vibrant sunset. A speech bubble from the man reads, "The sun will rise again." The coloring is muted and atmospheric, with a slightly grainy texture, creating a nostalgic and poignant mood.',
 'An aerial shot for a fantasy RPG video game, depicting a mystical valley where a glowing, ethereal river flows impossibly upwards towards a floating mountain peak. The valley is filled with bioluminescent flora and ancient, moss-covered ruins. The art style is highly detailed and realistic, with epic, atmospheric lighting from the glowing river casting a magical blue and green light across the landscape, 4k, detailed rendering.',
 '4K concept art for a cyberpunk video game, depicting an urban jungle at night. The scene is a dense, multi-layered city with towering, neon-lit skyscrapers, holographic advertisements, and flying vehicles weaving through the canyons of buildings. The composition is a low-angle shot from a rain-slicked street, looking up to emphasize the grand, oppressive scale of the city. The color palette is dominated by electric blues, purples, and pinks, with intricate, detailed rendering of the architecture and technology.',
 'A digital render of a massive, modern skyscraper for a stylized video game. The architecture is grand and epic, with sleek, impossible geometry and glowing energy conduits running up its sides. The background is a beautiful, dramatic sunset with a vibrant orange and purple color palette. The style is clean and slightly cartoonish, similar to games like Overwatch, with an emphasis on bold shapes and colors, 8k.',
 'A cinematic movie still of a "real-life" dragon resting peacefully in a massive, open-air zoo enclosure designed to look like its natural habitat. The dragon, with iridescent scales and large, intelligent eyes, is curled up next to its unlikely companion, a small, fluffy sheep. The shot is a high-quality DSLR photo, framed as a medium shot to capture the relationship between the two creatures. The lighting is soft and naturalistic, as if from an overcast day, creating a serene and believable atmosphere, hyperdetailed, 8k.',
 'A cinematic photograph of the grand, stately entrance to a library, with the words "Central Library" carved into the weathered stone above massive oak doors. The shot is taken at a low angle to make the building feel imposing and historic. The lighting is dramatic, with late afternoon sun creating long shadows and highlighting the texture of the stone. This serves as a perfect establishing shot for a mystery or historical film, emulating the look of Kodak Vision3 500T film, 4k.',
 'A close-up, black and white movie still of a musician\'s fingers gracefully playing a vintage grand piano. The shot is tightly framed on the hands and the ivory keys, capturing the motion and emotion of the performance. The lighting is high-contrast and moody, reminiscent of film noir, with deep blacks and bright highlights. The image has a vintage film grain, shot on an 85mm lens at f/2.0 to create a shallow depth of field, focusing on the intricate details of the fingers and piano keys.',
 'A close-up shot from a dramatic film, set in a dimly lit jazz club. A soulful saxophone player, his face contorted in intense concentration, is pouring his heart into a solo. The lighting is a single, warm spotlight from above, illuminating the musician and the golden saxophone while the background fades into darkness where a small, captivated audience listens intently. The atmosphere is thick with emotion, shot on a 50mm lens at f/1.8 to create an intimate feel with a shallow depth of field, emulating a classic movie still, hyperdetailed.',
 'A 35mm portrait for a movie poster, featuring a woman as the main character. The lighting is a dramatic blue and grey duotone, creating a serious and mysterious mood. She is looking slightly off-camera with a determined expression. The composition is a medium close-up, and the image has a distinct, high-quality film grain, shot on a 50mm lens to give a natural, compelling perspective.',
]

export const imagenUltraSpecificSettings = {
 sampleCount: {
 label: 'Quantity of outputs',
 type: 'chip-group',
 default: '1',
 options: ['1'],
 isDataResetable: false,
 isFullPromptAdditionalField: false,
 },
}

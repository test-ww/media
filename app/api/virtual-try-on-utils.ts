import { chipGroupFieldsI, selectFieldsI } from './generate-image-utils';

// 保持您原有的接口定义
export interface VtoImageObjectI {
  base64Image: string;
  format: string;
  width: number;
  height: number;
  key: string;
}

export interface VirtualTryOnFormI {
  humanImage: VtoImageObjectI;
  garmentImages: VtoImageObjectI[];
  sampleCount: string;
  personGeneration: string;
  safetySetting: string;
  seedNumber: string;
  outputFormat: string;
  modelVersion: string;
}

const virtualTryOnFormFields: {
  sampleCount: chipGroupFieldsI;
  personGeneration: selectFieldsI;
  safetySetting: selectFieldsI;
  outputFormat: selectFieldsI;
  seedNumber: { label?: string; type: string; default: string; isDataResetable: boolean; };
  modelVersion: selectFieldsI;
} = {
  // --- 恢复 sampleCount 为正确的类型 ---
  sampleCount: {
    label: '输出数量',
    default: '1',
    options: ['1'], // 错误已修复：这里必须是 string[]
  },
  personGeneration: {
    label: '人物生成',
    default: 'allow_adult',
    options: [
      { value: 'allow_adult', label: '仅限成人' },
      { value: 'allow_all', label: '成人和儿童' },
      { value: 'dont_allow', label: '不允许人物' },
    ],
  },
  safetySetting: {
    label: '安全设置',
    default: 'block_only_high',
    options: [
      { value: 'block_low_and_above', label: '最强' },
      { value: 'block_medium_and_above', label: '中等' },
      { value: 'block_only_high', label: '较弱' },
      { value: 'block_none', label: '无' },
    ],
  },
  outputFormat: {
    label: '格式',
    default: 'image/png',
    options: [
      { value: 'image/png', label: 'PNG' },
      { value: 'image/jpeg', label: 'JPEG' },
    ],
  },
  seedNumber: {
    label: '种子数 (可选)',
    type: 'numberInput',
    default: '',
    isDataResetable: true,
  },
  // --- 在您已有的 modelVersion 字段中添加新选项 ---
  modelVersion: {
    label: '模型',
    default: 'virtual-try-on-preview-08-04', // 更新默认模型
    options: [
      { value: 'virtual-try-on-preview-08-04', label: 'Try-On' }
    ]
  },
};

export const VtoImageDefaults: VtoImageObjectI = {
  base64Image: '',
  format: '',
  width: 0,
  height: 0,
  key: '',
};

const formDataDefaults: VirtualTryOnFormI = {
  humanImage: { ...VtoImageDefaults, key: 'human' },
  garmentImages: [{ ...VtoImageDefaults, key: Math.random().toString(36).substring(2, 15) }],
  sampleCount: String(virtualTryOnFormFields.sampleCount.default ?? '1'),
  personGeneration: virtualTryOnFormFields.personGeneration.default ?? 'allow_adult',
  safetySetting: virtualTryOnFormFields.safetySetting.default ?? 'block_only_high',
  seedNumber: virtualTryOnFormFields.seedNumber.default ?? '',
  outputFormat: virtualTryOnFormFields.outputFormat.default ?? 'image/png',
  modelVersion: virtualTryOnFormFields.modelVersion.default, // 使用更新后的默认值
};

export const virtualTryOnFields = {
  fields: virtualTryOnFormFields,
  defaultValues: formDataDefaults,
};

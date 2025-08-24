// 文件路径: app/ui/ux-components/InputInterface.tsx (最终精确修复版)

import { advancedSettingsI, chipGroupFieldsI as ApiChipGroupFieldsI, generalSettingsI, selectFieldsI } from '../../api/generate-image-utils'

// [核心修复] 创建一个新的、更灵活的 chipGroupFieldsI 接口
export interface chipGroupFieldsI extends Omit<ApiChipGroupFieldsI, 'options'> {
  options: string[] | { value: string; label: string }[];
}

export interface FormTextInputI {
 name: string
 label: string
 control: any
 required: boolean
 rows: number
 promptIndication?: string
}

export interface FormDropdownInputI {
 name: string
 label: string
 control: any
 styleSize: string
 width: string
 setValue?: any
 field: selectFieldsI
 required: boolean
}

export interface FormChipGroupInputI {
 name: string
 label: string
 control: any
 width: string
 setValue?: any
  // [核心修复] 使用我们新定义的、更灵活的接口
 field?: chipGroupFieldsI
 required: boolean
 disabled?: boolean
}

export interface FormChipGroupMultipleInputI {
 name: string
 label: string
 control: any
 width: string
 setValue?: any
 options?: { value: string; label: string }[]
 required: boolean
}

export interface GenerateSettingsI {
 control: any
 setValue?: any
 generalSettingsFields: generalSettingsI
 advancedSettingsFields: advancedSettingsI
 warningMessage?: string
}

export interface FormInputRadioButtonI {
 label: string
 subLabel: string
 value: string
 currentSelectedValue: string
 enabled: boolean
}

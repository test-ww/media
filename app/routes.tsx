// 定义一个基础的、不包含状态的页面结构
const basePages = {
  GenerateImage: {
    name: 'AI 图像创作',
    description: '从文本或参考图出发，生成全新图像',
    href: '/generate?mode=image',
  },
  VirtualTryOn: {
    name: 'AI 虚拟试穿',
    description: '上传模特与服装，生成逼真试穿效果',
    href: '/try-on',
  },
  Edit: {
    name: 'AI 编辑图像',
    description: '对现有图像进行智能编辑、替换与变换',
    href: '/edit',
  },
  GenerateVideo: {
    name: 'AI 视频生成',
    description: '根据文本或图像，创作生动的动态视频',
    href: '/generate?mode=video',
  },
  Library: {
    name: '我的素材库',
    description: "浏览、管理并分享您的所有 AI 创作",
    href: '/library',
  },
};

// 定义一个类型，方便在其他地方使用
export type PagesConfig = typeof basePages & {
  [K in keyof typeof basePages]: { status: string }
};

/**
 * 这是一个在运行时被调用的函数。
 * 它会读取当前的环境变量，并动态地构建带有正确 'status' 的 pages 对象。
 * 这确保了我们总能获取到最新的功能开关状态。
 * @returns {PagesConfig} 包含所有页面及其当前状态的对象
 */
export function getPages(): PagesConfig {
  return {
    GenerateImage: {
      ...basePages.GenerateImage,
      status: 'true', // 总是开启
    },
    VirtualTryOn: {
      ...basePages.VirtualTryOn,
      status: process.env.NEXT_PUBLIC_VTO_ENABLED || 'false',
    },
    Edit: {
      ...basePages.Edit,
      status: process.env.NEXT_PUBLIC_EDIT_ENABLED || 'false',
    },
    GenerateVideo: {
      ...basePages.GenerateVideo,
      status: process.env.NEXT_PUBLIC_VEO_ENABLED || 'false',
    },
    Library: {
      ...basePages.Library,
      status: 'true', // 总是开启
    },
  };
}


export interface NavLink {
  id: string;
  type: 'link';
  name: string;
  description: string;
  href: string;
  status: 'true' | 'false';
}

export interface NavGroup {
  id: string;
  type: 'group';
  name: string;
  children: NavLink[];
}

export type NavItem = NavLink | NavGroup;

/**
 * 这是我们全新的、唯一的导航配置来源。
 * 它描述了左侧主导航栏的完整结构。
 */
export function getNavConfig(): NavItem[] {
  // 从环境变量中获取功能开关状态
  const vtoEnabled = process.env.NEXT_PUBLIC_VTO_ENABLED || 'false';
  const editEnabled = process.env.NEXT_PUBLIC_EDIT_ENABLED || 'false';
  const veoEnabled = process.env.NEXT_PUBLIC_VEO_ENABLED || 'false';

  return [
    {
      id: 'studio',
      type: 'group',
      name: '创作者工作室',
      children: [
        {
          id: 'GenerateImage',
          type: 'link',
          name: 'AI 图像创作',
          description: '从文本或参考图出发，生成全新图像',
          href: '/studio/generate?mode=image',
          status: 'true',
        },

        {
          id: 'VirtualTryOn',
          type: 'link',
          name: 'AI 虚拟试穿',
          description: '上传模特与服装，生成逼真试穿效果',
          href: '/studio/try-on',
          status: vtoEnabled as 'true' | 'false',
        },
        {
          id: 'Edit',
          type: 'link',
          name: 'AI 编辑图像',
          description: '对现有图像进行智能编辑、替换与变换',
          href: '/studio/edit',
          status: editEnabled as 'true' | 'false',
        },
        {
          id: 'GenerateVideo',
          type: 'link',
          name: 'AI 视频生成',
          description: '根据文本或图像，创作生动的动态视频',
          href: '/studio/generate?mode=video',
          status: veoEnabled as 'true' | 'false',
        },
        {
          id: 'Library',
          type: 'link',
          name: '我的素材库',
          description: '浏览、管理并分享您的所有 AI 创作',
          href: '/studio/library',
          status: 'true',
        },
        {
          id: 'Manual',
          type: 'link',
          name: '使用手册',
          description: '快速上手指南',
          href: '/studio/manual',
          status: 'true',
        },
      ],
    },
    {
      id: 'gemini',
      type: 'link',
      name: 'Gemini 实验室',
      description: '体验前沿的多模态 AI 模型',
      href: '/gemini',
      status: 'true', // 假设 Gemini 总是开启
    },
    {
      id: 'gallery',
      type: 'link',
      name: '作品展览馆',
      description: '探索由社区创作的公开精选作品',
      href: '/gallery',
      status: 'true', // 展览馆总是开启
    },
  ];
}

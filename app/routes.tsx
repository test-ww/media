// 文件路径: app/routes.ts (或您定义 pages 常量的文件)

export const pages = {
 GenerateImage: {
  name: 'AI 图像创作',
  description: '从文本或参考图出发，生成全新图像',
  href: '/generate?mode=image',
  status: 'true',
 },
 VirtualTryOn: {
  name: 'AI 虚拟试穿',
  description: '上传模特与服装，生成逼真试穿效果',
  href: '/try-on',
  status: process.env.NEXT_PUBLIC_VTO_ENABLED,
 },
 Edit: {
  name: 'AI 编辑图像',
  description: '对现有图像进行智能编辑、替换与变换',
  href: '/edit',
  status: process.env.NEXT_PUBLIC_EDIT_ENABLED,
 },
 GenerateVideo: {
  name: 'AI 视频生成',
  description: '根据文本或图像，创作生动的动态视频',
  href: '/generate?mode=video',
  status: process.env.NEXT_PUBLIC_VEO_ENABLED,
 },
 Library: {
  name: '我的素材库',
  description: "浏览、管理并分享您的所有 AI 创作",
  href: '/library',
  status: 'true',
 },
};

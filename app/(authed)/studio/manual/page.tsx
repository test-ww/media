export const dynamic = 'force-dynamic';
import React from 'react';
import Image from 'next/image';

// --- 配置区 ---
const SCREENSHOT_WIDTH = 1200;
const SCREENSHOT_HEIGHT = 800;
// --- 配置区结束 ---

export default function ManualPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-gray-900 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-100 border-b border-gray-700 pb-4">
          CloudPuppy 使用手册
        </h1>
        <p className="text-lg text-gray-300 mb-12">
          欢迎使用 CloudPuppy AI 创作平台。本手册将引导您快速掌握各项核心功能，开启您的创意之旅。
        </p>

        {/* --- 功能模块 1: AI 图像创作 --- */}
        <section className="mb-20">
          <h2 className="text-3xl font-semibold mb-4 text-blue-400 border-l-4 border-blue-400 pl-4">1. AI 图像创作</h2>
          <p className="text-base text-gray-300 mb-6">
            通过强大的 Imagen 模型，您可以将文字描述或参考图片转化为高质量的图像。我们针对行业预制了大量prompt，稍加修改可为您提供创作灵感。
          </p>
          <h3 className="text-xl font-medium mb-3 text-gray-200">操作步骤</h3>

          {/* --- FIX: 这里是修复的关键 --- */}
          {/* 1. 添加了开头的 <div className="..."> */}
          <div className="bg-gray-800 p-4 rounded-lg mb-8">
            <ul className="list-decimal list-inside space-y-2 text-gray-300">
              <li>在左侧导航栏点击 “AI 图像创作”。</li>
              <li>在输入框中详细描述您想生成的画面 (Prompt)。</li>
              <li>(灵感) 打开 Imagen 构建器 生成图片(可修改)。</li>
              <li>(可选) 上传一张图获取图片的所有元素，自动生成(prompt)。</li>
              <li>(可选) 上传一张或多张参考图，以影响构图、风格或颜色。</li>
              <li>在设置面板调整高级设置，如图像数量、格式、分辨率等。</li>
              <li>点击 “生成” 按钮，稍等片刻即可在右侧看到您的作品。</li>
              <li>作品生成后，也可进行编辑图片、视频生成(满意后导入库/下载本地即可)。</li>
            </ul>

            {/* REFINEMENT: 将长段提示优化为列表，更易读 */}
            <div className="mt-4 text-gray-400 text-sm border-t border-gray-700 pt-3">
              <p className="font-bold mb-2">模型提示:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li><strong>Imagen 4:</strong> 生成高质量、自然光感的图片。</li>
                <li><strong>Imagen 4 Fast:</strong> 在速度和质量之间提供较高对比度的平衡。</li>
                <li><strong>Imagen 4 Ultra:</strong> 以最高质量输出单张图片，适用于对视觉效果要求极高的场景。</li>
              </ul>
            </div>
          </div>
          {/*
          <h3 className="text-xl font-medium mb-4 text-gray-200">操作流程截图</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Image src="/examples/generate-step1.png" alt="图像创作截图1: 图片转 Prompt（可选）" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/generate-step3.png" alt="图像创作截图2: Imagen 构建器" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/generate-step2.png" alt="图像创作截图3: 调整设置" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/generate-step4.png" alt="图像创作截图4: 查看结果/编辑选项" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
          </div>
          */}
        </section>

        {/* --- 功能模块 2: AI 虚拟试穿 --- */}
        <section className="mb-20">
          <h2 className="text-3xl font-semibold mb-4 text-green-400 border-l-4 border-green-400 pl-4">2. AI 虚拟试穿</h2>
          <p className="text-base text-gray-300 mb-6">为电商、设计等行业提供高效的服装展示方案。上传模特图和服装图，即可生成逼真的试穿效果。</p>
          <h3 className="text-xl font-medium mb-3 text-gray-200">操作步骤</h3>
          <ul className="list-decimal list-inside space-y-2 mb-8 text-gray-300 bg-gray-800 p-4 rounded-lg">
            <li>在左侧导航栏点击 “AI 虚拟试穿”。</li>
            <li>在左侧区域上传一张清晰的模特图片。</li>
            <li>在右侧区域上传一张平铺的服装图片。</li>
            <li>点击 “生成试穿效果” 按钮，系统将自动完成匹配和渲染。</li>
            <li>在结果区域预览并下载您满意的图片（也可进行编辑图片稍加修改）。</li>
          </ul>
          {/*
          <h3 className="text-xl font-medium mb-4 text-gray-200">操作流程截图</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Image src="/examples/tryon-step1.png" alt="虚拟试穿截图1: 上传模特和服装图" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/tryon-step2.png" alt="虚拟试穿截图2: 查看试穿结果" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
          </div>
          */}
        </section>

        {/* --- 功能模块 3: AI 编辑图像 --- */}
        <section className="mb-20">
          <h2 className="text-3xl font-semibold mb-4 text-yellow-400 border-l-4 border-yellow-400 pl-4">3. AI 编辑图像</h2>
          <p className="text-base text-gray-300 mb-6">对现有图像进行精细化修改。无论是智能修复、移除对象、扩展画面 (Outpainting) 还是替换局部内容 (Inpainting)，都能轻松实现。</p>
          <h3 className="text-xl font-medium mb-3 text-gray-200">操作步骤</h3>
          <ul className="list-decimal list-inside space-y-2 mb-8 text-gray-300 bg-gray-800 p-4 rounded-lg">
            <li>在左侧导航栏点击 “AI 编辑图像”，或在任何图片预览下方点击编辑按钮。</li>
            <li>上传您需要编辑的图片。</li>
            <li>使用画笔工具在图片上涂抹您想修改的区域 (创建 Mask)。</li>
            <li>在输入框中描述您希望在该区域出现什么内容。</li>
            <li>点击 “应用编辑” 按钮，AI 将只在您选择的区域内进行重绘。</li>
          </ul>
          {/*
          <h3 className="text-xl font-medium mb-4 text-gray-200">操作流程截图</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Image src="/examples/edit-step1.png" alt="编辑图像截图1: 上传图片" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/edit-step2.png" alt="编辑图像截图2: 绘制Mask" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/edit-step3.png" alt="编辑图像截图3: 查看编辑结果" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
          </div>
          */}
        </section>

        {/* --- 功能模块 4: AI 视频生成 --- */}
        <section className="mb-20">
          <h2 className="text-3xl font-semibold mb-4 text-cyan-400 border-l-4 border-cyan-400 pl-4">4. AI 视频生成</h2>
          <p className="text-base text-gray-300 mb-6">利用 Google 顶尖的 Veo 模型，将您的静态图像或文字描述转化为生动流畅的高清短视频，为您的内容注入动态活力。</p>
          <h3 className="text-xl font-medium mb-3 text-gray-200">操作步骤</h3>
          <ul className="list-decimal list-inside space-y-2 mb-8 text-gray-300 bg-gray-800 p-4 rounded-lg">
            <li>在左侧导航栏点击 “AI 视频生成”，或在图片生成结果下方选择生成视频。</li>
            <li>选择模式：您可以从纯文本描述开始，或上传一张图片作为视频的开端。</li>
            <li>输入详细的视频内容和动态描述 (Prompt)。</li>
            <li>(灵感) 打开 veo 构建器 生成视频(可修改)。</li>
            <li>(可选) 上传一张图片或视频 获取所有元素，自动生成(prompt)。</li>
            <li>在设置面板调整视频时长、清晰度等参数。</li>
            <li>点击 “生成视频” 按钮，AI 将开始渲染您的视频。</li>
          </ul>
          {/*
          <h3 className="text-xl font-medium mb-4 text-gray-200">操作流程截图</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Image src="/examples/video-step1.png" alt="视频生成截图1: 选择模式和参数（可选）" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/video-step2.png" alt="视频生成截图2: 视频转 Prompt(可选)" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/video-step3.png" alt="视频生成截图3: veo 构建器（预制参数）" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
            <Image src="/examples/video-step4.png" alt="视频生成截图4: 查看结果/导入选项" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
          </div>
          */}
        </section>

        {/* --- 功能模块 5: 我的素材库 --- */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-4 text-purple-400 border-l-4 border-purple-400 pl-4">5. 我的素材库</h2>
          <p className="text-base text-gray-300 mb-6">您所有的创作都会被安全地保存在这里。方便您随时回顾、管理和再次使用。</p>
          <h3 className="text-xl font-medium mb-3 text-gray-200">核心功能</h3>
          <ul className="list-disc list-inside space-y-2 mb-8 text-gray-300 bg-gray-800 p-4 rounded-lg">
            <li><strong>浏览与筛选:</strong> 按创作时间、类型（图片/视频）或关键词快速找到您的素材。</li>
            <li><strong>下载与导出:</strong> 支持下载高清原图或导出带有元数据的版本。</li>
            <li><strong>再次创作:</strong> 可以直接从素材库中选择一张图片，跳转到“AI 编辑图像”功能进行二次创作。</li>
          </ul>
          {/*
          <h3 className="text-xl font-medium mb-4 text-gray-200">界面截图</h3>
          <div className="grid grid-cols-1">
            <Image src="/examples/library-view.png" alt="我的素材库界面截图" width={SCREENSHOT_WIDTH} height={SCREENSHOT_HEIGHT} className="rounded-lg shadow-lg border border-gray-700 w-full h-auto"/>
          </div>
          */}
        </section>

        {/* --- 页脚 --- */}
        <footer className="text-center mt-20 border-t border-gray-700 pt-6">
          <p className="text-gray-400">所有功能均构建于强大的 Google Cloud Platform (GCP) 之上。</p>
          <p className="text-sm text-gray-500 mt-2">遇到问题？请联系您的项目管理员。</p>
        </footer>
      </div>
    </div>
  );
}

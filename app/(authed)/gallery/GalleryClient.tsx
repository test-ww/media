'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // 导入 useRouter Hook
import type { SignedVideoAsset } from '@/app/api/gallery/action';
import './gallery.css';

export default function GalleryClient({ videos }: { videos: SignedVideoAsset[] }) {
  const [selectedVideo, setSelectedVideo] = useState<SignedVideoAsset | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const router = useRouter(); // 获取 router 实例

  const handleMouseEnter = (id: string) => {
    const videoElement = videoRefs.current.get(id);
    if (videoElement) videoElement.play().catch(console.error);
  };

  const handleMouseLeave = (id: string) => {
    const videoElement = videoRefs.current.get(id);
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  };

  // 创建智能跳转的函数
  const handleCreateWithPrompt = (prompt: string) => {
    // 对 prompt 进行 URL 编码，以防包含特殊字符
    const encodedPrompt = encodeURIComponent(prompt);
    // 跳转到视频生成页面，并通过 URL query 参数传递 prompt
    router.push(`/studio/generate?mode=video&prompt=${encodedPrompt}`);
  };

  return (
    <>
      <div className="masonry-container">
        {videos.map((video) => (
          <div
            key={video.id}
            className="masonry-item"
            onMouseEnter={() => handleMouseEnter(video.id)}
            onMouseLeave={() => handleMouseLeave(video.id)}
            onClick={() => setSelectedVideo(video)}
          >
            <video
              ref={(el) => { if (el) videoRefs.current.set(video.id, el); }}
              src={video.signedVideoUrl}
              poster={video.signedThumbnailUrl}
              muted loop playsInline preload="metadata"
            />
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="modal-backdrop" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-image-wrapper">
              <img src={selectedVideo.signedThumbnailUrl} alt={selectedVideo.title} />
            </div>
            <div className="modal-details">
              <h2>{selectedVideo.title}</h2>
              <p><strong>Prompt:</strong> {selectedVideo.prompt}</p>
              {/* 为按钮绑定新的点击事件 */}
              <button
                className="modal-button"
                onClick={() => handleCreateWithPrompt(selectedVideo.prompt)}
              >
                使用这个 Prompt 创作
              </button>
            </div>
            <button className="modal-close-button" onClick={() => setSelectedVideo(null)}>&times;</button>
          </div>
        </div>
      )}
    </>
  );
}

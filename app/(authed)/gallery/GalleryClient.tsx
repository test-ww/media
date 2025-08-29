'use client';

import { useState, useRef, useEffect } from 'react'; // 1. 导入 useEffect
import { useRouter } from 'next/navigation';
import type { SignedVideoAsset } from '@/app/api/gallery/action';
import './gallery.css';

export default function GalleryClient({ videos }: { videos: SignedVideoAsset[] }) {
  const [selectedVideo, setSelectedVideo] = useState<SignedVideoAsset | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const modalVideoRef = useRef<HTMLVideoElement>(null); // 2. 为模态框中的视频创建一个 ref
  const router = useRouter();

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

  const handleCreateWithPrompt = (prompt: string) => {
    const encodedPrompt = encodeURIComponent(prompt);
    router.push(`/studio/generate?mode=video&prompt=${encodedPrompt}`);
  };

  // 3. 使用 useEffect 来确保模态框视频在显示时自动播放
  useEffect(() => {
    if (selectedVideo && modalVideoRef.current) {
      modalVideoRef.current.play().catch(console.error);
    }
  }, [selectedVideo]); // 当 selectedVideo 变化时触发

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
            {/* 4. 将 <img> 替换为 <video> */}
            <div className="modal-video-wrapper">
              <video
                ref={modalVideoRef}
                src={selectedVideo.signedVideoUrl}
                poster={selectedVideo.signedThumbnailUrl}
                autoPlay // 自动播放
                loop     // 循环播放
                muted    // 自动播放通常需要静音
                controls // 显示播放控件，给用户控制权
                className="modal-video"
              />
            </div>
            <div className="modal-details">
              <h2>{selectedVideo.title}</h2>
              <p><strong>Prompt:</strong> {selectedVideo.prompt}</p>
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

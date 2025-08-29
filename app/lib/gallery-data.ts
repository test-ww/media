
export interface VideoAsset {
  id: string;
  title: string;
  prompt: string;
  videoFilename: string;      // 您在GCS中的视频文件名
  thumbnailFilename: string;  // 您在GCS中的封面图文件名
}

// 在这里定义您所有视频的元数据
export const galleryVideos: VideoAsset[] = [
  {
    id: 'vid-001',
    title: '宇航员与蝴蝶',
    prompt: '一名宇航员站在盛开的鲜花丛中，一只蝴蝶从他面前飞过，充满想象力的超现实场景。',
    videoFilename: 'astronaut.mp4',
    thumbnailFilename: 'astronaut-thumb.jpg',
  },
  {
    id: 'vid-002',
    title: '未来都市地铁',
    prompt: '一名穿着未来感赛车服的人坐在地铁上，窗外是赛博朋克风格的都市夜景。',
    videoFilename: 'cyberpunk-metro.mp4',
    thumbnailFilename: 'cyberpunk-metro-thumb.jpg',
  },
  {
    id: 'vid-003',
    title: '林中小屋',
    prompt: '阳光穿过树林，照亮一座温馨的木屋，周围有萤火虫飞舞。',
    videoFilename: 'forest-cabin.mp4',
    thumbnailFilename: 'forest-cabin-thumb.jpg',
  },
]

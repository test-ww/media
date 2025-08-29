
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
    title: '老猫头鹰',
    prompt: ' A follow shot of a wise old owl high in the air, peeking through the clouds in a moorsky above a forest. The wise old owl carefully circles a clearing looking around to the forestfloor. After a few moments, it dives down to a moonlit path and sits next to a badger. Audio:wings flapping, birdsong, loud and pleasant wind rustling and the sound of intermittentpleasant sounds buzzing, twigs snapping underfoot, croaking. A light orchestral score withwoodwinds throughout with a cheerful, optimistic rhythm, full of innocent curiosity.',
    videoFilename: '7.mp4',
    thumbnailFilename: '7.jpg',
  },
  {
    id: 'vid-002',
    title: '历史冒险背景',
    prompt: "A close up of spies exchanging information in a crowded train station with uniformedguards patrolling nearby 'The microfilm is in your ticket' he murmured pretending to check hiswatch 'They're watching the north exit' she warned casually adjusting her scarf 'Use theservice tunnel' Commuters rush past oblivious to the covert exchange happening amidannouncements of arrivals and departures",
    videoFilename: '8.mp4',
    thumbnailFilename: '8.jpg',
  },
  {
    id: 'vid-003',
    title: '间谍对接',
    prompt: "A close up of spies exchanging information in a crowded train station with uniformedguards patrolling nearby 'The microfilm is in your ticket' he murmured pretending to check hiswatch 'They're watching the north exit' she warned casually adjusting her scarf 'Use theservice tunnel' Commuters rush past oblivious to the covert exchange happening amidannouncements of arrivals and departures",
    videoFilename: '9.mp4',
    thumbnailFilename: '9.jpg',
  },
  {
    id: 'vid-004',
    title: '羽毛',
    prompt: " A delicate feather rests on a fence post. A gust of wind lifts it, sending it dancing overrooftops. lt floats and spins, finally caught in a spiderweb on a high balcony.",
    videoFilename: '10.mp4',
    thumbnailFilename: '10.jpg',
  },
  {
    id: 'vid-005',
    title: '未来城市',
    prompt: 'A fast-tracking shot through a futuristic city with buildings made from reflectiveorganic chrome. lt is daytime, rainbows, and an alien planet fills the sky. Camera zooms intorobotic bee working inside a reflective organic chrome',
    videoFilename: '11.mp4',
    thumbnailFilename: '11.jpg',
  },
  {
    id: 'vid-006',
    title: '纸船',
    prompt: 'A paper boat sets sail in a rain-filled gutter. lt navigates the current with unexpected grace. lt voyages into a storm drain, continuing its journey to unknown waters.',
    videoFilename: '12.mp4',
    thumbnailFilename: '12.jpg',
  },
  {
    id: 'vid-007',
    title: 'Output video',
    prompt: '',
    videoFilename: '13.mp4',
    thumbnailFilename: '13.jpg',
  },
  {
    id: 'vid-008',
    title: 'Output video',
    prompt: '',
    videoFilename: '14.mp4',
    thumbnailFilename: '14.jpg',
  },
  {
    id: 'vid-009',
    title: 'Output video',
    prompt: '',
    videoFilename: '15.mp4',
    thumbnailFilename: '15.jpg',
  },
  {
    id: 'vid-010',
    title: 'Output video',
    prompt: '',
    videoFilename: '16.mp4',
    thumbnailFilename: '16.jpg',
  },
]

import { Shard } from './types';

export const STORY_TEXTS = {
  intro: [
    "在这个喧嚣的城市里，我大概是那个最不合时宜的“小丑”。",
    "我常常觉得自己就像一块被遗忘在精美包装袋之外的小熊饼干...",
    "用尽全力想要在这个坚硬的世界里，保持着酥脆的口感和甜蜜的形状。"
  ],
  ending: [
    "看，天亮了。",
    "那些曾经让你碎掉的裂痕，现在变成了身上最闪耀的金线。",
    "我们不要感谢孤独，要感谢那个在黑暗中依然坚持寻找光亮的自己。",
    "你没有因为世界的冰冷而让自己变坏。",
    "因为你本质上，就是一块很好的、用料上乘的、散发着奶香的小熊饼干。",
    "早安，全世界最勇敢、最可爱的小熊饼干。"
  ]
};

export const INTERACTIVE_MESSAGES = [
  "抱抱你", "你做得很好", "我在呢", "要开心呀", 
  "温暖", "爱自己", "闪闪发光", "不孤单了", 
  "摸摸头", "最棒的你", "甜甜的", "早安"
];

// Precise SVG paths matching the Bear component's geometry
// Coordinates are relative to the specific part's "center" for easier drag handling, 
// but we will offset them correctly in the Bear component.
export const BEAR_SHARDS_DATA: Omit<Shard, 'x' | 'y' | 'rotation' | 'isLocked'>[] = [
  { 
    id: 1, // Left Ear (Circle r=25)
    targetX: -60, targetY: -70, width: 50, height: 50, 
    path: "M -25,0 A 25,25 0 1,1 25,0 A 25,25 0 1,1 -25,0 Z", 
    affirmation: "温柔的灵魂"
  },
  { 
    id: 2, // Right Ear (Circle r=25)
    targetX: 60, targetY: -70, width: 50, height: 50, 
    path: "M -25,0 A 25,25 0 1,1 25,0 A 25,25 0 1,1 -25,0 Z", 
    affirmation: "善良的心"
  },
  { 
    id: 3, // Face (Circle r=70) - Main head
    targetX: 0, targetY: -20, width: 140, height: 140, 
    path: "M -70,0 A 70,70 0 1,1 70,0 A 70,70 0 1,1 -70,0 Z", 
    affirmation: "努力的勇气"
  },
  { 
    id: 4, // Body (Torso path)
    targetX: 0, targetY: 70, width: 120, height: 80, 
    // Simplified torso shape relative to its center approx (0, 70 in bear space)
    path: "M -50,-30 Q -60,30 -30,40 L 30,40 Q 60,30 50,-30 Z", 
    affirmation: "坚韧的背影"
  },
  { 
    id: 5, // Left Hand/Paw (Ellipse)
    targetX: -60, targetY: 30, width: 40, height: 40, 
    path: "M -15,0 A 15,15 0 1,1 15,0 A 15,15 0 1,1 -15,0 Z", 
    affirmation: "温暖的手"
  },
  { 
    id: 6, // Right Hand/Paw (Ellipse)
    targetX: 60, targetY: 30, width: 40, height: 40, 
    path: "M -15,0 A 15,15 0 1,1 15,0 A 15,15 0 1,1 -15,0 Z", 
    affirmation: "给予的力量"
  }
];
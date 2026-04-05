/** Mock 配置：阶段、成就、激励文案、称号体系 */

export const defaultUserProfile = {
  name: 'William',
  role: 'Founder & CEO',
  timezone: 'Asia/Shanghai',
  programStart: null,
};

export const STAGES = [
  {
    id: 1,
    key: 'output-habit',
    title: '阶段 1 · 建立输出习惯',
    weeksRange: [1, 4],
    summary: '敢开口、基础商务表达、自我介绍与简单会议表达。',
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 2,
    key: 'meeting-mgmt',
    title: '阶段 2 · 会议与管理沟通',
    weeksRange: [5, 10],
    summary: '主持会议、布置任务、催进度、反馈与 1:1。',
    color: 'from-zinc-700 to-neutral-900',
  },
  {
    id: 3,
    key: 'biz-negotiation',
    title: '阶段 3 · 商务洽谈与合作',
    weeksRange: [11, 18],
    summary: '价格与条件、异议、冲突处理与基础谈判。',
    color: 'from-stone-700 to-stone-900',
  },
  {
    id: 4,
    key: 'leadership-global',
    title: '阶段 4 · 领导力与全球化表达',
    weeksRange: [19, 24],
    summary: '战略、愿景、英文汇报与跨文化自然沟通。',
    color: 'from-neutral-800 to-ink-950',
  },
];

export const FOUNDER_SLOGANS = [
  'Clarity beats charisma when you lead across borders.',
  'Your next deal starts with the sentence you rehearse today.',
  'Global leadership is trained in daily reps, not overnight fluency.',
  'Speak like the operator you are — precise, calm, decisive.',
];

export const MOTIVATION_MESSAGES = [
  '你今天训练的不是英语，而是全球领导力。',
  '每一次清晰表达，都会转化成未来的商业影响力。',
  '国际化不是等准备好了才开始，而是在开口中逐渐建立。',
  '你的表达能力，正在追上你的商业判断力。',
  '一个创始人的全球化能力，往往从语言边界被打破开始。',
  '今天你又向全球化沟通迈进了一步。',
  '优秀的创始人不是天生会说，而是持续训练表达。',
  '你今天完成的不只是学习，而是在建立国际领导力。',
  '每一次开口，都是未来谈判桌上的底气。',
  '你今天训练的不是英语，而是可迁移的领导力资产。',
  '把复杂讲清楚，是创始人最贵的稀缺能力。',
  '你在做的，是把商业判断翻译成他人能执行的语言。',
];

export const CHECKIN_MODAL_MESSAGES = [
  '今天你又向全球化沟通迈进了一步。',
  '优秀的创始人不是天生会说，而是持续训练表达。',
  '你今天完成的不只是学习，而是在建立国际领导力。',
  '每一次开口，都是未来谈判桌上的底气。',
  '你在压缩「想法 → 英语 → 行动」的延迟，这就是壁垒。',
];

export const ACHIEVEMENT_DEFS = [
  { id: 'first_checkin', title: '第一次打卡', desc: '完成首日打卡', icon: '◆' },
  { id: 'streak_3', title: '连续 3 天', desc: '坚持三天输出训练', icon: '▲' },
  { id: 'streak_7', title: '连续 7 天', desc: '一周不断档', icon: '✦' },
  { id: 'streak_14', title: '连续 14 天', desc: '两周稳定节奏', icon: '◇' },
  { id: 'streak_30', title: '连续 30 天', desc: '月度执行力', icon: '■' },
  { id: 'week_complete_first', title: '首周收官', desc: '第一次完整完成一周每日任务', icon: '◎' },
  { id: 'module_negotiation', title: '谈判模块解锁', desc: '完成阶段 3 任一周全部打卡', icon: '⚡' },
  { id: 'module_leadership', title: '领导力模块解锁', desc: '进入阶段 4 并完成任一日打卡', icon: '⬡' },
];

/** 连续打卡对应的称号（展示用） */
export const STREAK_TITLES = [
  { minDays: 90, title: 'Founder Communicator', en: 'Built for global rooms.' },
  { minDays: 60, title: '商务谈判执行者', en: 'Terms, trade-offs, and calm closure.' },
  { minDays: 30, title: '全球沟通进阶者', en: 'You show up consistently across time zones.' },
  { minDays: 14, title: '会议掌控者', en: 'Agenda, alignment, next steps.' },
  { minDays: 7, title: '商务表达练习者', en: 'Output habit is forming.' },
  { minDays: 3, title: '英语启动者', en: 'Momentum starts with day three.' },
];

export function getStreakTitle(streak) {
  for (const row of STREAK_TITLES) {
    if (streak >= row.minDays) return row;
  }
  return { minDays: 0, title: '创始训练生', en: 'Build the habit first.' };
}

export function stageForWeek(weekNum) {
  return STAGES.find((s) => weekNum >= s.weeksRange[0] && weekNum <= s.weeksRange[1]) || STAGES[0];
}

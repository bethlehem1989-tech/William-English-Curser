import { weeks1to4Detailed } from './curriculumDetailed.js';
import { phase1Week3, phase1Week4 } from './phase1Week34.js';
import { stageForWeek } from './appData.js';

const S = (en, zh) => ({ en, zh });
const D = (speaker, en, zh) => ({ speaker, en, zh });

function weeksPhase1Fixed() {
  const w = [...weeks1to4Detailed];
  w[2] = phase1Week3;
  w[3] = phase1Week4;
  return w;
}

/** 第 5–24 周：完整周目标 + 生成式每日内容（含示例日强化） */
const WEEKS_EXTENDED_META = [
  { w: 5, goal: '站会与项目节奏：让英文成为推进工具，而不是报告装饰。', focus: '节奏、依赖、风险透明、行动项。', themes: 'Standup / RAID / milestone / stakeholder update', ceo: '本周 CEO 表达重点：用英文把「谁、何时、产出」说死。', review: '列出你本周 5 个最常重复的英文动词（ship / block / align…）。' },
  { w: 6, goal: '跨部门推进：产品、运营、法务、财务接口英语。', focus: '接口人、边界、文档、决策邮件。', themes: 'cross-functional / RACI / approval / legal review', ceo: '本周 CEO 表达重点：减少「口头同意、书面扯皮」。', review: '写一封跨部门决策邮件模板（可复制）。' },
  { w: 7, goal: '客户成功与售后语言：稳住关系与预期。', focus: 'expectation / SLA / workaround / escalation', themes: 'CS / retention / churn risk / playbook', ceo: '本周 CEO 表达重点：先稳情绪，再给路径。', review: '总结 3 句英文「安抚 + 方案」。' },
  { w: 8, goal: '招聘与面试英语：描述岗位、文化、判断候选人。', focus: 'role scope / bar / culture fit / compensation framing', themes: 'hiring / interview / reference / offer', ceo: '本周 CEO 表达重点：用英文定义「我们要什么样的人」。', review: '录一段 90 秒「公司卖点」英文介绍给候选人。' },
  { w: 9, goal: '绩效与目标设定：OKR、优先级、复盘语言。', focus: 'OKR / KPI / quarterly goals / calibration', themes: 'goal setting / review / promotion / feedback loop', ceo: '本周 CEO 表达重点：英文里也要「可衡量」。', review: '用英文写你下个季度的 3 个目标 + 衡量方式。' },
  { w: 10, goal: '阶段 2 总复盘：会议 + 管理 + 异步沟通合一。', focus: '整合复盘、模板化、减少临场造句压力。', themes: 'exec communication system', ceo: '本周 CEO 表达重点：把你的英文沟通「产品化」。', review: '整理个人「英文会议包」：开场/追问/收尾各 5 句。' },
  { w: 11, goal: '条款谈判进阶：保修、责任上限、知识产权、数据。', focus: 'liability / indemnity / IP / data handling', themes: 'contract depth / risk allocation', ceo: '本周 CEO 表达重点：不怕慢，怕含糊。', review: '用中文+英文对照列你关心的 5 个条款点。' },
  { w: 12, goal: '价格结构：折扣、返利、市场基金、量价挂钩。', focus: 'margin stack / MDF / co-op / rebates', themes: 'pricing architecture / trade spend', ceo: '本周 CEO 表达重点：把「价」讲成「结构」。', review: '画一张英文能讲清楚的定价结构草图（口头讲）。' },
  { w: 13, goal: '渠道冲突与区域划分：排他、竞对、线上线下。', focus: 'territory / channel conflict / grey market', themes: 'distribution ethics / policy', ceo: '本周 CEO 表达重点：规则先行，情绪靠后。', review: '写一段英文 policy 口径（非法律稿）。' },
  { w: 14, goal: '联合商业计划 JBP：目标、资源、衡量与复盘。', focus: 'JBP / joint targets / sell-through plan', themes: 'account planning / QBR', ceo: '本周 CEO 表达重点：把伙伴关系做成经营计划。', review: '用英文列一个 JBP 目录（10 条以内）。' },
  { w: 15, goal: '大客户关键对话：多利益相关方、采购、法务同时出现。', focus: 'stakeholder mapping / procurement / legal loops', themes: 'enterprise sale / complexity', ceo: '本周 CEO 表达重点：识别「真正的 veto」。', review: '复盘一次多角色会议：谁在乎什么（英文要点）。' },
  { w: 16, goal: '合同谈判模拟强化：让步表、底线、交换条件。', focus: 'concession sheet / walk-away / trade', themes: 'negotiation discipline', ceo: '本周 CEO 表达重点：每个让步都要换回东西。', review: '做一张让步-交换对照表（英文关键词）。' },
  { w: 17, goal: '国际展会与路演：高密度社交 + 快速筛选合作。', focus: 'elevator / booth talk / follow-up', themes: 'events / pipeline', ceo: '本周 CEO 表达重点：30 秒决定值不值得深聊。', review: '准备 10 个展会高频问答英文。' },
  { w: 18, goal: '阶段 3 总复盘：谈判与条款语感固化。', focus: '条款口述、邮件确认、常见异议库', themes: 'negotiation system', ceo: '本周 CEO 表达重点：把谈判英语变成「可复用资产」。', review: '整理「异议 → 回应」英文小抄 15 条。' },
  { w: 19, goal: '战略叙事升级：讲清「不做什么」与资源投向。', focus: 'strategy story / capital allocation / portfolio', themes: 'leadership narrative', ceo: '本周 CEO 表达重点：战略是选择，英语要说清代价。', review: '录 3 分钟英文战略演讲（手机即可）。' },
  { w: 20, goal: '组织设计与变革沟通：架构调整、角色变化、节奏。', focus: 'reorg / role change / comms plan', themes: 'change management', ceo: '本周 CEO 表达重点：减少不确定性就是领导力。', review: '写一封 reorg 说明邮件提纲（英文）。' },
  { w: 21, goal: '英文董事会 / 顾问沟通：信息密度与克制。', focus: 'board pack / risks / asks / appendix', themes: 'governance communication', ceo: '本周 CEO 表达重点：少故事多结构，多风险少惊喜。', review: '用 headline/evidence/ask 写一份 1 页英文提纲。' },
  { w: 22, goal: '品牌与公关口径：对外一致表达、危机边界。', focus: 'messaging / spokesperson / Q&A', themes: 'PR / brand / crisis boundary', ceo: '本周 CEO 表达重点：一句话口径全公司能复述。', review: '写 5 条英文 key messages。' },
  { w: 23, goal: '跨文化团队领导：远程信任、结果导向、边界。', focus: 'remote trust / output / boundaries / inclusion', themes: 'global team leadership', ceo: '本周 CEO 表达重点：规则写下来，善意说出来。', review: '制定 5 条英文 team norms（你团队版）。' },
  { w: 24, goal: '毕业整合：从会议到谈判到战略，一条龙演练。', focus: 'integrated simulation / founder presence', themes: 'capstone', ceo: '本周 CEO 表达重点：像对外一样对内，像对内一样对外。', review: '完成一次 15 分钟英文 capstone 角色扮演并自评。' },
];

function buildSyntheticDay(weekNum, meta, dayInWeek, phaseId) {
  const themePool = meta.themes.split(' / ');
  const pick = themePool[(dayInWeek + weekNum) % themePool.length];
  const themeZh = `第 ${weekNum} 周 · 第 ${dayInWeek} 天：${pick}`;
  const themeEn = `Week ${weekNum} · Day ${dayInWeek} — ${pick}`;

  const shadowing = [
    S(`This week our focus is: ${meta.focus.split('、')[0] || meta.focus}.`, `本周焦点：${meta.focus.split('、')[0] || meta.focus}。`),
    S('Let me be explicit about what success looks like.', '我把成功标准说清楚。'),
    S('Here is the constraint we cannot ignore.', '这是不能忽略的约束。'),
    S('If we align today, we can move fast tomorrow.', '若今天对齐，明天就能快。'),
    S('I want clarity, not perfect English.', '我要清晰，不是完美英语。'),
    S('Let’s document decisions to prevent drift.', '记录决策避免走样。'),
    S('I will follow up in writing with owners and dates.', '我会书面跟进负责人与日期。'),
  ];

  const expressions = [
    S('Let me frame the problem in one sentence.', '让我用一句话定调问题。'),
    S('From a business perspective, the trade-off is clear.', '从业务视角，权衡很清楚。'),
    S('I need a decision today on X.', '今天需要对 X 决策。'),
    S('What would you need to say yes?', '你需要什么才能同意？'),
    S('If we delay, the cost is Y.', '若延迟，成本是 Y。'),
    S('I propose we pilot before we scale.', '建议先试点再放大。'),
    S('Let’s align on the next milestone.', '对齐下一个里程碑。'),
    S('I appreciate the partnership — let’s stay practical.', '感谢合作——保持务实。'),
  ];

  const vocabulary = [
    S('alignment', '对齐'),
    S('milestone', '里程碑'),
    S('trade-off', '权衡'),
    S('constraint', '约束'),
    S('pilot', '试点'),
    S('stakeholder', '相关方'),
    S('execution', '执行'),
    S('cadence', '节奏'),
  ];

  const dialogue = [
    D('Colleague', `What's the priority for week ${weekNum}?`, `第 ${weekNum} 周优先级是什么？`),
    D('You', `${meta.goal.slice(0, 60)}...`, `${meta.goal.slice(0, 40)}…`),
    D('Colleague', 'What do you need from me?', '你需要我做什么？'),
    D('You', 'A clear yes/no and a written summary after the call.', '明确的是否同意，以及会后书面摘要。'),
  ];

  const speakingTask = {
    titleZh: `角色扮演：第 ${weekNum} 周主题口语`,
    brief: `围绕「${meta.themes}」用 2 分钟英文说明现状、风险、建议、需要对方什么。`,
    prompts: ['30 秒现状', '30 秒风险', '30 秒建议', '30 秒请求'],
  };

  const simulation = {
    titleZh: `模拟：${phaseId === 2 ? '管理' : phaseId === 3 ? '谈判' : '战略'}场景强化`,
    context: meta.ceo,
    objectives: [
      '保持冷静语速',
      '用短句',
      '每个观点给一个例子或数字（可用假设）',
    ],
  };

  const reflectionQuestions = [
    `今天与第 ${weekNum} 周目标最相关的一句英文是什么？`,
    '哪一句你说起来最卡？把它改写成更短的版本。',
    '明天你要把哪条表达用到真实工作里？',
  ];

  const oralTaskZh = `跟读今日 7 句 + 自选 3 句替换为你的业务词；录音 1 遍。`;

  const focusLines = [
    'Let me frame this clearly.',
    'Here is what I need from you.',
    'Let’s align on next steps.',
    'I want to be direct and respectful.',
    'We are optimizing for long-term partnership.',
  ];
  const todayFocus = focusLines[(weekNum + dayInWeek) % focusLines.length];

  return {
    dayInWeek,
    themeZh,
    themeEn,
    todayFocus,
    shadowing,
    expressions,
    vocabulary,
    dialogue,
    speakingTask,
    simulation,
    reflectionQuestions,
    oralTaskZh,
    _synthetic: true,
    _weekMetaLine: meta.goal,
  };
}

function buildWeekFromMeta(weekNum) {
  const meta = WEEKS_EXTENDED_META[weekNum - 5];
  if (!meta) return null;
  const stage = stageForWeek(weekNum);
  const days = Array.from({ length: 7 }, (_, i) =>
    buildSyntheticDay(weekNum, meta, i + 1, stage.id)
  );
  if (days[0]) {
    days[0].shadowing = [
      S('This is a sample day with full structure — use it as your anchor for the week.', '这是本周「示例日」：结构完整，建议当作锚点反复练。'),
      ...days[0].shadowing.slice(1),
    ];
    days[0].expressions = [
      S(`Week ${weekNum} headline: ${meta.goal}`, `第 ${weekNum} 周主线：${meta.goal}`),
      ...days[0].expressions.slice(1),
    ];
  }
  return {
    weekNumber: weekNum,
    weeklyGoal: meta.goal,
    focusAbility: meta.focus,
    themes: meta.themes,
    weeklyReviewTask: meta.review,
    ceoWeeklyFocus: meta.ceo,
    days,
  };
}

export function getAllWeeks() {
  const rest = [];
  for (let w = 5; w <= 24; w += 1) {
    rest.push(buildWeekFromMeta(w));
  }
  return [...weeksPhase1Fixed(), ...rest];
}

export const ALL_WEEKS = getAllWeeks();

export function lessonForProgramDay(programDayIndex) {
  const weekIdx = Math.floor(programDayIndex / 7);
  const dayInWeek = (programDayIndex % 7) + 1;
  const cappedWeekIdx = Math.min(Math.max(weekIdx, 0), ALL_WEEKS.length - 1);
  const week = ALL_WEEKS[cappedWeekIdx];
  const lesson = week.days.find((d) => d.dayInWeek === dayInWeek) || week.days[0];
  return { week, lesson, weekNumber: week.weekNumber, dayInWeek, programDayIndex };
}

export function weekByNumber(n) {
  return ALL_WEEKS.find((w) => w.weekNumber === n) || ALL_WEEKS[0];
}

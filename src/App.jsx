import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ACHIEVEMENT_DEFS,
  CHECKIN_MODAL_MESSAGES,
  FOUNDER_SLOGANS,
  MOTIVATION_MESSAGES,
  defaultUserProfile,
  getStreakTitle,
  stageForWeek,
} from './appData.js';
import { ALL_WEEKS, lessonForProgramDay } from './curriculumData.js';
import { MATERIAL_CATEGORIES } from './materialsLibrary.js';

const LS_USER = 'fe_user_v1';
const LS_CHECKINS = 'fe_checkins_v1';
const LS_TASKS = 'fe_tasks_v1';
const LS_REFLECTION = 'fe_reflection_v1';
const LS_ACHIEVEMENTS = 'fe_achievements_v1';
const LS_MODE = 'fe_mode_v1';
const LS_REVIEW = 'fe_last_review_week_v1';

const TASK_IDS = [
  { id: 'shadowing', label: '跟读训练 Shadowing', sub: '发音节奏 · 商务句型' },
  { id: 'expressions', label: '关键表达 Expressions', sub: '句型 + 中文释义' },
  { id: 'speaking', label: '情景口语 Speaking', sub: '角色扮演任务' },
  { id: 'simulation', label: '管理/谈判模拟 Simulation', sub: '高仿真场景' },
  { id: 'reflection_task', label: '复盘 Reflection', sub: '三个复盘问题' },
];

function formatDateKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function getProgramDayIndex(startStr, today = new Date()) {
  const s = startOfDay(new Date(startStr));
  const t = startOfDay(today);
  return Math.max(0, Math.floor((t - s) / 86400000));
}

const MAX_PROGRAM_DAY = 24 * 7 - 1;

function clampProgramDay(i) {
  return Math.min(Math.max(i, 0), MAX_PROGRAM_DAY);
}

function streakDays(checkins) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let check = new Date(today);
  if (!checkins[formatDateKey(check)]) {
    check.setDate(check.getDate() - 1);
  }
  let c = 0;
  for (let guard = 0; guard < 400; guard += 1) {
    const k = formatDateKey(check);
    if (checkins[k]) {
      c += 1;
      check.setDate(check.getDate() - 1);
    } else break;
  }
  return c;
}

function weekCompletionCalendar(checkins) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  let done = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (checkins[formatDateKey(d)]) done += 1;
  }
  return Math.round((done / 7) * 100);
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function minutesForMode(mode) {
  if (mode === 60) return { shadowing: 12, expressions: 12, speaking: 15, simulation: 15, reflection: 6 };
  if (mode === 120) return { shadowing: 24, expressions: 24, speaking: 26, simulation: 26, reflection: 20 };
  return { shadowing: 18, expressions: 18, speaking: 20, simulation: 20, reflection: 14 };
}

function evaluateAchievements({ unlocked, checkins, streak, programDayIndex, allDone }) {
  const next = new Set(unlocked);
  const total = Object.keys(checkins).length;
  if (total >= 1) next.add('first_checkin');
  if (streak >= 3) next.add('streak_3');
  if (streak >= 7) next.add('streak_7');
  if (streak >= 14) next.add('streak_14');
  if (streak >= 30) next.add('streak_30');
  if (total >= 7) next.add('week_complete_first');
  const wn = Math.floor(programDayIndex / 7) + 1;
  if (wn >= 11 && wn <= 18 && allDone) next.add('module_negotiation');
  if (wn >= 19 && allDone) next.add('module_leadership');
  return [...next];
}

const NAV = [
  { id: 'dashboard', label: '首页', sub: 'Dashboard' },
  { id: 'lesson', label: '今日学习', sub: 'Today' },
  { id: 'plan', label: '学习计划', sub: '24 Weeks' },
  { id: 'materials', label: '教材库', sub: 'Library' },
  { id: 'rewards', label: '打卡激励', sub: 'Rewards' },
  { id: 'review', label: '周复盘', sub: 'Review' },
];

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(() => loadJson(LS_USER, { ...defaultUserProfile, programStart: null }));
  const [checkins, setCheckins] = useState(() => loadJson(LS_CHECKINS, {}));
  const [tasksByDate, setTasksByDate] = useState(() => loadJson(LS_TASKS, {}));
  const [reflectionByDate, setReflectionByDate] = useState(() => loadJson(LS_REFLECTION, {}));
  const [achievements, setAchievements] = useState(() => loadJson(LS_ACHIEVEMENTS, []));
  const [studyMode, setStudyMode] = useState(() => loadJson(LS_MODE, 90));
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [materialOpen, setMaterialOpen] = useState(null);
  const [checkinModal, setCheckinModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [reviewDismissedForWeek, setReviewDismissedForWeek] = useState(() =>
    parseInt(localStorage.getItem(LS_REVIEW) || '0', 10)
  );

  useEffect(() => {
    if (!user.programStart) {
      const n = { ...user, programStart: formatDateKey(new Date()) };
      setUser(n);
      saveJson(LS_USER, n);
    }
  }, [user]);

  useEffect(() => {
    saveJson(LS_USER, user);
  }, [user]);

  useEffect(() => {
    saveJson(LS_CHECKINS, checkins);
  }, [checkins]);

  useEffect(() => {
    saveJson(LS_TASKS, tasksByDate);
  }, [tasksByDate]);

  useEffect(() => {
    saveJson(LS_REFLECTION, reflectionByDate);
  }, [reflectionByDate]);

  useEffect(() => {
    saveJson(LS_ACHIEVEMENTS, achievements);
  }, [achievements]);

  useEffect(() => {
    saveJson(LS_MODE, studyMode);
  }, [studyMode]);

  const todayKey = formatDateKey(new Date());
  const programDayIndex = useMemo(() => {
    if (!user.programStart) return 0;
    return clampProgramDay(getProgramDayIndex(user.programStart));
  }, [user.programStart, todayKey]);

  const { week, lesson, weekNumber, dayInWeek } = useMemo(
    () => lessonForProgramDay(programDayIndex),
    [programDayIndex]
  );

  const stage = stageForWeek(weekNumber);
  const streak = streakDays(checkins);
  const titleRow = getStreakTitle(streak);
  const weekRate = weekCompletionCalendar(checkins);
  const totalCheckins = Object.keys(checkins).length;
  const checkedToday = !!checkins[todayKey];

  const tasksToday = tasksByDate[todayKey] || {};
  const allTasksDone = TASK_IDS.every((t) => tasksToday[t.id] === 'done');

  const taskDisplayStatus = (id) => tasksToday[id] || 'todo';

  const reflection = reflectionByDate[todayKey] || { learned: '', stuck: '', tomorrow: '' };

  const mins = minutesForMode(studyMode);

  const slogan = useMemo(() => {
    const i = new Date().getDate() % FOUNDER_SLOGANS.length;
    return FOUNDER_SLOGANS[i];
  }, [todayKey]);

  const motivationToday = useMemo(
    () => MOTIVATION_MESSAGES[(programDayIndex + weekNumber) % MOTIVATION_MESSAGES.length],
    [programDayIndex, weekNumber]
  );

  const showWeeklyReviewBanner = useMemo(() => {
    const dow = new Date().getDay();
    const wk = Math.floor(programDayIndex / 7) + 1;
    return (dow === 0 || dow === 6) && wk > 0 && wk !== reviewDismissedForWeek;
  }, [programDayIndex, todayKey, reviewDismissedForWeek]);

  const setTaskStatus = useCallback(
    (taskId, status) => {
      setTasksByDate((prev) => ({
        ...prev,
        [todayKey]: { ...prev[todayKey], [taskId]: status },
      }));
    },
    [todayKey]
  );

  const persistReflection = useCallback(
    (field, value) => {
      setReflectionByDate((prev) => ({
        ...prev,
        [todayKey]: { ...prev[todayKey], learned: '', stuck: '', tomorrow: '', ...prev[todayKey], [field]: value },
      }));
    },
    [todayKey]
  );

  const performCheckin = useCallback(() => {
    if (!allTasksDone) {
      setToast('请先完成今日五项学习任务，再打卡。');
      setTimeout(() => setToast(null), 3200);
      return;
    }
    if (checkedToday) {
      setToast('今日已打卡。保持节奏。');
      setTimeout(() => setToast(null), 2800);
      return;
    }
    const nextCheck = { ...checkins, [todayKey]: true };
    setCheckins(nextCheck);
    const newStreak = streakDays(nextCheck);
    const unlocked = evaluateAchievements({
      unlocked: achievements,
      checkins: nextCheck,
      streak: newStreak,
      programDayIndex,
      allDone: true,
    });
    setAchievements(unlocked);
    setCheckinModal({
      text: randomPick(CHECKIN_MODAL_MESSAGES),
      extra: randomPick(MOTIVATION_MESSAGES),
      streak: newStreak,
    });
  }, [allTasksDone, checkedToday, checkins, achievements, programDayIndex, todayKey, tasksToday]);

  const startLesson = useCallback(() => {
    setView('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const weekStatsForReview = useMemo(() => {
    const wk = Math.floor(programDayIndex / 7);
    const start = wk * 7;
    let checked = 0;
    let themes = [];
    if (!user.programStart) return { checked: 0, themes: [], minutes: 0 };
    const base = new Date(user.programStart);
    for (let i = 0; i < 7; i += 1) {
      const di = start + i;
      if (di > MAX_PROGRAM_DAY) break;
      const dk = formatDateKey(new Date(base.getTime() + di * 86400000));
      if (checkins[dk]) {
        checked += 1;
        const { lesson: les } = lessonForProgramDay(di);
        themes.push(les.themeZh);
      }
    }
    const minutes = checked * studyMode;
    return { checked, themes, minutes, weekNum: wk + 1 };
  }, [programDayIndex, checkins, user.programStart, studyMode]);

  const topFocus = lesson.todayFocus || lesson.themeZh;

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-ink-950">
      <header className="border-b border-ink-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-medium">Founder English System</p>
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink-950">商务英语训练 · 打卡</h1>
            <p className="text-sm text-ink-600 mt-1 max-w-xl text-balance">
              <span className="text-brass-600 font-medium">Today&apos;s Focus · </span>
              {topFocus}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-500 mr-1">学习时长</span>
            {[60, 90, 120].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setStudyMode(m)}
                className={classNames(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition',
                  studyMode === m ? 'bg-ink-950 text-white shadow-card' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                )}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
        <nav className="border-t border-ink-100 bg-white/80">
          <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setView(n.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={classNames(
                  'shrink-0 px-4 py-2 rounded-lg text-left transition',
                  view === n.id ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-ink-100'
                )}
              >
                <div className="text-sm font-medium leading-tight">{n.label}</div>
                <div className={classNames('text-[10px] uppercase tracking-wider', view === n.id ? 'text-white/70' : 'text-ink-400')}>
                  {n.sub}
                </div>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {showWeeklyReviewBanner && view === 'dashboard' && (
          <div className="mb-6 rounded-2xl border border-brass-400/40 bg-gradient-to-r from-amber-50 to-white p-5 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-brass-600 uppercase tracking-wider">Weekly Review</p>
              <p className="font-display text-lg text-ink-950 mt-1">本周复盘已就绪</p>
              <p className="text-sm text-ink-600">查看完成率、主题分布与下周建议。</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('review')}
                className="px-5 py-2.5 rounded-xl bg-ink-950 text-white text-sm font-medium hover:bg-ink-800"
              >
                打开周复盘
              </button>
              <button
                type="button"
                onClick={() => {
                  const wk = Math.floor(programDayIndex / 7) + 1;
                  localStorage.setItem(LS_REVIEW, String(wk));
                  setReviewDismissedForWeek(wk);
                }}
                className="px-4 py-2.5 rounded-xl border border-ink-200 text-sm text-ink-600 hover:bg-ink-50"
              >
                稍后
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <DashboardView
            todayKey={todayKey}
            checkedToday={checkedToday}
            streak={streak}
            titleRow={titleRow}
            totalCheckins={totalCheckins}
            weekRate={weekRate}
            weekNumber={weekNumber}
            dayInWeek={dayInWeek}
            stage={stage}
            programDayIndex={programDayIndex}
            motivationToday={motivationToday}
            studyMode={studyMode}
            slogan={slogan}
            lesson={lesson}
            startLesson={startLesson}
            performCheckin={performCheckin}
            allTasksDone={allTasksDone}
            week={week}
          />
        )}

        {view === 'lesson' && (
          <LessonView
            lesson={lesson}
            week={week}
            weekNumber={weekNumber}
            dayInWeek={dayInWeek}
            stage={stage}
            mins={mins}
            tasksToday={tasksToday}
            taskDisplayStatus={taskDisplayStatus}
            setTaskStatus={setTaskStatus}
            reflection={reflection}
            persistReflection={persistReflection}
            performCheckin={performCheckin}
            checkedToday={checkedToday}
            allTasksDone={allTasksDone}
          />
        )}

        {view === 'plan' && <PlanView expandedWeek={expandedWeek} setExpandedWeek={setExpandedWeek} />}

        {view === 'materials' && (
          <MaterialsView materialOpen={materialOpen} setMaterialOpen={setMaterialOpen} />
        )}

        {view === 'rewards' && (
          <RewardsView
            streak={streak}
            titleRow={titleRow}
            checkins={checkins}
            achievements={achievements}
            studyMode={studyMode}
          />
        )}

        {view === 'review' && (
          <ReviewView weekStatsForReview={weekStatsForReview} programDayIndex={programDayIndex} checkins={checkins} user={user} />
        )}
      </main>

      {checkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl bg-white shadow-lift p-8 border border-ink-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brass-400/10 via-transparent to-ink-950/5 pointer-events-none" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.25em] text-brass-600 font-semibold">Check-in complete</p>
              <h3 className="font-display text-2xl font-semibold mt-3 text-ink-950 leading-snug">{checkinModal.text}</h3>
              <p className="text-sm text-ink-600 mt-4 leading-relaxed">{checkinModal.extra}</p>
              <div className="mt-6 flex items-center gap-2 text-brass-600">
                <span className="text-2xl" aria-hidden>✦</span>
                <span className="text-sm font-medium">
                  连续 {checkinModal.streak} 天 · {getStreakTitle(checkinModal.streak).title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCheckinModal(null)}
                className="mt-8 w-full py-3 rounded-xl bg-ink-950 text-white text-sm font-semibold hover:bg-ink-800"
              >
                继续训练
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-ink-950 text-white text-sm shadow-lift">
          {toast}
        </div>
      )}

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-xs text-ink-400">
        Founder Business English · 本地数据保存在浏览器 · {slogan}
      </footer>
    </div>
  );
}

function DashboardView({
  todayKey,
  checkedToday,
  streak,
  titleRow,
  totalCheckins,
  weekRate,
  weekNumber,
  dayInWeek,
  stage,
  programDayIndex,
  motivationToday,
  studyMode,
  slogan,
  lesson,
  startLesson,
  performCheckin,
  allTasksDone,
  week,
}) {
  const month = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const phaseWeek = `第 ${weekNumber} 周 / 第 ${Math.ceil(weekNumber / 4)} 阶段节点 · Day ${dayInWeek}`;
  const progressPct = Math.min(100, Math.round(((programDayIndex + 1) / (24 * 7)) * 100));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-ink-950 text-white p-8 shadow-lift relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brass-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-[0.2em]">{month}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2 tracking-tight">欢迎回来，创始人</h2>
            <p className="text-white/70 mt-3 max-w-md leading-relaxed">{slogan}</p>
            <p className="text-brass-400/90 text-sm mt-4 font-medium leading-relaxed">{motivationToday}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-white/50 text-xs">今日打卡</p>
              <p className="text-2xl font-semibold mt-1">{checkedToday ? '已完成' : '待完成'}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-white/50 text-xs">连续打卡</p>
              <p className="text-2xl font-semibold mt-1 flex items-center gap-1">
                {streak} <span className="text-lg" aria-hidden>🔥</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-white/50 text-xs">总学习天数</p>
              <p className="text-2xl font-semibold mt-1">{totalCheckins}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-white/50 text-xs">本周完成率</p>
              <p className="text-2xl font-semibold mt-1">{weekRate}%</p>
            </div>
          </div>
        </div>
        <div className="relative mt-8">
          <div className="flex justify-between text-xs text-white/50 mb-2">
            <span>24 周进度</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-brass-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-white/40 mt-2">{phaseWeek}</p>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold text-ink-950">今日学习目标</h3>
          <p className="text-sm text-ink-600 mt-2 leading-relaxed">{week.weeklyGoal}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-ink-100 text-xs text-ink-700">{stage.title}</span>
            <span className="px-3 py-1 rounded-full bg-ink-100 text-xs text-ink-700">建议时长 {studyMode} 分钟</span>
            <span className="px-3 py-1 rounded-full bg-brass-400/20 text-xs text-brass-700 font-medium">{titleRow.title}</span>
          </div>
          <p className="text-xs text-ink-500 mt-4 uppercase tracking-wider">本周 CEO 表达重点</p>
          <p className="text-sm text-ink-800 mt-1 font-medium">{week.ceoWeeklyFocus}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startLesson}
              className="px-8 py-3.5 rounded-xl bg-ink-950 text-white text-sm font-semibold shadow-card hover:bg-ink-800"
            >
              开始今日学习
            </button>
            <button
              type="button"
              onClick={performCheckin}
              disabled={!allTasksDone || checkedToday}
              className={classNames(
                'px-8 py-3.5 rounded-xl text-sm font-semibold border-2 transition',
                !allTasksDone || checkedToday
                  ? 'border-ink-200 text-ink-400 cursor-not-allowed bg-ink-50'
                  : 'border-brass-500 text-ink-950 bg-brass-400/10 hover:bg-brass-400/20'
              )}
            >
              {checkedToday ? '今日已打卡' : '完成今日打卡'}
            </button>
          </div>
          {!allTasksDone && !checkedToday && (
            <p className="text-xs text-ink-500 mt-3">完成「今日学习」五项任务后即可打卡解锁成就反馈。</p>
          )}
        </section>
        <section className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold text-ink-950">今日主题</h3>
          <p className="text-sm font-medium text-brass-700 mt-2">{lesson.themeZh}</p>
          <p className="text-xs text-ink-500 mt-1">{lesson.themeEn}</p>
          <p className="text-sm text-ink-700 mt-4 leading-relaxed line-clamp-6">{lesson.speakingTask?.brief}</p>
        </section>
      </div>
    </div>
  );
}

function TaskStatusButtons({ status, onChange }) {
  const opts = [
    { id: 'todo', label: '未开始' },
    { id: 'doing', label: '进行中' },
    { id: 'done', label: '已完成' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={classNames(
            'px-3 py-1 rounded-lg text-xs font-medium border transition',
            status === o.id ? 'bg-ink-950 text-white border-ink-950' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function LessonView({
  lesson,
  week,
  weekNumber,
  dayInWeek,
  stage,
  mins,
  tasksToday,
  taskDisplayStatus,
  setTaskStatus,
  reflection,
  persistReflection,
  performCheckin,
  checkedToday,
  allTasksDone,
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs text-brass-600 font-semibold uppercase tracking-wider">Week {weekNumber} · Day {dayInWeek}</p>
            <h2 className="font-display text-2xl font-semibold text-ink-950 mt-1">{lesson.themeZh}</h2>
            <p className="text-sm text-ink-500">{lesson.themeEn}</p>
          </div>
          <div className="text-right text-sm text-ink-600">
            <p>{stage.title}</p>
            <p className="text-xs text-ink-400 mt-1">{week.ceoWeeklyFocus}</p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">今日任务概览</h3>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li className="flex justify-between border-b border-ink-100 pb-2">
            <span>跟读训练 Shadowing</span>
            <span className="text-ink-500">{mins.shadowing} min</span>
          </li>
          <li className="flex justify-between border-b border-ink-100 pb-2">
            <span>关键表达 Expressions</span>
            <span className="text-ink-500">{mins.expressions} min</span>
          </li>
          <li className="flex justify-between border-b border-ink-100 pb-2">
            <span>情景口语 Speaking</span>
            <span className="text-ink-500">{mins.speaking} min</span>
          </li>
          <li className="flex justify-between border-b border-ink-100 pb-2">
            <span>管理/谈判模拟 Simulation</span>
            <span className="text-ink-500">{mins.simulation} min</span>
          </li>
          <li className="flex justify-between">
            <span>复盘 Reflection</span>
            <span className="text-ink-500">{mins.reflection} min</span>
          </li>
        </ul>
        <p className="text-xs text-ink-500 mt-4">口语任务提示：{lesson.oralTaskZh}</p>
      </section>

      <LessonBlock
        title="1. 跟读训练 Shadowing"
        subtitle={`建议 ${mins.shadowing} 分钟 · 5–8 句商务跟读`}
        taskId="shadowing"
        status={taskDisplayStatus('shadowing')}
        setTaskStatus={setTaskStatus}
      >
        <ul className="space-y-3">
          {lesson.shadowing.map((line, i) => (
            <li key={i} className="rounded-xl bg-ink-50 p-4 border border-ink-100">
              <p className="text-ink-950 font-medium font-display">{line.en}</p>
              <p className="text-sm text-ink-600 mt-1">{line.zh}</p>
            </li>
          ))}
        </ul>
      </LessonBlock>

      <LessonBlock
        title="2. 关键表达 Expressions"
        subtitle={`建议 ${mins.expressions} 分钟 · 核心句型与中文`}
        taskId="expressions"
        status={taskDisplayStatus('expressions')}
        setTaskStatus={setTaskStatus}
      >
        <ul className="grid sm:grid-cols-2 gap-3">
          {lesson.expressions.map((line, i) => (
            <li key={i} className="rounded-xl border border-ink-200 p-4">
              <p className="text-sm font-medium text-ink-950">{line.en}</p>
              <p className="text-xs text-ink-600 mt-1">{line.zh}</p>
            </li>
          ))}
        </ul>
      </LessonBlock>

      <LessonBlock
        title="3. 今日词汇"
        subtitle="至少 8 词 · 可造句巩固"
        taskId="expressions"
        status={taskDisplayStatus('expressions')}
        setTaskStatus={setTaskStatus}
        hideTaskBar
      >
        <div className="flex flex-wrap gap-2">
          {lesson.vocabulary.map((v, i) => (
            <span key={i} className="px-3 py-2 rounded-lg bg-ink-950 text-white text-xs">
              {v.en}
              <span className="text-white/60"> · </span>
              {v.zh}
            </span>
          ))}
        </div>
      </LessonBlock>

      <LessonBlock
        title="4. 情景对话 Dialogue"
        subtitle="今日对话脚本"
        taskId="speaking"
        status={taskDisplayStatus('speaking')}
        setTaskStatus={setTaskStatus}
      >
        <div className="space-y-3">
          {lesson.dialogue.map((line, i) => (
            <div key={i} className="rounded-xl border border-ink-200 p-4">
              <p className="text-xs font-semibold text-brass-600">{line.speaker}</p>
              <p className="text-ink-950 mt-1">{line.en}</p>
              <p className="text-sm text-ink-600 mt-1">{line.zh}</p>
            </div>
          ))}
        </div>
      </LessonBlock>

      <LessonBlock
        title="5. 情景口语 Speaking Task"
        subtitle={`建议 ${mins.speaking} 分钟 · 角色扮演`}
        taskId="speaking"
        status={taskDisplayStatus('speaking')}
        setTaskStatus={setTaskStatus}
        hideTaskBar
      >
        <p className="font-medium text-ink-950">{lesson.speakingTask.titleZh}</p>
        <p className="text-sm text-ink-600 mt-2 leading-relaxed">{lesson.speakingTask.brief}</p>
        <ul className="mt-3 list-disc list-inside text-sm text-ink-700 space-y-1">
          {lesson.speakingTask.prompts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </LessonBlock>

      <LessonBlock
        title="6. 管理/谈判模拟 Simulation"
        subtitle={`建议 ${mins.simulation} 分钟`}
        taskId="simulation"
        status={taskDisplayStatus('simulation')}
        setTaskStatus={setTaskStatus}
      >
        <p className="font-medium text-ink-950">{lesson.simulation.titleZh}</p>
        <p className="text-sm text-ink-600 mt-2">{lesson.simulation.context}</p>
        <ul className="mt-3 list-decimal list-inside text-sm text-ink-700 space-y-1">
          {lesson.simulation.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </LessonBlock>

      <LessonBlock
        title="7. 复盘 Reflection"
        subtitle={`建议 ${mins.reflection} 分钟 · 三个问题`}
        taskId="reflection_task"
        status={taskDisplayStatus('reflection_task')}
        setTaskStatus={setTaskStatus}
      >
        <ul className="space-y-2 text-sm text-ink-800">
          {lesson.reflectionQuestions.map((q, i) => (
            <li key={i} className="rounded-lg bg-ink-50 p-3 border border-ink-100">
              {q}
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider">今天学到了什么</label>
          <textarea
            className="w-full rounded-xl border border-ink-200 p-3 text-sm min-h-[80px]"
            value={reflection.learned}
            onChange={(e) => persistReflection('learned', e.target.value)}
            placeholder="英文或中文均可，建议逐步增加英文比例…"
          />
          <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider">今天最卡的点</label>
          <textarea
            className="w-full rounded-xl border border-ink-200 p-3 text-sm min-h-[72px]"
            value={reflection.stuck}
            onChange={(e) => persistReflection('stuck', e.target.value)}
          />
          <label className="block text-xs font-semibold text-ink-500 uppercase tracking-wider">明天要加强什么</label>
          <textarea
            className="w-full rounded-xl border border-ink-200 p-3 text-sm min-h-[72px]"
            value={reflection.tomorrow}
            onChange={(e) => persistReflection('tomorrow', e.target.value)}
          />
        </div>
      </LessonBlock>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={performCheckin}
          disabled={!allTasksDone || checkedToday}
          className={classNames(
            'px-8 py-3.5 rounded-xl text-sm font-semibold',
            !allTasksDone || checkedToday ? 'bg-ink-200 text-ink-500 cursor-not-allowed' : 'bg-brass-500 text-ink-950 hover:bg-brass-400'
          )}
        >
          {checkedToday ? '今日已打卡' : '完成今日打卡'}
        </button>
      </div>
    </div>
  );
}

function LessonBlock({ title, subtitle, children, taskId, status, setTaskStatus, hideTaskBar }) {
  return (
    <section className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
      <h3 className="font-display text-lg font-semibold text-ink-950">{title}</h3>
      <p className="text-xs text-ink-500 mt-1">{subtitle}</p>
      {!hideTaskBar && (
        <TaskStatusButtons
          status={status}
          onChange={(s) => setTaskStatus(taskId, s)}
        />
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PlanView({ expandedWeek, setExpandedWeek }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold">24 周商务英语计划</h2>
        <p className="text-sm text-ink-600 mt-2 leading-relaxed">
          四周为一阶段：输出习惯 → 会议与管理 → 商务洽谈 → 领导力与全球化表达。点击周次展开每日任务与教材结构。
        </p>
      </div>
      <div className="space-y-2">
        {ALL_WEEKS.map((w) => (
          <div key={w.weekNumber} className="rounded-2xl border border-ink-200/80 bg-white shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedWeek(expandedWeek === w.weekNumber ? null : w.weekNumber)}
              className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-ink-50 transition"
            >
              <div>
                <p className="text-xs text-brass-600 font-semibold">Week {w.weekNumber}</p>
                <p className="font-display font-semibold text-ink-950">{stageForWeek(w.weekNumber).title}</p>
                <p className="text-sm text-ink-600 mt-1 line-clamp-2">{w.weeklyGoal}</p>
              </div>
              <span className="text-ink-400 text-xl">{expandedWeek === w.weekNumber ? '−' : '+'}</span>
            </button>
            {expandedWeek === w.weekNumber && (
              <div className="px-6 pb-6 border-t border-ink-100 pt-4 text-sm space-y-4">
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase">本周学习目标</p>
                  <p className="text-ink-800 mt-1">{w.weeklyGoal}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase">重点能力</p>
                  <p className="text-ink-800 mt-1">{w.focusAbility}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase">学习主题</p>
                  <p className="text-ink-800 mt-1">{w.themes}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase">本周 CEO 表达重点</p>
                  <p className="text-ink-800 mt-1 font-medium">{w.ceoWeeklyFocus}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase">每日任务与教材</p>
                  <ul className="mt-2 space-y-2">
                    {w.days.map((d) => (
                      <li key={d.dayInWeek} className="rounded-xl bg-ink-50 p-3 border border-ink-100">
                        <p className="font-medium text-ink-950">
                          Day {d.dayInWeek} · {d.themeZh}
                        </p>
                        <p className="text-xs text-ink-500 mt-1">跟读 · 句型 · 词汇 · 对话 · 角色扮演 · 模拟 · 复盘</p>
                        <p className="text-xs text-ink-600 mt-1 line-clamp-2">{d.speakingTask?.brief}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase">每周复盘任务</p>
                  <p className="text-ink-800 mt-1">{w.weeklyReviewTask}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialsView({ materialOpen, setMaterialOpen }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold">教材库</h2>
        <p className="text-sm text-ink-600 mt-2">按场景复习：句型、词汇、对话、常见错误与中文解释。</p>
      </div>
      <div className="grid gap-3">
        {MATERIAL_CATEGORIES.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-ink-200/80 bg-white shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setMaterialOpen(materialOpen === cat.id ? null : cat.id)}
              className="w-full text-left px-6 py-4 hover:bg-ink-50 flex justify-between items-start gap-4"
            >
              <div>
                <p className="font-display font-semibold text-ink-950">{cat.title}</p>
                <p className="text-xs text-ink-500 mt-1">{cat.subtitle}</p>
              </div>
              <span className="text-ink-400">{materialOpen === cat.id ? '−' : '+'}</span>
            </button>
            {materialOpen === cat.id && (
              <div className="px-6 pb-6 border-t border-ink-100 pt-4 space-y-6 text-sm">
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase mb-2">常用句型</p>
                  <ul className="space-y-2">
                    {cat.patterns.map((p, i) => (
                      <li key={i} className="rounded-lg bg-ink-50 p-3 border border-ink-100">
                        <p className="text-ink-950">{p.en}</p>
                        <p className="text-xs text-ink-600 mt-1">{p.zh}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase mb-2">核心词汇</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.vocabulary.map((v, i) => (
                      <span key={i} className="px-2 py-1 rounded-md bg-ink-950 text-white text-xs">
                        {v.en} <span className="text-white/60">·</span> {v.zh}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase mb-2">示例对话</p>
                  <div className="space-y-2">
                    {cat.dialogue.map((line, i) => (
                      <div key={i} className="rounded-lg border border-ink-200 p-3">
                        <p className="text-xs text-brass-600 font-semibold">{line.speaker}</p>
                        <p className="text-ink-900 mt-1">{line.en}</p>
                        <p className="text-xs text-ink-600 mt-1">{line.zh}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-500 uppercase mb-2">常见错误提醒</p>
                  <ul className="list-disc list-inside text-ink-700 space-y-1">
                    {cat.mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardsView({ streak, titleRow, checkins, achievements, studyMode }) {
  const unlockedSet = new Set(achievements);
  const calRows = buildCalendarGrid(checkins);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-ink-950 to-ink-800 text-white p-8 shadow-lift">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Streak</p>
            <p className="font-display text-5xl font-semibold mt-2 flex items-center gap-2">
              {streak} <span className="text-3xl" aria-hidden>🔥</span>
            </p>
            <p className="text-brass-400 font-medium mt-2">{titleRow.title}</p>
            <p className="text-white/60 text-sm mt-1">{titleRow.en}</p>
          </div>
          <div className="text-sm text-white/70 max-w-xs leading-relaxed">{randomPick(MOTIVATION_MESSAGES)}</div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">本月打卡日历</h3>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
          {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
            <div key={d} className="text-ink-400 py-2">
              {d}
            </div>
          ))}
          {calRows.flat().map((cell, i) => (
            <div
              key={i}
              className={classNames(
                'aspect-square rounded-lg flex items-center justify-center text-[11px]',
                cell.inMonth ? (cell.checked ? 'bg-brass-500 text-ink-950 font-semibold' : 'bg-ink-100 text-ink-500') : 'bg-transparent'
              )}
            >
              {cell.inMonth ? cell.day : ''}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">成就徽章</h3>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {ACHIEVEMENT_DEFS.map((a) => (
            <div
              key={a.id}
              className={classNames(
                'rounded-xl border p-4 flex gap-3',
                unlockedSet.has(a.id) ? 'border-brass-400 bg-brass-400/10' : 'border-ink-200 bg-ink-50 opacity-60'
              )}
            >
              <span className="text-2xl text-brass-600">{a.icon}</span>
              <div>
                <p className="font-semibold text-ink-950">{a.title}</p>
                <p className="text-xs text-ink-600 mt-1">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-ink-950 text-white p-6 shadow-card">
        <h3 className="font-display text-lg font-semibold">每周解锁称号</h3>
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          <li>Day 3 · 英语启动者</li>
          <li>Day 7 · 商务表达练习者</li>
          <li>Day 14 · 会议掌控者</li>
          <li>Day 30 · 全球沟通进阶者</li>
          <li>Day 60 · 商务谈判执行者</li>
          <li>Day 90 · Founder Communicator</li>
        </ul>
        <p className="text-xs text-white/50 mt-4">当前建议单次投入：{studyMode} 分钟 · 把训练写进日历，像会议一样不可移动。</p>
      </section>
    </div>
  );
}

function buildCalendarGrid(checkins) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const startPad = (first.getDay() + 6) % 7;
  const cells = [];
  let day = 1 - startPad;
  for (let r = 0; r < 6; r += 1) {
    const row = [];
    for (let c = 0; c < 7; c += 1) {
      const inMonth = day >= 1 && day <= last.getDate();
      const key = inMonth ? formatDateKey(new Date(y, m, day)) : '';
      row.push({ inMonth, day: inMonth ? day : null, checked: inMonth && checkins[key] });
      day += 1;
    }
    cells.push(row);
  }
  return cells;
}

function ReviewView({ weekStatsForReview, programDayIndex, checkins, user }) {
  const rate = Math.round((weekStatsForReview.checked / 7) * 100);
  const topTheme = modeString(weekStatsForReview.themes);
  const feedback = generateWeeklyFeedback(rate, weekStatsForReview.checked);
  const nextFocus =
    weekStatsForReview.weekNum <= 4
      ? '进入阶段 2：把会议控场与管理沟通做成「模板化输出」。'
      : weekStatsForReview.weekNum <= 10
        ? '强化 1:1 与反馈语言，把「期望」翻译成可执行标准。'
        : weekStatsForReview.weekNum <= 18
          ? '用条款摘要训练：每场谈判后 5 分钟英文复盘。'
          : '把战略叙事练到可在董事会/顾问面前 3 分钟讲清取舍。';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold">周复盘</h2>
        <p className="text-sm text-ink-600 mt-2">第 {weekStatsForReview.weekNum} 周 · 基于打卡记录与学习时长模式估算</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
          <p className="text-xs text-ink-500 uppercase font-semibold">本周完成率</p>
          <p className="font-display text-4xl font-semibold mt-2">{rate}%</p>
          <p className="text-sm text-ink-600 mt-2">已打卡 {weekStatsForReview.checked} / 7 天</p>
        </div>
        <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
          <p className="text-xs text-ink-500 uppercase font-semibold">本周累计学习时长（估）</p>
          <p className="font-display text-4xl font-semibold mt-2">{weekStatsForReview.minutes} min</p>
          <p className="text-sm text-ink-600 mt-2">按每日打卡 × 当前时长模式估算</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <p className="text-xs text-ink-500 uppercase font-semibold">本周完成的模块</p>
        <p className="text-ink-800 mt-2">已打卡日期：{listCheckedThisProgramWeek(programDayIndex, checkins, user)}</p>
      </div>
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <p className="text-xs text-ink-500 uppercase font-semibold">本周最常练的主题（打卡日主题）</p>
        <p className="text-ink-800 mt-2 leading-relaxed">{topTheme || '本周暂无打卡记录'}</p>
      </div>
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <p className="text-xs text-ink-500 uppercase font-semibold">本周待加强项</p>
        <p className="text-ink-800 mt-2">
          {rate < 100
            ? '补齐未打卡日：把「今日学习」当作早间第一个会议，降低启动成本。'
            : '保持节奏：增加一次真实会议中的英文输出（哪怕只有两分钟）。'}
        </p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-ink-950 to-ink-800 text-white p-6 shadow-lift">
        <p className="text-xs text-white/50 uppercase font-semibold">自动生成正向反馈</p>
        <p className="mt-3 leading-relaxed text-white/90">{feedback}</p>
      </div>
      <div className="rounded-2xl bg-white border border-ink-200/80 p-6 shadow-card">
        <p className="text-xs text-ink-500 uppercase font-semibold">下周建议重点</p>
        <p className="text-ink-900 mt-2 font-medium leading-relaxed">{nextFocus}</p>
      </div>
    </div>
  );
}

function modeString(themes) {
  const counts = {};
  themes.forEach((t) => {
    counts[t] = (counts[t] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}（${v}）`)
    .join(' · ');
}

function listCheckedThisProgramWeek(programDayIndex, checkins, user) {
  if (!user.programStart) return '—';
  const wk = Math.floor(programDayIndex / 7);
  const start = wk * 7;
  const base = new Date(user.programStart);
  const keys = [];
  for (let i = 0; i < 7; i += 1) {
    const di = start + i;
    if (di > MAX_PROGRAM_DAY) break;
    const dk = formatDateKey(new Date(base.getTime() + di * 86400000));
    if (checkins[dk]) keys.push(dk);
  }
  return keys.length ? keys.join('、') : '无';
}

function generateWeeklyFeedback(rate, days) {
  if (days === 0) return '本周尚未打卡。创始人最稀缺的不是时间，而是启动；明天把「今日学习」放进日历的第一格。';
  if (rate >= 85)
    return '本周完成度很高。你在做的不是「学英语」，而是在把判断力翻译成他人能执行的语言——这是国际化经营的基础设施。';
  if (rate >= 50)
    return '本周已经建立了有效节奏。接下来把每一次打卡都绑定一个真实场景（邮件、会议、谈判），复利会明显加快。';
  return '本周有起步，但波动还在。把目标缩小到「每天只完成一个任务块」也能保住连胜——一致性比强度更贵。';
}

export default App;

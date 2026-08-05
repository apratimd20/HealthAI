// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  IoPeopleOutline,
  IoChatbubblesOutline,
  IoCameraOutline,
  IoMedkitOutline,
  IoTimerOutline,
  IoChatboxEllipsesOutline,
  IoHappyOutline,
  IoTrendingUpOutline,
} from 'react-icons/io5';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/admin/StatCard';
import PageHeader from '../../components/admin/PageHeader';
import ChartCard from '../../components/admin/ChartCard';

const PIE_COLORS = ['#22c55e', '#38bdf8', '#94a3b8', '#f59e0b', '#ef4444', '#a855f7', '#e11d48'];

const formatDuration = (seconds) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-default bg-surface-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-fg">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-fg-muted">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: entry.color || entry.payload?.fill }} />
          {entry.name}: <span className="font-semibold text-fg">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState({ series: [] });
  const [registrations, setRegistrations] = useState({ series: [] });
  const [community, setCommunity] = useState({ posts: [], comments: [] });
  const [peakHours, setPeakHours] = useState([]);
  const [sentiments, setSentiments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [insights, setInsights] = useState({ symptoms: [], medicines: [], diseases: [], questions: [] });
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState('daily');

  const loadAnalytics = useCallback(async (gran) => {
    setLoading(true);
    try {
      const params = { granularity: gran, count: 30 };
      const [ov, act, reg, com, peak, sent, top, ins] = await Promise.all([
        adminService.getOverview(),
        adminService.getChatActivity(params),
        adminService.getRegistrations(params),
        adminService.getCommunityActivity(params),
        adminService.getPeakHours(),
        adminService.getSentiments(),
        adminService.getTopics(),
        adminService.getInsights(),
      ]);
      if (ov.success) setOverview(ov.data);
      if (act.success) setActivity(act.data);
      if (reg.success) setRegistrations(reg.data);
      if (com.success) setCommunity(com.data);
      if (peak.success) setPeakHours(peak.data);
      if (sent.success) setSentiments(sent.data);
      if (top.success) setTopics(top.data);
      if (ins.success) setInsights(ins.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(granularity);
  }, [granularity, loadAnalytics]);

  const activityData = activity.series.map((s) => ({ label: s.label, Chats: s.count }));
  const registrationData = registrations.series.map((s) => ({ label: s.label, Users: s.count }));
  const communityData = community.posts.map((p, i) => ({
    label: p.label,
    Posts: p.count,
    Comments: community.comments[i]?.count || 0,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A live snapshot of your platform health — users, conversations, community, and AI usage."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {loading && !overview ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border-default bg-surface-card p-5">
              <div className="h-3 w-20 rounded bg-surface-muted" />
              <div className="mt-4 h-8 w-16 rounded bg-surface-muted" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Users" value={overview?.totalUsers ?? '—'} icon={<IoPeopleOutline />} accent="text-emerald-300" hint={overview ? `+${overview.weeklyGrowth}% wk` : ''} />
            <StatCard label="Active Users" value={overview?.activeUsers ?? '—'} icon={<IoTrendingUpOutline />} accent="text-sky-300" />
            <StatCard label="Total Chats" value={overview?.totalChats ?? '—'} icon={<IoChatbubblesOutline />} accent="text-violet-300" hint={overview ? `${overview.chatGrowth}% wk` : ''} />
            <StatCard label="Community Posts" value={overview?.totalCommunityPosts ?? '—'} icon={<IoChatboxEllipsesOutline />} accent="text-amber-300" />
            <StatCard label="Food Scans" value={overview?.totalFoodScans ?? '—'} icon={<IoCameraOutline />} accent="text-emerald-300" />
            <StatCard label="Symptoms Checked" value={overview?.totalSymptomsChecked ?? '—'} icon={<IoMedkitOutline />} accent="text-rose-300" />
            <StatCard label="Avg Chat Duration" value={overview ? formatDuration(overview.averageChatDurationSeconds) : '—'} icon={<IoTimerOutline />} accent="text-cyan-300" />
            <StatCard label="Avg Msgs / Chat" value={overview?.averageMessagesPerConversation ?? '—'} icon={<IoChatbubblesOutline />} accent="text-sky-300" />
            <StatCard label="Satisfaction Score" value={overview?.satisfactionScore ? `${overview.satisfactionScore}/5` : '—'} icon={<IoHappyOutline />} accent="text-emerald-300" />
            <StatCard label="Returning Users (7d)" value={overview?.returningUsers ?? '—'} icon={<IoPeopleOutline />} accent="text-violet-300" />
          </>
        )}
      </div>

      {/* Activity charts */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-fg">Activity trends</h2>
          <div className="flex rounded-lg border border-border-default bg-surface-card p-1">
            {['daily', 'weekly', 'monthly'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  granularity === g ? 'bg-brand text-slate-950' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Chat Activity" subtitle="Conversations started per period">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chatFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#233047" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#233047' }} />
                  <YAxis tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Chats" stroke="#22c55e" strokeWidth={2} fill="url(#chatFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="User Registrations" subtitle="New accounts created per period">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#233047" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#233047' }} />
                  <YAxis tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Users" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Community Activity" subtitle="Posts and comments per period">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={communityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#233047" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#233047' }} />
                  <YAxis tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Posts" stroke="#a855f7" strokeWidth={2} fill="#a855f733" />
                  <Area type="monotone" dataKey="Comments" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b22" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Peak Usage Hours" subtitle="Chat messages by hour of day (UTC)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#233047" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6a778a', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#233047' }} interval={2} />
                  <YAxis tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Messages" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Distributions + insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Sentiment Distribution" subtitle="How users feel after conversations">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentiments} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, pct }) => `${name} ${pct ?? ''}%`} labelLine={false}>
                  {sentiments.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Health Topics" subtitle="Detected conversation categories">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topics} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#233047" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6a778a', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#e5edf7', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Conversations" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Insights lists */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard title="Common Symptoms" items={insights.symptoms} empty="No symptoms detected yet" />
        <InsightCard title="Frequent Medicines" items={insights.medicines} empty="No medicines mentioned yet" />
        <InsightCard title="Common Diseases" items={insights.diseases} empty="No diseases mentioned yet" />
        <div className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
          <h3 className="text-sm font-bold text-fg">Trending Health Questions</h3>
          <div className="mt-4 space-y-3">
            {insights.questions.length === 0 && <p className="text-sm text-fg-muted">No questions captured yet</p>}
            {insights.questions.slice(0, 6).map((q, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 text-xs font-bold text-brand">{i + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{q.question}</p>
                  <p className="text-xs text-fg-muted">{q.count} asked</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const InsightCard = ({ title, items, empty }) => {
  const max = Math.max(...(items?.map((i) => i.count) || [0]), 1);
  return (
    <div className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
      <h3 className="text-sm font-bold text-fg">{title}</h3>
      <div className="mt-4 space-y-3">
        {items?.length === 0 && <p className="text-sm text-fg-muted">{empty}</p>}
        {items?.slice(0, 7).map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate pr-2 text-fg">{item.name}</span>
              <span className="shrink-0 font-semibold text-fg-muted">{item.count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand/70 to-brand"
                style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
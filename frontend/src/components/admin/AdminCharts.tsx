'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminChartsProps {
  categoryStats: any[];
  topBooks: any[];
}

const COLORS = ['#6c7eff', '#2dd4bf', '#fbbf24', '#fb7185', '#a78bfa', '#4ade80', '#60a5fa', '#c084fc'];

export default function AdminCharts({ categoryStats, topBooks }: AdminChartsProps) {
  const catData = categoryStats.map(c => ({
    name: c.icon + ' ' + c.name_en,
    count: c.listing_count?.length ?? 0,
  })).filter(c => c.count > 0);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Listings by category */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-4">Listings by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={catData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8b8fa8' }} />
            <YAxis tick={{ fontSize: 9, fill: '#8b8fa8' }} />
            <Tooltip
              contentStyle={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '11px' }}
              labelStyle={{ color: '#e8e9f0' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top viewed books */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-4">Most Viewed Books</h3>
        <div className="space-y-2">
          {topBooks.slice(0, 6).map((b: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{b.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{b.author}</p>
              </div>
              <div className="h-1.5 bg-primary/20 rounded-full w-16 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${((6 - i) / 6) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    statsApi.dashboard().then(({ data: d }) => setData(d))
  }, [])

  if (!data) return <div className="page-loading">Statistika yuklanmoqda...</div>

  const { kpis, by_category, area_dynamics, road_by_class } = data
  const pieData = by_category.filter((c) => c.area_ha > 0).slice(0, 8)
    .map((c) => ({ name: c.name, value: c.area_ha, color: c.color }))

  return (
    <div className="dashboard-page">
      <h2>Statistika va tahlil</h2>
      <div className="stat-cards">
        <div className="stat-card"><span className="stat-value">{kpis.total_objects}</span><span className="stat-label">Jami obyektlar</span></div>
        <div className="stat-card"><span className="stat-value">{kpis.total_area_ha}</span><span className="stat-label">Maydon (ga)</span></div>
        <div className="stat-card"><span className="stat-value">{kpis.roads_length_km}</span><span className="stat-label">Yo‘llar (km)</span></div>
        <div className="stat-card"><span className="stat-value">{kpis.water_length_km}</span><span className="stat-label">Suv tarmoqlari (km)</span></div>
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Kategoriyalar bo‘yicha maydon</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #333' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Yillar bo‘yicha maydon dinamikasi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={area_dynamics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="year" tick={{ fill: '#aaa' }} />
              <YAxis tick={{ fill: '#aaa' }} />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #333' }} />
              <Line type="monotone" dataKey="area_ha" stroke="#2d8cf0" name="ga" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card full">
          <h3>Yo‘l toifalari bo‘yicha uzunlik</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={road_by_class}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fill: '#aaa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#aaa' }} />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #333' }} />
              <Bar dataKey="length_km" fill="#9b59b6" name="km" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

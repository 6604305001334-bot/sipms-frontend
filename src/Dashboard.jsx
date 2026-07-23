import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Package, DollarSign, AlertTriangle, XOctagon, Layers, RefreshCw, Loader2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'];
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly'); 
  const [topRankType, setTopRankType] = useState('items'); 
  const [data, setData] = useState({
    cards: { totalItems: 0, totalQty: 0, totalValue: 0, lowStockCount: 0, expiredCount: 0 },
    chartData: [],
    topItems: [],
    topCostItems: [],
    topDepts: [],
    lowStockItems: []
  });

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/dashboard/summary?timeframe=${timeframe}`);
      if (res.data.success) {
        let backendChartData = res.data.chartData || [];

        if (timeframe === 'monthly') {
          backendChartData = MONTHS_TH.map((monthLabel, index) => {
            const targetMonthNum = index + 1;
            
            const foundData = (res.data.chartData || []).find(item => {
              if (!item) return false;
              if (item.label === monthLabel || item.month === monthLabel) return true;
              const itemMonth = item.month_num || item.monthNumber || item.month;
              if (parseInt(itemMonth, 10) === targetMonthNum) return true;
              if (parseInt(item.label, 10) === targetMonthNum) return true;
              return false;
            });
            
            const actualUsage = foundData 
              ? (foundData.usage ?? foundData.withdraw ?? foundData.qty ?? foundData.quantity ?? foundData.total_amount ?? foundData.value ?? 0)
              : 0;

            return {
              label: monthLabel,
              usage: Number(actualUsage) 
            };
          });
        }

        setData({
          ...res.data,
          chartData: backendChartData
        });
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 ฟังก์ชันสร้างใบสั่งซื้อ PO ด่วน และนำทางไปยังระบบเอกสาร (e-Document)
  const handleCreatePO = async (item) => {
    const currentId = item.material_id || item.id;
    const currentName = item.material_name || item.name;
    
    const confirmAction = window.confirm(`คุณต้องการสร้างใบสั่งซื้อ (PO) ด่วนสำหรับพัสดุ: [${currentId}] ${currentName} ใช่หรือไม่?`);
    if (!confirmAction) return;

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:3000/api/edocument/upload', {
        productId: currentId,
        documentType: 'po',
        fileName: `PO-AUTO-${currentId}-${new Date().getFullYear()}.pdf`
      });

      if (response.data.success) {
        alert(`✨ สำเร็จ! สร้างเอกสาร PO เรียบร้อยแล้ว กำลังนำท่านไปยังหน้าระบบเอกสาร...`);
        
        // 🚀 สั่งย้ายหน้าไปยังหน้าระบบเอกสารอิเล็กทรอนิกส์โดยตรง
        window.location.href = '/e-document';
      }
    } catch (error) {
      console.error("Error creating PO:", error);
      alert(`❌ ไม่สามารถสร้าง PO ได้: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveTopData = () => {
    if (topRankType === 'cost') return data.topCostItems || [];
    if (topRankType === 'depts') return data.topDepts || [];
    return data.topItems || [];
  };

  const getActiveTopName = () => {
    if (topRankType === 'cost') return "ใช้งบงบประมาณมากที่สุด (บาท)";
    if (topRankType === 'depts') return "หน่วยงานเบิกใช้สูงสุด (ชิ้น)";
    return "วัสดุที่ถูกเบิกมากที่สุด (ชิ้น)";
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-sans relative">
      
      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Executive Dashboard (SIPMS)</h1>
            {isLoading && <Loader2 size={16} className="animate-spin text-blue-600" />}
          </div>
          <p className="text-xs text-slate-400">ข้อมูลสถิติคลังพัสดุและอัตราการใช้สอยเชิงบริหารจัดการแบบ Real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={isLoading} className="p-2 bg-white border rounded-lg hover:bg-slate-50 text-slate-500 shadow-sm disabled:opacity-50">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <span className="text-xs bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg">
            อัปเดต: {new Date().toLocaleDateString('th-TH')}
          </span>
        </div>
      </div>

      {/* 1. Summary Real-time Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard title="รายการวัสดุ" value={data.cards?.totalItems} unit="รายการ" icon={<Package className="text-blue-500" />} bgColor="bg-blue-50" />
        <SummaryCard title="จำนวนคงเหลือรวม" value={data.cards?.totalQty} unit="ชิ้น" icon={<Layers className="text-cyan-500" />} bgColor="bg-cyan-50" />
        <SummaryCard title="มูลค่าคงคลังรวม" value={data.cards?.totalValue >= 1e6 ? `${(data.cards.totalValue / 1e6).toFixed(2)}M` : (data.cards?.totalValue || 0).toLocaleString()} unit="บาท" icon={<DollarSign className="text-green-500" />} bgColor="bg-green-50" />
        <SummaryCard title="วัสดุใกล้หมด" value={data.cards?.lowStockCount} unit="รายการ" icon={<AlertTriangle className="text-amber-500" />} bgColor="bg-amber-50" />
        <SummaryCard title="รายการหมดอายุ" value={data.cards?.expiredCount} unit="รายการ" icon={<XOctagon className="text-red-500" />} bgColor="bg-red-50" />
      </div>

      {/* 2. Charts & Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h2 className="text-sm font-bold text-slate-700">📈 สถิติจำนวนปริมาณเบิกใช้พัสดุรวม</h2>
            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
              {['monthly', 'quarterly', 'yearly'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTimeframe(type)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${timeframe === type ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {type === 'monthly' ? 'รายเดือน' : type === 'quarterly' ? 'รายไตรมาส' : 'รายปี'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData || []} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{fontSize: 11, fill: '#64748b'}} stroke="#e2e8f0" />
                <YAxis tick={{fontSize: 11, fill: '#64748b'}} stroke="#e2e8f0" allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar 
                  dataKey="usage" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  name="จำนวนที่เบิกจ่ายออก (ชิ้น)" 
                  maxBarSize={45} 
                  minPointSize={6}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-700">🏆 สรุปอันดับ Top 10 สูงสุด</h2>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-center">
              <button onClick={() => setTopRankType('items')} className={`text-[10px] py-1 rounded font-medium ${topRankType === 'items' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500'}`}>เบิกมากสุด</button>
              <button onClick={() => setTopRankType('cost')} className={`text-[10px] py-1 rounded font-medium ${topRankType === 'cost' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500'}`}>ใช้งบมากสุด</button>
              <button onClick={() => setTopRankType('depts')} className={`text-[10px] py-1 rounded font-medium ${topRankType === 'depts' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500'}`}>หน่วยงาน</button>
            </div>
          </div>
          <div className="h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={getActiveTopData()} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                  {getActiveTopData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-[10px] text-slate-400 font-medium">อันดับสูงสุด</span>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{getActiveTopData()[0]?.name || '-'}</span>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-500 font-medium mt-1">📊 แสดงแผนภูมิ: {getActiveTopName()}</p>
        </div>
      </div>

      {/* 3. ตารางรายงานความเสี่ยง Low Stock */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <AlertTriangle className="text-amber-500" size={16} /> รายการพัสดุวิกฤตต้องจัดซื้อเร่งด่วน (Low Stock)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b font-semibold">
                <th className="p-2.5">รหัสวัสดุ</th>
                <th className="p-2.5">ชื่อพัสดุอุปกรณ์</th>
                <th className="p-2.5">คงเหลือจริง</th>
                <th className="p-2.5">เกณฑ์ขั้นต่ำ</th>
                <th className="p-2.5">ผู้จัดจำหน่ายหลัก</th>
                <th className="p-2.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(!data.lowStockItems || data.lowStockItems.length === 0) ? (
                <tr><td colSpan="6" className="text-center p-4 text-slate-400">✨ สต๊อกพัสดุทุกรายการอยู่ในระดับที่ปลอดภัยดี</td></tr>
              ) : (
                data.lowStockItems.map((item) => {
                  const materialId = item.material_id || item.id;
                  const materialName = item.material_name || item.name;
                  const minStock = item.min_stock ?? item.min ?? 0;
                  const currentQty = item.current_qty ?? item.current ?? 0;

                  return (
                    <tr key={materialId} className="border-b hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono text-slate-400 font-bold">{materialId}</td>
                      <td className="p-2.5 font-bold text-slate-700">{materialName}</td>
                      <td className="p-2.5"><span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">{currentQty}</span></td>
                      <td className="p-2.5 font-medium text-slate-400">{minStock}</td>
                      <td className="p-2.5 text-slate-500">{item.vendor_name || item.vendor || 'ไม่ระบุ'}</td>
                      <td className="p-2.5 text-center">
                        <button 
                          onClick={() => handleCreatePO(item)} 
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2.5 py-1 rounded transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          สร้าง PO
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const SummaryCard = ({ title, value, unit, icon, bgColor }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[11px] font-medium text-slate-400 mb-0.5">{title}</p>
      <h3 className="text-xl font-black text-slate-800">
        {typeof value === 'number' ? value.toLocaleString() : (value || 0)} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
      </h3>
    </div>
    <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
  </div>
);
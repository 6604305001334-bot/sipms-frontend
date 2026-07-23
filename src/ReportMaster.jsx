import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, TrendingUp, Package, AlertTriangle, 
  Clock, ShieldAlert, Download
} from 'lucide-react';

const ReportMaster = () => {
  const [reportType, setReportType] = useState('all'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [mainDepartments, setMainDepartments] = useState([]);

  // 1. ดึงรายชื่อหน่วยงานมาใส่ใน Dropdown ตัวกรอง
  useEffect(() => {
    fetch('https://sipms-backend.onrender.com/departments/main')
      .then(res => res.json())
      .then(data => setMainDepartments(data))
      .catch(err => console.error('Error fetching departments:', err));
  }, []);

  // 2. ฟังก์ชันจัดการส่งออกข้อมูลไปที่ Backend เพื่อดาวน์โหลดไฟล์ Excel จริง
  const handleExport = (reportPath) => {
    // สร้าง Query Parameters จาก State บนหน้าจอ UI
    const queryParams = new URLSearchParams({
      startDate: startDate || '',
      endDate: endDate || '',
      deptId: selectedDept || 'all'
    }).toString();

    // ยิงเปิด URL ไปยัง Backend API ตัวเจนไฟล์ Excel (เบราว์เซอร์จะดาวน์โหลดไฟล์ลงเครื่องทันที)
    const exportUrl = `http://localhost:3000/api/reports/${reportPath}?${queryParams}`;
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FileText size={24} /></div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">ระบบรายงานอัจฉริยะ (Advanced Reporting System)</h2>
          <p className="text-sm text-slate-500">เรียกดูสถิติ สรุปยอด และส่งออกข้อมูลสำหรับการบริหารจัดการพัสดุคงคลัง</p>
        </div>
      </div>

      {/* 📥 แผงควบคุมตัวกรองอเนกประสงค์ (Global Filters) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
        <div>
          <label className="block mb-1 font-bold text-slate-500">📅 เริ่มต้นวันที่</label>
          <input type="date" className="w-full border rounded-lg p-2 bg-white outline-none focus:border-emerald-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 font-bold text-slate-500">📅 ถึงวันที่</label>
          <input type="date" className="w-full border rounded-lg p-2 bg-white outline-none focus:border-emerald-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 font-bold text-slate-500">🏢 กรองตามหน่วยงาน (สำหรับรายงานเบิกจ่าย)</label>
          <select className="w-full border rounded-lg p-2 bg-white outline-none focus:border-emerald-500" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            <option value="all">แสดงทั้งหมดทุกหน่วยงาน</option>
            {mainDepartments.map(dept => (
              <option key={dept.dept_id} value={dept.dept_id}>{dept.dept_name_th}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="grid grid-cols-5 gap-1 w-full bg-slate-100 p-1 rounded-lg border">
            {['all', 'inbound', 'outbound', 'inventory', 'audit'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setReportType(tab)}
                className={`py-1 rounded-md text-[10px] font-bold uppercase transition-all ${reportType === tab ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'all' && 'ทั้งหมด'}
                {tab === 'inbound' && 'รับเข้า'}
                {tab === 'outbound' && 'เบิกจ่าย'}
                {tab === 'inventory' && 'คงคลัง'}
                {tab === 'audit' && 'Audit'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🗂️ รายการการ์ดรายงานแยกหมวดหมู่ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* === หมวดหมู่ 1: รายงานรับเข้า === */}
        {(reportType === 'all' || reportType === 'inbound') && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-sm border-b pb-2">
                <Calendar size={18} /> <span>📥 รายงานการรับเข้าพัสดุ</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">สรุปข้อมูลรายการครุภัณฑ์และวัสดุพัสดุที่รับเข้าคลังสินค้าแยกตามมิติเวลา</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleExport('inbound-daily')} className="w-full flex justify-between items-center bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 p-2 rounded-lg text-xs font-semibold border border-slate-100 transition-all">
                <span>📋 รายงานรับเข้า รายวัน</span> <Download size={14} />
              </button>
              <button onClick={() => handleExport('inbound-monthly')} className="w-full flex justify-between items-center bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 p-2 rounded-lg text-xs font-semibold border border-slate-100 transition-all">
                <span>📊 รายงานรับเข้า รายเดือน</span> <Download size={14} />
              </button>
            </div>
          </div>
        )}

        {/* === หมวดหมู่ 2: รายงานเบิกจ่าย === */}
        {(reportType === 'all' || reportType === 'outbound') && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-sm border-b pb-2">
                <TrendingUp size={18} /> <span>📤 รายงานการเบิกจ่ายวัสดุ</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">ตรวจสอบสถิติการตัดจ่ายวัสดุในคลัง เพื่อใช้ในการประเมินพฤติกรรมการใช้งาน</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleExport('withdraw-dept')} className="w-full flex justify-between items-center bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 p-2 rounded-lg text-xs font-semibold border border-slate-100 transition-all">
                <span>🏢 รายงานเบิกจ่าย ตามหน่วยงาน</span> <Download size={14} />
              </button>
              <button onClick={() => handleExport('withdraw-user')} className="w-full flex justify-between items-center bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 p-2 rounded-lg text-xs font-semibold border border-slate-100 transition-all">
                <span>👤 รายงานเบิกจ่าย ตามผู้เบิก</span> <Download size={14} />
              </button>
            </div>
          </div>
        )}

        {/* === หมวดหมู่ 3: รายงานคงคลังและมูลค่า === */}
        {(reportType === 'all' || reportType === 'inventory') && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-emerald-600 font-bold text-sm border-b pb-2">
                <Package size={18} /> <span>📦 รายงานยอดคงคลังและมูลค่า</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">รายงานตรวจสอบพัสดุทั้งหมดที่นอนนิ่งอยู่ในสโตร์ และประเมินมูลค่าสินทรัพย์รวม</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleExport('current-stock')} className="w-full flex justify-between items-center bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 p-2 rounded-lg text-xs font-semibold border border-slate-100 transition-all">
                <span>📋 ยอดพัสดุคงคลังปัจจุบัน (Current Stock)</span> <Download size={14} />
              </button>
              <button onClick={() => handleExport('inventory-valuation')} className="w-full flex justify-between items-center bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 p-2 rounded-lg text-xs font-semibold border border-slate-100 transition-all">
                <span>💰 รายงานมูลค่าคงคลัง (Valuation)</span> <Download size={14} />
              </button>
            </div>
          </div>
        )}

        {/* === หมวดหมู่ 4: รายงานแจ้งเตือนความเสี่ยงพัสดุ === */}
        {(reportType === 'all' || reportType === 'inventory') && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 text-rose-600 font-bold text-sm border-b pb-2">
                <AlertTriangle size={18} /> <span>⚠️ รายงานแจ้งเตือนความเสี่ยง</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">ระบบตรวจสอบอัจฉริยะสำหรับวัสดุที่ต้องสั่งซื้อเพิ่ม หรือวัสดุใกล้หมดอายุการใช้งาน</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => handleExport('low-stock')} className="w-full flex justify-between items-center bg-rose-50/50 hover:bg-rose-50 text-rose-700 p-2 rounded-lg text-xs font-bold border border-rose-100 transition-all">
                <span>🚨 รายงานวัสดุใกล้หมด (Low Stock)</span> <Download size={14} />
              </button>
            </div>
          </div>
        )}

        {/* === หมวดหมู่ 5: รายงาน Audit Trail === */}
        {(reportType === 'all' || reportType === 'audit') && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm border-b pb-2">
                <Clock size={18} /> <span>🔍 รายงานบันทึกประวัติการใช้งานระบบ (Audit Trail)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">บันทึกข้อมูลแบบละเอียดเพื่อความโปร่งใส: บันทึกข้อมูลว่าเจ้าหน้าที่คนใด ทำธุรกรรมอะไร (เพิ่ม/แก้ไข/ลบ) บนโมดูลไหน และเวลาใดอย่างละเอียด</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport('audit-trail')} className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold shadow-sm transition-all">
                <ShieldAlert size={16} /> ส่งออกประวัติบันทึกระบบ (Audit Trail Log)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportMaster;
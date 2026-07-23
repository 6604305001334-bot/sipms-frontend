import React, { useState } from 'react';

export default function ReportsPage() {
  // ==========================================
  // [📌 STATE] สำหรับเก็บข้อมูลตัวกรองใน React
  // ==========================================
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [inflationRate, setInflationRate] = useState(3.5); // สัดส่วนเงินเฟ้อสำหรับ AI

  // URL หลักของเซิร์ฟเวอร์หลังบ้าน (Node.js API)
  const BACKEND_URL = 'http://localhost:3000/api/reports';

  // ==========================================
  // [⚡ FUNCTIONS] ระบบจัดการคำสั่งดาวน์โหลด Excel
  // ==========================================
  
  // 1. ฟังก์ชันดาวน์โหลดรายงานทั่วไป (ผูกช่วงวันที่อัตโนมัติ)
  const downloadExcel = (endpoint, includeDate = false) => {
    let queryString = '';
    if (includeDate) {
      let params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length) queryString = `?${params.join('&')}`;
    }
    
    // ยิงลิงก์ตรงเพื่อให้ Browser ทำการดาวน์โหลดไฟล์ทันที
    window.location.href = `${BACKEND_URL}/${endpoint}${queryString}`;
  };

  // 2. ฟังก์ชันดาวน์โหลดแผนจัดซื้ออัจฉริยะประมวลผลด้วย AI
  const downloadAIPlan = () => {
    const inflationDecimal = parseFloat(inflationRate) / 100; // แปลง 3.5% เป็นทศนิยม 0.035
    window.location.href = `${BACKEND_URL}/procurement-planning?inflation=${inflationDecimal}`;
  };

  // ==========================================
  // [🎨 RENDER] โครงสร้างหน้าจอ UI ตามภาพต้นฉบับ
  // ==========================================
  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      
      {/* ส่วนหัวของระบบรายงาน */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ fontSize: '32px', backgroundColor: '#DCFCE7', padding: '10px', borderRadius: '10px', color: '#16A34A' }}>📄</div>
          <div>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: 'bold' }}>ระบบรายงานอัจฉริยะ (Advanced Reporting System)</h2>
            <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '14px' }}>เรียกดูสถิติ สรุปยอด และส่งออกข้อมูลสำหรับการบริหารจัดการพัสดุคงคลัง</p>
          </div>
        </div>

        {/* 🛠️ แถบควบคุมตัวกรอง (ฟังก์ชันวันที่แบบ Interactive บน React) */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>🗓️ เริ่มต้นวันที่</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>🗓️ ถึงวันที่</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#4B5563' }}>🏢 กรองตามหน่วยงาน (สำหรับรายงานเบิกจ่าย)</span>
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', minWidth: '220px' }}
            >
              <option value="all">แสดงทั้งหมดทุกหน่วยงาน</option>
            </select>
          </div>
        </div>

        {/* 📑 แถบสลับแท็บเมนูรายงาน (Tab Switching) */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F3F4F6', padding: '4px', borderRadius: '8px', width: 'max-content' }}>
          {['all', 'inbound', 'withdraw', 'stock', 'ai'].map((tab) => {
            const labelMap = { all: 'ทั้งหมด', inbound: 'รับเข้า', withdraw: 'เบิกจ่าย', stock: 'คงคลัง', ai: '🔮 AI วางแผนจัดซื้อ' };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? (tab === 'ai' ? '#065F46' : '#FFFFFF') : 'transparent',
                  color: isActive ? (tab === 'ai' ? '#FFFFFF' : '#111827') : '#4B5563',
                  boxShadow: isActive && tab !== 'ai' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          [🗂️ GRID CARDS] แสดงกล่องกลุ่มรายงาน
         ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
        
        {/* 🟦 1. รายงานการรับเข้าพัสดุ */}
        {(activeTab === 'all' || activeTab === 'inbound') && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', borderTop: '4px solid #1E40AF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#1E40AF', fontSize: '16px', fontWeight: 'bold' }}>🟦 รายงานการรับเข้าพัสดุ</h3>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '13px' }}>สรุปข้อมูลรายการครุภัณฑ์และวัสดุพัสดุที่รับเข้าคลังสินค้าแยกตามมิติเวลา</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => downloadExcel('inbound-daily', true)} style={styles.listButton}>
                <span>📋 รายงานรับเข้า รายวัน</span> <span style={{ fontSize: '16px' }}>📥</span>
              </button>
              <button onClick={() => downloadExcel('inbound-monthly', true)} style={styles.listButton}>
                <span>📊 รายงานรับเข้า รายเดือน</span> <span style={{ fontSize: '16px' }}>📥</span>
              </button>
            </div>
          </div>
        )}

        {/* 🟧 2. รายงานการเบิกจ่ายวัสดุ */}
        {(activeTab === 'all' || activeTab === 'withdraw') && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', borderTop: '4px solid #C2410C', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#C2410C', fontSize: '16px', fontWeight: 'bold' }}>🟧 รายงานการเบิกจ่ายวัสดุ</h3>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '13px' }}>ตรวจสอบสถิติการตัดจ่ายวัสดุในคลัง เพื่อใช้ในการประเมินพฤติกรรมการใช้งาน</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => downloadExcel('withdraw-dept')} style={styles.listButton}>
                <span>🏢 รายงานเบิกจ่าย ตามหน่วยงาน</span> <span style={{ fontSize: '16px' }}>📥</span>
              </button>
              <button onClick={() => downloadExcel('withdraw-user')} style={styles.listButton}>
                <span>👤 รายงานเบิกจ่าย ตามผู้เบิก</span> <span style={{ fontSize: '16px' }}>📥</span>
              </button>
            </div>
          </div>
        )}

        {/* 🟩 3. รายงานยอดคงคลังและมูลค่า */}
        {(activeTab === 'all' || activeTab === 'stock') && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', borderTop: '4px solid #047857', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#047857', fontSize: '16px', fontWeight: 'bold' }}>🟩 รายงานยอดคงคลังและมูลค่า</h3>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '13px' }}>รายงานตรวจสอบพัสดุทั้งหมดที่นอนนิ่งอยู่ในสโตร์ และประเมินมูลค่าสินทรัพย์รวม</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => downloadExcel('current-stock')} style={styles.listButton}>
                <span>📜 ยอดพัสดุคงคลังปัจจุบัน (Current Stock)</span> <span style={{ fontSize: '16px' }}>📥</span>
              </button>
              <button onClick={() => downloadExcel('inventory-valuation')} style={styles.listButton}>
                <span>💰 รายงานมูลค่าคงคลัง (Valuation)</span> <span style={{ fontSize: '16px' }}>📥</span>
              </button>
            </div>
          </div>
        )}

        {/* 🟥 4. รายงานแจ้งเตือนความเสี่ยง */}
        {(activeTab === 'all' || activeTab === 'stock') && (
          <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', borderTop: '4px solid #DC2626', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#DC2626', fontSize: '16px', fontWeight: 'bold' }}>🟥 รายงานแจ้งเตือนความเสี่ยง</h3>
            <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '13px' }}>ระบบตรวจสอบอัจฉริยะสำหรับวัสดุที่ต้องสั่งซื้อเพิ่ม หรือพัสดุเสี่ยงขาดแคลน</p>
            <button 
              onClick={() => downloadExcel('low-stock')} 
              style={{ ...styles.listButton, backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', fontWeight: '500' }}
            >
              <span>🚨 รายงานวัสดุใกล้หมด (Low Stock)</span> <span style={{ fontSize: '16px' }}>📥</span>
            </button>
          </div>
        )}

        {/* 🔮 5. โมดูลทำนายและวางแผนจัดซื้อขั้นสูงด้วย AI */}
        {(activeTab === 'all' || activeTab === 'ai') && (
          <div style={{ backgroundColor: '#FFFBEB', padding: '20px', borderRadius: '12px', borderTop: '4px solid #D97706', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#B45309', fontSize: '16px', fontWeight: 'bold' }}>🔮 AI ประมวลผลและวางแผนจัดซื้อผูกอัตราเงินเฟ้อ</h3>
            <p style={{ margin: '0 0 16px 0', color: '#78350F', fontSize: '13px' }}>วิเคราะห์ข้อมูลธุรกรรมย้อนหลังเพื่อคำนวณ Safety Stock, ROP และงบจัดซื้อปีถัดไป</p>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563' }}>เงินเฟ้อคาดการณ์:</span>
              <input 
                type="number" 
                value={inflationRate} 
                onChange={(e) => setInflationRate(e.target.value)}
                step="0.1" 
                style={{ width: '80px', padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px' }}
              /> 
              <span style={{ fontSize: '14px', color: '#4B5563' }}>%</span>
            </div>

            <button onClick={downloadAIPlan} style={styles.aiButton}>
              <span>⚡ ดาวน์โหลดแผนจัดซื้อประจำปีอัจฉริยะ (.xlsx)</span> <span style={{ fontSize: '16px' }}>📥</span>
            </button>
          </div>
        )}

      </div>

      {/* 📋 6. รายงานประวัติใช้งานระบบ (Audit Trail) */}
      {(activeTab === 'all' || activeTab === 'audit') && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', borderTop: '4px solid #334155', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#334155', fontSize: '16px', fontWeight: 'bold' }}>📋 รายงานบันทึกประวัติการใช้งานระบบ (Audit Trail)</h3>
          <p style={{ margin: '0 0 16px 0', color: '#6B7280', fontSize: '13px' }}>บันทึกข้อมูลแบบละเอียดเพื่อความโปร่งใส: ใคร ทำธุรกรรมอะไร บนโมดูลไหน อย่างละเอียด</p>
          <button onClick={() => downloadExcel('audit-trail')} style={styles.auditButton}>
            🛡️ ส่งออกประวัติบันทึกในระบบ (Audit Trail Log)
          </button>
        </div>
      )}

    </div>
  );
}

// ==========================================
// [💅 STYLES] รวมการจัดการ CSS Styles แบบ Inline
// ==========================================
const styles = {
  listButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  aiButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#065F46',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#FFFFFF',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
  },
  auditButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.2s',
  }
};
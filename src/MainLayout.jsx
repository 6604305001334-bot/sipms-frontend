import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Building2, 
  LogOut,
  ChevronRight,
  UserCircle,
  Menu,
  X,
  PlusCircle,
  FileText,
  RotateCcw,
  ClipboardCheck,
  BarChart3,
  FolderOpen,
  ScanLine,
  Activity 
} from 'lucide-react';

import Dashboard from './Dashboard';
import MaterialMaster from './MaterialMaster'; 
import CategoryMaster from './CategoryMaster';
import DepartmentMaster from './DepartmentMaster';
import VendorMaster from './VendorMaster';
import StockIn from './StockIn'; 
import Withdraw from './Withdraw'; 
import Return from './Return'; 
import StockCount from './StockCount'; 
import ReportMaster from './ReportMaster'; 
import EDocumentMaster from './edocumentmaster'; 
import QRScanner from './QRScanner'; 
import AuditLog from './AuditLog'; 
import Login from './Login';

// 🎯 ตั้งค่า URL สำหรับ Backend API
// 🎯 ตั้งค่า URL สำหรับ Backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MainLayout = () => {
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('');
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 🌟 ฟังก์ชันช่วยเช็กว่าเป็น Requester หรือไม่
  const checkIsRequester = (roleStr) => {
    if (!roleStr) return false;
    return roleStr.includes('ผู้ขอเบิก') || roleStr.includes('Requester');
  };

  // 🔄 ตรวจสอบสถานะและตั้งค่าหน้าแรกตาม Role
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // 🎯 กำหนดหน้าเริ่มต้นให้ตรงตาม Role (ใช้ .includes เพื่อความแม่นยำ)
        if (checkIsRequester(userData.role)) {
          setActiveMenu('withdraw'); // ผู้ขอเบิกเปิดมาเด้งไปหน้าเบิกทันที
        } else {
          setActiveMenu('dashboard');
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = async () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      try {
        if (user) {
          // ✅ เปลี่ยน URL เป็น Render API backend
          await axios.post(`${API_BASE_URL}/api/logs`, {
            user: `${user.username} (${user.role || 'ผู้ใช้งาน'})`,
            action: 'logout',
            module: 'ระบบเข้าสู่ระบบ (Authentication)',
            details: 'ออกจากระบบเรียบร้อยแล้ว',
            ip_address: '127.0.0.1'
          });
        }
      } catch (err) {
        console.error('Logout log error:', err);
      } finally {
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  if (!user) {
    return <Login onLoginSuccess={(userData) => {
      setUser(userData);
      setActiveMenu(checkIsRequester(userData.role) ? 'withdraw' : 'dashboard');
    }} />;
  }

  // 🔒 เช็กสิทธิ์การมองเห็นเมนูตาม Role
  const role = user.role || 'เจ้าหน้าที่พัสดุ';
  const isRequester = checkIsRequester(role);
  const isApprover = role.includes('หัวหน้างาน') || role.includes('Approver');
  const isStorekeeper = !isRequester && !isApprover; // ถ้าไม่ใช่ Requester และไม่ใช่อุปนายก/หัวหน้า ให้เป็นพัสดุ

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return isRequester ? <Withdraw /> : <Dashboard />;
      case 'qr_scanner': return <QRScanner />; 
      case 'stock_in': return <StockIn />;
      case 'withdraw': return <Withdraw />; 
      case 'return': return <Return />; 
      case 'stock_count': return <StockCount />; 
      case 'reports': return <ReportMaster />; 
      case 'audit_log': return <AuditLog />; 
      case 'edocument': return <EDocumentMaster />; 
      case 'material': return <MaterialMaster />;
      case 'category': return <CategoryMaster />;
      case 'department': return <DepartmentMaster />;
      case 'vendor': return <VendorMaster />;
      default: return isRequester ? <Withdraw /> : <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-700">
      
      {/* ─── SIDEBAR ─── */}
      <aside className={`bg-white flex flex-col fixed h-full border-r border-slate-200/80 z-20 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}>
        
        {/* ชื่อระบบ */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-1.5 rounded-full bg-blue-600"></div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-slate-900">ระบบคลังพัสดุ</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sipms Warehouse</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* รายการเมนู (แสดงเฉพาะที่เกี่ยวกับ Role นั้นๆ) */}
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          
          <div className="space-y-1">
            {/* 1. ภาพรวมระบบ (ซ่อนถาวรสำหรับ ผู้ขอเบิกพัสดุ) */}
            {!isRequester && (
              <button
                onClick={() => setActiveMenu('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMenu === 'dashboard' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard size={17} />
                <span>ภาพรวมระบบ</span>
              </button>
            )}

            {/* 2. สแกน QR Code */}
            <button
              onClick={() => setActiveMenu('qr_scanner')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'qr_scanner' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ScanLine size={17} />
              <span>สแกน QR Code / Barcode</span>
            </button>

            {/* 3. บันทึกรับพัสดุ (เฉพาะ เจ้าหน้าที่) */}
            {isStorekeeper && (
              <button
                onClick={() => setActiveMenu('stock_in')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMenu === 'stock_in' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <PlusCircle size={17} />
                <span>บันทึกรับพัสดุ</span>
              </button>
            )}

            {/* 4. บันทึกเบิกพัสดุ (ทุกคนเห็นได้) */}
            <button
              onClick={() => setActiveMenu('withdraw')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'withdraw' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText size={17} />
              <span>{isRequester ? 'ส่งคำขอเบิกพัสดุ' : 'บันทึกเบิกพัสดุ'}</span>
            </button>

            {/* 5. บันทึกคืนพัสดุ (ทุกคนเห็นได้) */}
            <button
              onClick={() => setActiveMenu('return')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'return' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <RotateCcw size={17} />
              <span>{isRequester ? 'ส่งคำขอคืนพัสดุ' : 'บันทึกคืนพัสดุ'}</span>
            </button>

            {/* 6. ตรวจนับพัสดุ (เฉพาะ เจ้าหน้าที่) */}
            {isStorekeeper && (
              <button
                onClick={() => setActiveMenu('stock_count')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMenu === 'stock_count' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck size={17} />
                <span>ตรวจนับพัสดุ (Stock Count)</span>
              </button>
            )}

            {/* 7. รายงาน (เฉพาะ เจ้าหน้าที่ / หัวหน้า) */}
            {!isRequester && (
              <button
                onClick={() => setActiveMenu('reports')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMenu === 'reports' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={17} />
                <span>ระบบรายงานและตรวจสอบ</span>
              </button>
            )}

            {/* 8. Audit Log (เฉพาะ เจ้าหน้าที่ / หัวหน้า) */}
            {!isRequester && (
              <button
                onClick={() => setActiveMenu('audit_log')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMenu === 'audit_log' ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Activity size={17} />
                <span>ประวัติการใช้งาน (Audit Log)</span>
              </button>
            )}

            {/* 9. เอกสารอิเล็กทรอนิกส์ (เฉพาะ เจ้าหน้าที่) */}
            {isStorekeeper && (
              <button
                onClick={() => setActiveMenu('edocument')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeMenu === 'edocument' ? 'bg-teal-50 text-teal-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FolderOpen size={17} />
                <span>ระบบเอกสารอิเล็กทรอนิกส์</span>
              </button>
            )}
          </div>

          {/* หมวดข้อมูลพื้นฐาน (แสดงเฉพาะ เจ้าหน้าที่พัสดุ) */}
          {isStorekeeper && (
            <>
              <hr className="border-slate-100 mx-2" />
              <div>
                <button 
                  type="button"
                  onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                  className="w-full px-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between hover:text-slate-600 transition-colors"
                >
                  <span>ข้อมูลพื้นฐาน</span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${isMasterDataOpen ? 'rotate-90' : ''}`} />
                </button>

                {isMasterDataOpen && (
                  <div className="space-y-0.5 pl-2 mt-1">
                    <button onClick={() => setActiveMenu('material')} className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-md text-sm transition-all ${activeMenu === 'material' ? 'text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-900'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>รายการพัสดุ</span>
                    </button>
                    <button onClick={() => setActiveMenu('category')} className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-md text-sm transition-all ${activeMenu === 'category' ? 'text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-900'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>หมวดหมู่พัสดุ</span>
                    </button>
                    <button onClick={() => setActiveMenu('department')} className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-md text-sm transition-all ${activeMenu === 'department' ? 'text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-900'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>หน่วยงานผู้เบิก</span>
                    </button>
                    <button onClick={() => setActiveMenu('vendor')} className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-md text-sm transition-all ${activeMenu === 'vendor' ? 'text-blue-600 font-medium' : 'text-slate-500 hover:text-slate-900'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span>บริษัทผู้จัดจำหน่าย</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

        </nav>

        {/* ส่วนผู้ใช้งานด้านล่างสุด */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 px-2 py-1">
            <UserCircle size={28} className="text-slate-400" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.username}</p>
              <p className="text-[10px] text-slate-400 truncate">{role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-medium transition-all"
          >
            <LogOut size={13} />
            <span>ออกจากระบบ</span>
          </button>
        </div>

      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white border-b border-slate-100 h-14 flex items-center px-6 justify-between sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-md hover:bg-slate-50 text-slate-500 transition-colors">
            <Menu size={18} />
          </button>
          <div className="text-xs text-slate-400 font-medium">
            ปีงบประมาณ ค.ศ. 2026
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

    </div>
  );
};

export default MainLayout;
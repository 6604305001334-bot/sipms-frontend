import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Building2, X } from 'lucide-react';

// 🎯 ตั้งค่า URL สำหรับ Backend API ให้ยืดหยุ่น (Local / Production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const VendorMaster = () => {
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' หรือ 'edit'
  
  // ปรับฟิลด์ในฟอร์มให้ตรงและรองรับโครงสร้างตารางจริงใน MySQL
  const [formData, setFormData] = useState({ 
    id: '', 
    code: '', 
    name: '', 
    address: '', 
    tax_id: '', 
    phone: '', 
    email: '' 
  });

  // ฟังก์ชันดึงข้อมูลจากหลังบ้านผ่าน API_BASE_URL
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`);
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // ฟังก์ชันค้นหาข้อมูลตามชื่อผู้จัดจำหน่าย หรือรหัส
  const filteredVendors = vendors.filter(vendor => 
    (vendor.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (vendor.vendor_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (mode, vendor = null) => {
    setModalMode(mode);
    if (mode === 'edit' && vendor) {
      setFormData({
        id: vendor.vendor_id,
        code: vendor.vendor_id,
        name: vendor.vendor_name || '',
        address: vendor.address || '',
        tax_id: vendor.tax_id || '',
        phone: vendor.phone || '',
        email: vendor.email || ''
      });
    } else {
      setFormData({ 
        id: '', 
        code: '', // ให้ผู้ใช้งานกำหนดรหัสสำหรับเพิ่มใหม่เองตามรูปแบบ DB (เช่น VEND003)
        name: '', 
        address: '', 
        tax_id: '', 
        phone: '', 
        email: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      vendor_id: formData.code,
      vendor_name: formData.name,
      address: formData.address,
      tax_id: formData.tax_id,
      phone: formData.phone,
      email: formData.email
    };

    try {
      if (modalMode === 'add') {
        const response = await fetch(`${API_BASE_URL}/vendors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
          alert('✨ เพิ่มข้อมูลผู้จัดจำหน่ายสำเร็จ!');
          fetchVendors();
          setIsModalOpen(false);
        } else {
          alert(`เกิดข้อผิดพลาด: ${result.error}`);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/vendors/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          alert('📝 แก้ไขข้อมูลผู้จัดจำหน่ายสำเร็จ!');
          fetchVendors();
          setIsModalOpen(false);
        } else {
          alert('❌ ไม่สามารถอัปเดตข้อมูลได้');
        }
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบผู้จัดจำหน่ายนี้ใช่หรือไม่?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/vendors/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('🗑️ ลบผู้จัดจำหน่ายออกจากระบบแล้ว');
          fetchVendors();
        } else {
          alert('❌ ไม่สามารถลบได้ (อาจมีข้อมูลพัสดุใช้งานผู้จัดจำหน่ายรายนี้อยู่)');
        }
      } catch (error) {
        console.error("Error deleting vendor:", error);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Building2 size={24} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">จัดการข้อมูลผู้จัดจำหน่าย (Vendor)</h2>
            <p className="text-sm text-slate-500">เพิ่ม ลบ แก้ไข ข้อมูลร้านค้าหรือบริษัทที่ติดต่อสั่งซื้อ</p>
          </div>
        </div>
        <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm">
          <Plus size={16} /> เพิ่มผู้จัดจำหน่าย
        </button>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-slate-400" /></div>
        <input type="text" placeholder="ค้นหารหัส หรือชื่อบริษัท/ร้านค้า..." className="pl-10 pr-4 py-2 w-full md:w-1/3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-3 text-sm font-semibold">รหัส Vendor</th>
              <th className="p-3 text-sm font-semibold">ชื่อผู้จัดจำหน่าย/บริษัท</th>
              <th className="p-3 text-sm font-semibold">เลขประจำตัวผู้เสียภาษี</th>
              <th className="p-3 text-sm font-semibold">เบอร์โทรศัพท์</th>
              <th className="p-3 text-sm font-semibold">อีเมล</th>
              <th className="p-3 text-sm font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor) => (
              <tr key={vendor.vendor_id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-sm font-bold text-blue-600">{vendor.vendor_id}</td>
                <td className="p-3 text-sm text-slate-800 max-w-xs truncate" title={vendor.address}>
                  <div>{vendor.vendor_name}</div>
                  <div className="text-xs text-slate-400 truncate">{vendor.address || '-'}</div>
                </td>
                <td className="p-3 text-sm text-slate-600">{vendor.tax_id || '-'}</td>
                <td className="p-3 text-sm text-slate-600">{vendor.phone || '-'}</td>
                <td className="p-3 text-sm text-slate-600">{vendor.email || '-'}</td>
                <td className="p-3 text-sm text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal('edit', vendor)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(vendor.vendor_id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVendors.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-sm text-slate-400">ไม่พบข้อมูลผู้จัดจำหน่ายในระบบ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ฟอร์ม เพิ่ม/แก้ไข */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{modalMode === 'add' ? '➕ เพิ่มผู้จัดจำหน่ายใหม่' : '✏️ แก้ไขข้อมูลผู้จัดจำหน่าย'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัส Vendor</label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น VEND003"
                  disabled={modalMode === 'edit'} 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อร้านค้า / บริษัท</label>
                <input type="text" required placeholder="เช่น บริษัท สมใจค้าปลีก จำกัด" className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                <input type="text" placeholder="เลข 13 หลัก" className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" value={formData.tax_id} onChange={(e) => setFormData({...formData, tax_id: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
                <input type="text" placeholder="เช่น 077-xxx-xxx" className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล (Email)</label>
                <input type="email" placeholder="example@vendor.com" className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ที่อยู่</label>
                <textarea rows="2" placeholder="ที่อยู่บริษัท..." className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMaster;
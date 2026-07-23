import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Layers, X } from 'lucide-react';

const CategoryMaster = () => {
  // เปลี่ยนจาก Mock Data เป็น State ว่าง เพื่อรอรับข้อมูลจริงจาก MySQL
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  // ปรับโครงสร้าง formData ให้ตรงกับ Field ในตาราง MySQL
  const [formData, setFormData] = useState({ 
    id: '', 
    code: '', 
    name_th: '', 
    name_en: '' 
  });

  // 1. ฟังก์ชันดึงข้อมูลหมวดหมู่จากหลังบ้าน
  const fetchCategories = async () => {
    try {
      const response = await fetch('https://sipms-backend.onrender.com/categories');
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // เรียกโหลดข้อมูลทันทีที่เปิดหน้านี้ขึ้นมา
  useEffect(() => {
    fetchCategories();
  }, []);

  // กรองข้อมูลในตารางตามช่องค้นหา (ค้นหาได้ทั้งชื่อไทยและรหัส)
  const filteredCategories = categories.filter(cat => 
    (cat.category_name_th || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.category_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ฟังก์ชันเปิด Modal สำหรับ เพิ่ม หรือ แก้ไขข้อมูล
  const openModal = (mode, cat = null) => {
    setModalMode(mode);
    if (mode === 'edit' && cat) {
      setFormData({
        id: cat.category_id,
        code: cat.category_id,
        name_th: cat.category_name_th || '',
        name_en: cat.category_name_en || ''
      });
    } else {
      // โหมดเพิ่มข้อมูลใหม่ ตั้งรหัสว่างไว้ให้กรอกเอง หรือใช้ระบบรันอัตโนมัติ
      setFormData({ id: '', code: '', name_th: '', name_en: '' });
    }
    setIsModalOpen(true);
  };

  // 2. ฟังก์ชันบันทึกข้อมูล (ยิงข้อมูลเข้าสู่ระบบหลังบ้านจริง)
  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      name_th: formData.name_th,
      name_en: formData.name_en
    };

    try {
      if (modalMode === 'add') {
        // ✨ โหมดเพิ่มข้อมูลหมวดหมู่ใหม่ (POST)
        const response = await fetch('https://sipms-backend.onrender.com/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
          alert('✨ เพิ่มข้อมูลหมวดหมู่เรียบร้อยแล้ว!');
          fetchCategories();
          setIsModalOpen(false);
        } else {
          alert(`เกิดข้อผิดพลาด: ${result.error}`);
        }
      } else {
        // 🛠️ โหมดแก้ไขข้อมูลหมวดหมู่เดิม (PUT)
        const response = await fetch(`https://sipms-backend.onrender.com/categories/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          alert('📝 แก้ไขข้อมูลหมวดหมู่สำเร็จ!');
          fetchCategories();
          setIsModalOpen(false);
        } else {
          alert('❌ ไม่สามารถอัปเดตข้อมูลได้');
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // 3. ฟังก์ชันลบข้อมูลหมวดหมู่ออกจาก MySQL
  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบหมวดหมู่วัสดุนี้ใช่หรือไม่? (พัสดุที่ผูกกับหมวดหมู่นี้อาจได้รับผลกระทบ)')) {
      try {
        const response = await fetch(`https://sipms-backend.onrender.com/categories/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('🗑️ ลบหมวดหมู่เรียบร้อยแล้ว');
          fetchCategories();
        } else {
          alert('❌ ไม่สามารถลบข้อมูลได้เนื่องจากหมวดหมู่นี้ถูกใช้งานอยู่');
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        alert('❌ เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Layers size={24} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">จัดการข้อมูลหมวดหมู่วัสดุ</h2>
            <p className="text-sm text-slate-500">จัดกลุ่มประเภทพัสดุในคลังสินค้าเพื่อง่ายต่อการคัดกรอง</p>
          </div>
        </div>
        <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm">
          <Plus size={16} /> เพิ่มหมวดหมู่
        </button>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-slate-400" /></div>
        <input type="text" placeholder="ค้นหาชื่อหรือรหัสหมวดหมู่..." className="pl-10 pr-4 py-2 w-full md:w-1/3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-3 text-sm font-semibold">รหัสหมวดหมู่</th>
              <th className="p-3 text-sm font-semibold">ชื่อหมวดหมู่ (ภาษาไทย)</th>
              <th className="p-3 text-sm font-semibold">ชื่อหมวดหมู่ (ภาษาอังกฤษ)</th>
              <th className="p-3 text-sm font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat) => (
              <tr key={cat.category_id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-700">
                <td className="p-3 text-sm font-bold text-blue-600">{cat.category_id}</td>
                <td className="p-3 text-sm text-slate-800">{cat.category_name_th}</td>
                <td className="p-3 text-sm text-slate-500">{cat.category_name_en || '-'}</td>
                <td className="p-3 text-sm text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal('edit', cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="แก้ไข"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(cat.category_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="ลบ"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-sm text-slate-500">ไม่พบข้อมูลหมวดหมู่ในระบบ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal หน้าต่างป๊อปอัปสำหรับเพิ่ม/แก้ไขข้อมูล */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{modalMode === 'add' ? '➕ เพิ่มหมวดหมู่ใหม่' : '✏️ แก้ไขหมวดหมู่'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสหมวดหมู่</label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น CAT05"
                  disabled={modalMode === 'edit'} // โหมดแก้ไขห้ามแก้รหัสหลัก Key
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อหมวดหมู่พัสดุ (ไทย)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="เช่น วัสดุสำนักงาน"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                  value={formData.name_th} 
                  onChange={(e) => setFormData({...formData, name_th: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อหมวดหมู่พัสดุ (อังกฤษ)</label>
                <input 
                  type="text" 
                  placeholder="เช่น Office Supplies"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                  value={formData.name_en} 
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMaster;
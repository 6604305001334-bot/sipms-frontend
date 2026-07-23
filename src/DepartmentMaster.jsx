import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Network, X } from 'lucide-react';

const DepartmentMaster = () => {
  // ระบบข้อมูลรับค่าจริงจาก API 
  const [mainDepartments, setMainDepartments] = useState([]); // ฝ่ายหลัก
  const [subDepartments, setSubDepartments] = useState([]);   // หน่วยงานย่อย
  
  const [selectedMainDept, setSelectedMainDept] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' หรือ 'edit'
  const [deptType, setDeptType] = useState('sub');   // 'main' (ฝ่ายหลัก) หรือ 'sub' (หน่วยงานย่อย)
  
  // โครงสร้าง state ให้ผูกตามชื่อฟิลด์ใน MySQL จริง
  const [formData, setFormData] = useState({ 
    id: '', 
    code: '', 
    parentId: '', 
    name_th: '', 
    name_en: '' 
  });

  // ฟังก์ชันดึงข้อมูลฝ่ายหลักและหน่วยงานย่อย
  const fetchDepartmentData = async () => {
    try {
      // ดึงฝ่ายหลัก (parent_id IS NULL)
      const resMain = await fetch('https://sipms-backend.onrender.com/departments/main');
      const dataMain = await resMain.json();
      setMainDepartments(dataMain);

      // ดึงหน่วยงานย่อยทั้งหมด
      const resSub = await fetch('https://sipms-backend.onrender.com/departments/sub-all');
      const dataSub = await resSub.json();
      setSubDepartments(dataSub);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  // นับจำนวนสถิติด้านซ้ายจากข้อมูลจริงในระบบ
  const totalCount = subDepartments.length;
  
  const getCountByMainId = (mainId) => {
    return subDepartments.filter(d => d.parent_id === mainId).length;
  };

  // ตัวกรองการค้นหาและการคลิกแท็บฝ่ายหลัก
  const filteredDepts = subDepartments.filter(d => {
    const matchFilter = selectedMainDept === 'ทั้งหมด' || d.parent_id === selectedMainDept;
    const matchSearch = 
      (d.dept_name_th || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.dept_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openModal = (mode, type = 'sub', dept = null) => {
    setModalMode(mode);
    setDeptType(type); // ตั้งค่าประเภทเริ่มต้นที่จะเปิด (ฝ่ายหลัก หรือ หน่วยงานย่อย)
    
    if (mode === 'edit' && dept) {
      const isMainDepartment = !dept.parent_id;
      setDeptType(isMainDepartment ? 'main' : 'sub');
      setFormData({
        id: dept.dept_id,
        code: dept.dept_id,
        parentId: dept.parent_id || '',
        name_th: dept.dept_name_th || '',
        name_en: dept.dept_name_en || ''
      });
    } else {
      // โหมดเพิ่มข้อมูลใหม่
      setFormData({ 
        id: '', 
        code: '', 
        parentId: type === 'main' ? '' : (mainDepartments[0]?.dept_id || ''), 
        name_th: '', 
        name_en: '' 
      });
    }
    setIsModalOpen(true);
  };

  // ดักฟังตอนผู้ใช้กดสลับปุ่ม Tab ระดับหน่วยงานภายใน Modal เพื่อ Reset ค่า parentId ให้ถูกต้อง
  useEffect(() => {
    if (modalMode === 'add' && isModalOpen) {
      setFormData(prev => ({
        ...prev,
        parentId: deptType === 'main' ? '' : (mainDepartments[0]?.dept_id || '')
      }));
    }
  }, [deptType, modalMode, isModalOpen, mainDepartments]);

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      // ถ้าเลือกประเภท 'main' ให้ส่งค่าว่าง (เพื่อให้ Backend นำไปแปลงเป็น NULL ใน DB)
      parent_id: deptType === 'main' ? '' : formData.parentId,
      name_th: formData.name_th,
      name_en: formData.name_en
    };

    try {
      if (modalMode === 'add') {
        const response = await fetch('https://sipms-backend.onrender.com/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
          alert(`✨ เพิ่ม${deptType === 'main' ? 'ฝ่ายหลัก' : 'หน่วยงานย่อย'}เรียบร้อยแล้ว!`);
          fetchDepartmentData();
          setIsModalOpen(false);
        } else {
          alert(`เกิดข้อผิดพลาด: ${result.error}`);
        }
      } else {
        const response = await fetch(`https://sipms-backend.onrender.com/departments/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          alert('📝 แก้ไขข้อมูลโครงสร้างหน่วยงานสำเร็จ!');
          fetchDepartmentData();
          setIsModalOpen(false);
        } else {
          alert('❌ ไม่สามารถอัปเดตข้อมูลได้');
        }
      }
    } catch (error) {
      console.error("Error saving department:", error);
      alert('❌ เกิดข้อผิดพลาดทางเทคนิค');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบโครงสร้างหน่วยงานนี้ใช่หรือไม่? หากเป็นฝ่ายหลัก งานย่อยที่สังกัดจะถูกกระทบ')) {
      try {
        const response = await fetch(`https://sipms-backend.onrender.com/departments/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('🗑️ ลบหน่วยงานออกจากระบบแล้ว');
          fetchDepartmentData();
        } else {
          alert('❌ ไม่สามารถลบข้อมูลได้เนื่องจากหน่วยงานนี้มีรายการเชื่อมโยงอยู่');
        }
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Network size={24} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">โครงสร้างหน่วยงานผู้เบิก (Department Master Data)</h2>
            <p className="text-sm text-slate-500">จัดการแผนก งาน และสาขาวิชาต่างๆ ภายในวิทยาลัยสำหรับการตัดสต๊อกพัสดุ</p>
          </div>
        </div>
        
        {/* กลุ่มปุ่มเพิ่มข้อมูล 2 ประเภทแยกกัน */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => openModal('add', 'main')} 
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            <Plus size={16} /> เพิ่มฝ่ายหลัก
          </button>
          <button 
            onClick={() => openModal('add', 'sub')} 
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            <Plus size={16} /> เพิ่มหน่วยงานย่อย
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* แถบด้านซ้าย - แบ่งตามฝ่ายหลักจริงใน DB */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs h-fit space-y-2">
          <div className="flex justify-between items-center mb-3 px-2">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">📁 แบ่งตามฝ่ายหลัก</h3>
          </div>
          <button onClick={() => setSelectedMainDept('ทั้งหมด')} className={`w-full flex justify-between items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectedMainDept === 'ทั้งหมด' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span>แสดงทุกฝ่าย</span> <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs text-slate-500">{totalCount}</span>
          </button>
          
          {mainDepartments.map(main => (
            <div key={main.dept_id} className="group flex items-center justify-between rounded-lg hover:bg-slate-50 transition-colors pr-2">
              <button onClick={() => setSelectedMainDept(main.dept_id)} className={`flex-1 flex justify-between items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${selectedMainDept === main.dept_id ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}>
                <span className="truncate">{main.dept_name_th}</span> 
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs text-slate-500 flex-shrink-0 ml-1">{getCountByMainId(main.dept_id)}</span>
              </button>
              {/* ปุ่มแก้ไข/ลบ สำหรับฝ่ายหลักโดยเฉพาะบนแถบซ้าย (จะแสดงเมื่อโฮเวอร์) */}
              <div className="hidden group-hover:flex items-center gap-0.5 pl-1">
                <button onClick={() => openModal('edit', 'main', main)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="แก้ไขฝ่ายหลัก"><Edit size={12} /></button>
                <button onClick={() => handleDelete(main.dept_id)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="ลบฝ่ายหลัก"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* แถบตารางด้านขวา */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700 text-sm">📋 งานย่อยและสาขาวิชาในระบบ ({filteredDepts.length})</h3>
            <div className="relative w-1/2 max-w-xs">
              <Search className="absolute inset-y-0 left-0 pl-2.5 h-4 w-4 my-auto text-slate-400" />
              <input type="text" placeholder="ค้นหารหัส หรือ ชื่องาน..." className="pl-9 pr-3 py-1.5 w-full border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5 text-xs font-semibold">รหัสหน่วยงาน</th>
                  <th className="p-2.5 text-xs font-semibold">ชื่อฝ่ายหลัก (สายงาน)</th>
                  <th className="p-2.5 text-xs font-semibold">ชื่อหน่วยงานย่อย / งาน</th>
                  <th className="p-2.5 text-xs font-semibold">ชื่อภาษาอังกฤษ</th>
                  <th className="p-2.5 text-xs font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map((dept) => {
                  const parent = mainDepartments.find(m => m.dept_id === dept.parent_id);
                  return (
                    <tr key={dept.dept_id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-700">
                      <td className="p-2.5 text-xs font-bold text-blue-600">{dept.dept_id}</td>
                      <td className="p-2.5 text-xs text-slate-500">{parent ? parent.dept_name_th : <span className="text-slate-400 italic">เป็นฝ่ายหลักสูงสุด</span>}</td>
                      <td className="p-2.5 text-xs font-medium text-slate-800">{dept.dept_name_th}</td>
                      <td className="p-2.5 text-xs text-slate-400 italic">{dept.dept_name_en || '-'}</td>
                      <td className="p-2.5 text-xs text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openModal('edit', 'sub', dept)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(dept.dept_id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDepts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-xs text-slate-400">ไม่พบข้อมูลหน่วยงานย่อยในระบบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* หน้าต่างป๊อปอัป (Modal) สำหรับเพิ่มและแก้ไขข้อมูล */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">
                {modalMode === 'add' ? '➕ เพิ่มโครงสร้างหน่วยงานใหม่' : `✏️ แก้ไขข้อมูล${deptType === 'main' ? 'ฝ่ายหลัก' : 'หน่วยงานย่อย'}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* ส่วนสลับประเภท (แสดงเฉพาะตอนสร้างใหม่ เพื่อลดความสับสน) */}
              {modalMode === 'add' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">ประเภทระดับหน่วยงาน</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                      type="button" 
                      onClick={() => setDeptType('main')}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all ${deptType === 'main' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      📁 เพิ่มฝ่ายหลัก
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDeptType('sub')}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all ${deptType === 'sub' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      📄 เพิ่มหน่วยงานย่อย
                    </button>
                  </div>
                </div>
              )}

              {/* รหัสหน่วยงาน */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสหน่วยงาน</label>
                <input 
                  type="text" 
                  required
                  placeholder={deptType === 'main' ? "เช่น D100" : "เช่น D100_04"}
                  disabled={modalMode === 'edit'} 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono uppercase" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>

              {/* ช่องเลือกฝ่ายหลัก (จะถูกปิดการทำงานหากเลือกเป็น "ฝ่ายหลัก") */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">สังกัดฝ่ายหลัก</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 font-medium" 
                  value={formData.parentId} 
                  onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                  disabled={deptType === 'main'}
                  required={deptType === 'sub'}
                >
                  {deptType === 'main' ? (
                    <option value="">เป็นระดับฝ่ายหลักสูงสุด (ไม่มีการสังกัด)</option>
                  ) : (
                    mainDepartments.map(m => (
                      <option key={m.dept_id} value={m.dept_id}>{m.dept_name_th}</option>
                    ))
                  )}
                </select>
              </div>

              {/* ชื่อภาษาไทย */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อ{deptType === 'main' ? 'ฝ่ายหลัก (สายงาน)' : 'หน่วยงานย่อย / งาน'} (ภาษาไทย)
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder={deptType === 'main' ? "เช่น ฝ่ายบริหารและยุทธศาสตร์" : "เช่น งานสารบรรณ"} 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                  value={formData.name_th} 
                  onChange={(e) => setFormData({...formData, name_th: e.target.value})} 
                />
              </div>

              {/* ชื่อภาษาอังกฤษ */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อหน่วยงาน (ภาษาอังกฤษ)</label>
                <input 
                  type="text" 
                  placeholder="เช่น General Correspondence Section" 
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                  value={formData.name_en} 
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})} 
                />
              </div>

              {/* ปุ่มกดยกเลิก/บันทึก */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentMaster;
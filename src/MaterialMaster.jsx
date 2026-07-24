import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Package, Upload, Image as ImageIcon } from 'lucide-react';

// 🎯 ตั้งค่า URL สำหรับ Backend API ให้ยืดหยุ่น (Local / Production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MaterialMaster = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [vendors, setVendors] = useState([]);       
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 🖼️ State สำหรับไฟล์รูปภาพ และ รูป Preview
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // State สำหรับผูกข้อมูลในฟอร์ม
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    category: '', 
    type: '',
    unit: 'รีม',
    price: '',
    minQty: '',
    vendor: '',
    existingImage: '' // 🌟 เพิ่มสำหรับเก็บชื่อ/พาธรูปเดิมกรณีไม่ได้เปลี่ยนรูปใหม่
  });

  // 🛠️ Helper สำหรับแปลงพาธรูปให้ถูกต้องเสมอ
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    if (!cleanPath.startsWith('/uploads/')) {
      return `${API_BASE_URL}/uploads${cleanPath}`;
    }
    return `${API_BASE_URL}${cleanPath}`;
  };

  // ฟังก์ชันล้างฟอร์มกรอกข้อมูล
  const resetForm = () => {
    setFormData({
      id: '',
      code: '',
      name: '',
      category: categories[0]?.category_id || '', 
      type: '',
      unit: 'รีม',
      price: '',
      minQty: '',
      vendor: '',
      existingImage: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(false);
  };

  // 1. ดึงข้อมูลวัสดุพัสดุทั้งหมด
  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/materials`);
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  // 2. ดึงข้อมูลหมวดหมู่ทั้งหมด
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`); 
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // 3. ดึงข้อมูลผู้จัดจำหน่ายทั้งหมด
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !formData.category && !isEditing) {
      setFormData(prev => ({ ...prev, category: categories[0].category_id }));
    }
  }, [categories, isEditing]);

  useEffect(() => {
    if (vendors.length > 0 && !formData.vendor && !isEditing) {
      setFormData(prev => ({ ...prev, vendor: vendors[0].vendor_id }));
    }
  }, [vendors, isEditing]);

  // 🖼️ ฟังก์ชันเลือกไฟล์รูปภาพและทำ Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ฟังก์ชันกดบันทึกข้อมูล (เพิ่ม/แก้ไข)
  const handleSave = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('code', formData.code);
    data.append('material_id', formData.code);
    data.append('name', formData.name);
    data.append('material_name', formData.name);
    data.append('category', formData.category || '');
    data.append('category_id', formData.category || '');
    data.append('type', formData.type || '');
    data.append('unit', formData.unit || '');
    data.append('price', parseFloat(formData.price) || 0);
    data.append('unit_price', parseFloat(formData.price) || 0);
    data.append('minQty', parseInt(formData.minQty) || 0);
    data.append('min_qty', parseInt(formData.minQty) || 0);
    data.append('min_stock', parseInt(formData.minQty) || 0);
    data.append('vendor', formData.vendor || '');
    data.append('primary_vendor_id', formData.vendor || '');

    // 🌟 ถ้าเลือกไฟล์ใหม่ให้ส่งไฟล์ไป / ถ้าไม่ได้เลือกไฟล์ใหม่ให้ส่งชื่อไฟล์เดิมไป
    if (imageFile) {
      data.append('image', imageFile);
    } else if (formData.existingImage) {
      data.append('image_file', formData.existingImage);
    }

    try {
      if (isEditing) {
        const response = await fetch(`${API_BASE_URL}/api/materials/${formData.id}`, {
          method: 'PUT',
          body: data
        });
        
        if (response.ok) {
          alert('📝 แก้ไขข้อมูลพัสดุสำเร็จ!');
          fetchMaterials(); 
          resetForm();
        } else {
          const resErr = await response.json();
          alert(`❌ แก้ไขไม่สำเร็จ: ${resErr.error || resErr.message}`);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/materials`, {
          method: 'POST',
          body: data
        });

        const result = await response.json();
        if (result.success || response.ok) {
          alert('✨ เพิ่มข้อมูลพัสดุเข้าคลังสำเร็จ!');
          fetchMaterials(); 
          resetForm();
        } else {
          alert(`เกิดข้อผิดพลาด: ${result.error || result.message}`);
        }
      }
    } catch (error) {
      console.error("Error saving material:", error);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // ฟังก์ชันเมื่อคลิกแก้ไขในตาราง
  const handleEditClick = (item) => {
    const rawImage = item.image_file || item.image || item.image_path || '';
    
    setFormData({
      id: item.material_id,
      code: item.material_id,
      name: item.material_name,
      category: item.category_id || '',
      type: item.type || '',
      unit: item.unit || '',
      price: item.unit_price || '',
      minQty: item.min_stock || item.min_qty || '',
      vendor: item.primary_vendor_id || item.vendor_id || '',
      existingImage: rawImage
    });

    // 🌟 ใช้ Helper ดึง URL รูปภาพ
    if (rawImage) {
      setImagePreview(getImageUrl(rawImage));
    } else {
      setImagePreview(null);
    }
    setImageFile(null);

    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบรายการพัสดุนี้ออกจากคลังใช่หรือไม่?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('🗑️ ลบรายการข้อมูลเรียบร้อยแล้ว');
          fetchMaterials(); 
        }
      } catch (error) {
        console.error("Error deleting material:", error);
      }
    }
  };

  const filteredMaterials = materials.filter(item =>
    (item.material_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.material_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ส่วนที่ 1: ฟอร์มการจัดการข้อมูล (เพิ่ม / แก้ไข) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <Package className="text-blue-600" size={20} />
          <h3 className="font-bold text-slate-800 text-sm">
            {isEditing ? '✏️ แก้ไขข้อมูลวัสดุพัสดุ' : '➕ เพิ่มข้อมูลวัสดุพัสดุเข้าคลัง'}
          </h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสวัสดุ</label>
              <input 
                type="text" 
                required
                disabled={isEditing} 
                placeholder="เช่น ST003" 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100" 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อวัสดุ / พัสดุ</label>
              <input 
                type="text" 
                required 
                placeholder="ระบุชื่อพัสดุ..." 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none bg-white" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name_th} {cat.category_name_en ? `(${cat.category_name_en})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภท</label>
              <input 
                type="text" 
                placeholder="เช่น เคมีภัณฑ์, สิ้นเปลือง, ถาวร" 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">หน่วยนับ</label>
              <input 
                type="text" 
                placeholder="เช่น รีม, กล่อง, เล่ม" 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                value={formData.unit} 
                onChange={e => setFormData({...formData, unit: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ราคา/หน่วย</label>
              <input 
                type="number" 
                required 
                min="0" 
                step="0.01"
                placeholder="0.00" 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ขั้นต่ำ (Min)</label>
              <input 
                type="number" 
                required 
                min="0" 
                placeholder="1" 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500" 
                value={formData.minQty} 
                onChange={e => setFormData({...formData, minQty: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ผู้จัดจำหน่ายหลัก</label>
            <select 
              className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none bg-white" 
              value={formData.vendor} 
              onChange={e => setFormData({...formData, vendor: e.target.value})}
            >
              <option value="">-- เลือกผู้จัดจำหน่าย --</option>
              {vendors.map((vd) => (
                <option key={vd.vendor_id} value={vd.vendor_id}>
                  [{vd.vendor_id}] {vd.vendor_name}
                </option>
              ))}
            </select>
          </div>

          {/* 🖼️ ช่องอัปโหลดรูปภาพพัสดุ */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <label className="cursor-pointer block">
              {imagePreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={imagePreview} alt="Preview" className="h-28 w-28 object-cover rounded-lg border shadow-sm" />
                  <span className="text-xs text-blue-600 font-medium">คลิกที่นี่เพื่อเปลี่ยนรูปภาพ</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">แนบรูปภาพพัสดุ (JPG, PNG)</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors shadow-xs"
            >
              {isEditing ? '🔄 อัปเดตข้อมูลวัสดุ' : 'บันทึกข้อมูล'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ส่วนที่ 2: ตารางแสดงรายการวัสดุทั้งหมด */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            📋 รายการวัสดุทั้งหมดในคลัง ({filteredMaterials.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-3 h-4 w-4 my-auto text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหารหัส หรือชื่อวัสดุ..." 
              className="pl-9 pr-4 py-1.5 w-full border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-3 text-xs font-semibold text-center">รูปภาพ</th>
                <th className="p-3 text-xs font-semibold">รหัส / ชื่อวัสดุ</th>
                <th className="p-3 text-xs font-semibold">หมวดหมู่ / ประเภท</th>
                <th className="p-3 text-xs font-semibold">ราคาต่อหน่วย</th>
                <th className="p-3 text-xs font-semibold text-center">คงเหลือขั้นต่ำ</th>
                <th className="p-3 text-xs font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((item) => {
                const id = item.material_id;
                const name = item.material_name;
                const category = item.category_name_th || item.category_id || '-';
                const vendor = item.vendor_name || item.primary_vendor_id || '-';
                const price = parseFloat(item.unit_price || 0);
                const minQty = parseInt(item.min_stock || item.min_qty || 0);
                const unit = item.unit || '';
                const type = item.type || 'ทั่วไป';

                // 🌟 ดึงชื่อรูปภาพจากทุกคอลัมน์ที่เป็นไปได้
                const rawImg = item.image_file || item.image || item.image_path;
                const imgUrl = getImageUrl(rawImg);

                return (
                  <tr key={id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-slate-700">
                    <td className="p-3 text-center">
                      {/* 🌟 แสดงรูปภาพผ่าน Helper Function */}
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt={name} 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 mx-auto shadow-xs"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 items-center justify-center mx-auto text-[9px] text-slate-400 font-medium"
                        style={{ display: imgUrl ? 'none' : 'flex' }}
                      >
                        <ImageIcon size={14} />
                        <span>No Image</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px] block w-fit mb-1">
                        {id}
                      </span>
                      <div className="font-bold text-slate-800">{name}</div>
                      <div className="text-[10px] text-slate-400">ผู้จัดจำหน่าย: {vendor}</div>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="text-slate-600">{category}</div>
                      <div className="text-[10px] bg-amber-50 text-amber-700 font-medium px-1 rounded w-fit mt-0.5">
                        {type}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-800">
                      {price.toFixed(2)} บาท / {unit}
                    </td>
                    <td className="p-3 text-xs text-center font-bold text-red-500">
                      {minQty} {unit}
                    </td>
                    <td className="p-3 text-xs text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          type="button"
                          onClick={() => handleEditClick(item)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                          title="แก้ไข"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(id)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" 
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-xs text-slate-500">
                    ไม่พบข้อมูลวัสดุพัสดุในระบบคลังสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialMaster;
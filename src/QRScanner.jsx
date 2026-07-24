import React, { useState, useEffect } from 'react';
import { 
  QrCode, Package, ArrowUpRight, ArrowDownLeft, 
  ClipboardCheck, X, CheckCircle, AlertCircle, ChevronLeft, Search
} from 'lucide-react';

// 🎯 ตั้งค่า URL สำหรับ Backend API ให้ยืดหยุ่น (Local / Production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const QRScanner = () => {
  const [viewMode, setViewMode] = useState('list'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  const [action, setAction] = useState(null); 
  const [quantity, setQuantity] = useState('');

  // 🌟 State สำหรับเก็บข้อมูลจากฐานข้อมูลจริง
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 ดึงข้อมูลพัสดุจาก API ผ่าน API_BASE_URL
  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/materials`);
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // ค้นหาสินค้า
  const filteredMaterials = materials.filter(item => 
    (item.material_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.material_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // เมื่อเลือกสินค้า
  const handleSelectMaterial = (item) => {
    setSelectedMaterial(item);
    setViewMode('detail');
    setAction(null);
    setQuantity('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ยืนยันการทำรายการ
  const handleConfirmAction = () => {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      alert('กรุณาระบุจำนวนให้ถูกต้อง');
      return;
    }
    
    // 💡 ตรงนี้สามารถเพิ่มโค้ด fetch() เพื่อยิง API ไปบันทึกข้อมูล (Stock In, Withdraw, Check) ได้เลยครับ
    alert(`✅ ทำรายการสำเร็จ!\n\nรหัส: ${selectedMaterial.material_id}\nรายการ: ${action === 'withdraw' ? 'เบิก' : action === 'return' ? 'คืน' : 'ตรวจนับ'}\nจำนวน: ${quantity} ${selectedMaterial.unit}`);
    
    // กลับไปหน้ารวม
    setViewMode('list');
    setSelectedMaterial(null);
    setAction(null);
    setQuantity('');
  };

  return (
    <div className="space-y-6">
      
      {/* ─── ส่วนหัวของหน้า (Header) ─── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="text-indigo-600" size={20} />
            <h3 className="font-bold text-slate-800 text-sm">
              {viewMode === 'list' ? 'ระบบจัดการคลังพัสดุ (แคตตาล็อก QR Code)' : 'ทำรายการพัสดุ'}
            </h3>
          </div>
          {viewMode === 'detail' && (
            <button 
              onClick={() => { setViewMode('list'); setAction(null); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <ChevronLeft size={16} /> กลับไปหน้ารวม
            </button>
          )}
        </div>

        {/* ─── หน้าจอที่ 1: รายการสินค้า ─── */}
        {viewMode === 'list' && (
          <div className="animate-in fade-in duration-300">
            {/* ช่องค้นหา */}
            <div className="relative mb-6 max-w-md">
              <Search className="absolute inset-y-0 left-0 pl-3 h-4 w-4 my-auto text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหารหัส หรือชื่อพัสดุ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-slate-500 text-sm">กำลังโหลดข้อมูลพัสดุ...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMaterials.map((item) => (
                  <button 
                    key={item.material_id}
                    onClick={() => handleSelectMaterial(item)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    {/* แสดงภาพ QR Code จาก API ฟรี */}
                    <div className="w-28 h-28 bg-white p-1.5 border border-slate-100 rounded-lg mb-4 group-hover:scale-105 transition-transform shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.material_id}`} 
                        alt={`QR Code ${item.material_id}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] mb-2">
                      {item.material_id}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-xs leading-tight line-clamp-2 h-8 w-full">
                      {item.material_name}
                    </h3>
                    <div className="mt-3 text-[10px] text-slate-500 w-full flex justify-between border-t border-slate-100 pt-2">
                      <span>คงเหลือ</span>
                      <span className="font-bold text-indigo-600">{item.stock_qty || item.min_qty || 0} {item.unit || 'หน่วย'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!isLoading && filteredMaterials.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                ไม่พบรายการพัสดุที่ค้นหา
              </div>
            )}
          </div>
        )}

        {/* ─── หน้าจอที่ 2: แสดงผลลัพธ์เพื่อทำรายการ (เบิก/คืน/ตรวจนับ) ─── */}
        {viewMode === 'detail' && selectedMaterial && (
          <div className="animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
            
            {/* การ์ดข้อมูลวัสดุ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md text-xs block w-fit mb-2">
                  {selectedMaterial.material_id}
                </span>
                <h3 className="font-bold text-slate-800 text-xl leading-tight">
                  {selectedMaterial.material_name}
                </h3>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-500" /> 
                  หมวดหมู่: {selectedMaterial.category_name_th || 'ทั่วไป'}
                </p>
              </div>
              
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">ยอดคงเหลือ</span>
                  <div className="text-2xl font-bold text-indigo-600">
                    {selectedMaterial.stock_qty || selectedMaterial.min_qty || 0} <span className="text-sm font-normal text-slate-500">{selectedMaterial.unit || 'หน่วย'}</span>
                  </div>
                </div>
                <div className="bg-white w-14 h-14 rounded-lg flex items-center justify-center border border-slate-200 p-1 shadow-sm">
                   <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedMaterial.material_id}`} 
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                </div>
              </div>
            </div>

            {/* ปุ่ม Action 3 ปุ่ม */}
            {!action && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => setAction('withdraw')}
                  className="bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-orange-600 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="bg-orange-100 p-3 rounded-full text-orange-500"><ArrowUpRight size={28} /></div>
                  <span className="font-bold text-sm">เบิกพัสดุ</span>
                </button>
                <button 
                  onClick={() => setAction('return')}
                  className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-emerald-600 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-500"><ArrowDownLeft size={28} /></div>
                  <span className="font-bold text-sm">คืนพัสดุ</span>
                </button>
                <button 
                  onClick={() => setAction('audit')}
                  className="bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-purple-600 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="bg-purple-100 p-3 rounded-full text-purple-500"><ClipboardCheck size={28} /></div>
                  <span className="font-bold text-sm">ตรวจนับสต๊อก</span>
                </button>
              </div>
            )}

            {/* ฟอร์มกรอกจำนวนเมื่อเลือก Action */}
            {action && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    {action === 'withdraw' && <><ArrowUpRight className="text-orange-500" size={20} /> ทำรายการเบิกพัสดุ</>}
                    {action === 'return' && <><ArrowDownLeft className="text-emerald-500" size={20} /> ทำรายการคืนพัสดุ</>}
                    {action === 'audit' && <><ClipboardCheck className="text-purple-500" size={20} /> บันทึกยอดตรวจนับจริง</>}
                  </h4>
                  <button onClick={() => setAction(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {action === 'audit' ? 'ระบุยอดที่นับได้จริง' : 'ระบุจำนวนที่ต้องการทำรายการ'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl p-4 text-xl font-bold outline-none focus:border-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                      placeholder="0"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold bg-slate-200 px-3 py-1 rounded-lg">
                      {selectedMaterial.unit || 'หน่วย'}
                    </span>
                  </div>
                  
                  {/* แจ้งเตือนถ้ายอดเบิกมากกว่าคงเหลือ */}
                  {action === 'withdraw' && quantity > (selectedMaterial.stock_qty || selectedMaterial.min_qty || 0) && (
                    <div className="mt-3 flex items-start gap-1.5 text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>จำนวนที่เบิก มากกว่ายอดคงเหลือในคลัง ({(selectedMaterial.stock_qty || selectedMaterial.min_qty || 0)})</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleConfirmAction}
                  className={`w-full text-white font-bold py-3.5 rounded-xl shadow-sm transition-all hover:shadow-md text-sm ${
                    action === 'withdraw' ? 'bg-orange-500 hover:bg-orange-600' : 
                    action === 'return' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  ยืนยันการทำรายการ
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default QRScanner;
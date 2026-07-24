import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RotateCcw, AlertCircle, Plus, Trash2, CheckCircle } from 'lucide-react';

// 🎯 ตั้งค่า URL สำหรับ Backend API ให้ยืดหยุ่น (Local / Production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Return() {
    const [role, setRole] = useState('user');
    const [activeTab, setActiveTab] = useState('create'); 

    const [formData, setFormData] = useState({
        user_id: '', 
        withdraw_id: '', 
        return_date: new Date().toISOString().split('T')[0],
        remark: '' 
    });

    const [items, setItems] = useState([{ material_id: '', quantity_returned: 1 }]);
    const [materials, setMaterials] = useState([]);
    const [pendingReturns, setPendingReturns] = useState([]); // 🌟 เก็บรายการรออนุมัติจริงจากหลังบ้าน

    // โหลดรายชื่อพัสดุทั้งหมดผ่าน API_BASE_URL
    const fetchMaterials = () => {
        axios.get(`${API_BASE_URL}/api/materials`)
            .then(res => setMaterials(res.data))
            .catch(err => console.error('โหลดข้อมูลพัสดุไม่สำเร็จ:', err));
    };

    // 🌟 โหลดรายการที่รออนุมัติจริง (Pending) จากฐานข้อมูลผ่าน API_BASE_URL
    const fetchPendingReturns = () => {
        axios.get(`${API_BASE_URL}/api/return/pending`)
            .then(res => setPendingReturns(res.data))
            .catch(err => console.error('โหลดรายการคำขอคืนพัสดุไม่สำเร็จ:', err));
    };

    useEffect(() => {
        fetchMaterials();
        if (role === 'storekeeper') {
            fetchPendingReturns();
        }
    }, [role]);

    const handleAddItem = () => setItems([...items, { material_id: '', quantity_returned: 1 }]);
    const handleRemoveItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    // 🚀 ส่งคำขอคืนพัสดุ (User)
    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        if (!formData.user_id.trim() || !formData.remark.trim()) {
            alert('❌ กรุณากรอกข้อมูลและระบุเหตุผลให้ครบถ้วนด้วยครับ');
            return;
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/return/request`, {
                ...formData,
                items
            });
            if (response.data.success) {
                alert(`🎉 ส่งใบแจ้งคืนพัสดุเรียบร้อย! เลขที่ใบแจ้งคืน: ${response.data.return_id}`);
                
                // 🌟 บันทึกประวัติ: ผู้ใช้งานส่งคำขอคืนพัสดุ
                try {
                    await axios.post(`${API_BASE_URL}/api/logs`, {
                        user: formData.user_id, // ชื่อผู้ส่งคืน
                        action: 'return',
                        module: 'ระบบคืนพัสดุ (Return)',
                        details: `ส่งคำขอคืนพัสดุ เลขที่: ${response.data.return_id} ${formData.withdraw_id ? '(อ้างอิงบิลเบิกเดิม: ' + formData.withdraw_id + ')' : ''}`,
                        ip_address: '127.0.0.1' 
                    });
                } catch (logError) {
                    console.error('⚠️ ไม่สามารถบันทึก Audit Log ได้:', logError);
                }

                setItems([{ material_id: '', quantity_returned: 1 }]);
                setFormData({ user_id: '', withdraw_id: '', return_date: new Date().toISOString().split('T')[0], remark: '' });
                fetchPendingReturns(); // รีเฟรชข้อมูลรอตรวจทันที
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
        }
    };

    // 📥 ฟังก์ชันกดยืนยันอนุมัติรับของคืนเข้าคลังจริง (Storekeeper)
    const handleApproveReturn = async (returnId) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/api/return/approve/${returnId}`);
            if (response.data.success) {
                alert('✅ อนุมัติรับคืนพัสดุและเพิ่มยอดเข้าสต๊อกสะสมเรียบร้อยแล้ว!');

                // 🌟 บันทึกประวัติ: เจ้าหน้าที่พัสดุกดอนุมัติรับของคืน
                try {
                    await axios.post(`${API_BASE_URL}/api/logs`, {
                        user: 'เจ้าหน้าที่พัสดุ (Storekeeper)', 
                        action: 'approve',
                        module: 'ระบบคืนพัสดุ (Return)',
                        details: `อนุมัติรับคืนพัสดุเข้าสต๊อก เลขที่รับคืน: ${returnId}`,
                        ip_address: '127.0.0.1' 
                    });
                } catch (logError) {
                    console.error('⚠️ ไม่สามารถบันทึก Audit Log ได้:', logError);
                }

                fetchPendingReturns(); // โหลดรายการที่เหลือใหม่
            }
        } catch (err) {
            alert('อนุมัติไม่สำเร็จ: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border max-w-6xl mx-auto my-4 space-y-6">
            {/* หัวข้อระบบ */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">🔄 ระบบคืนพัสดุอุปกรณ์ (Return System)</h2>
                    <p className="text-xs text-slate-400">สำหรับส่งคืนวัสดุเหลือใช้ เพื่อดึงยอดกลับเข้าคลังอัตโนมัติ</p>
                </div>
                {/* สลับสิทธิ์จำลอง */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border">
                    <span className="text-[11px] font-bold text-slate-500 pl-2">สิทธิ์จำลอง:</span>
                    <select className="text-xs p-1 border rounded bg-white font-medium text-slate-700" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="user">👤 ผู้ส่งคืนของ</option>
                        <option value="storekeeper">📦 เจ้าหน้าที่พัสดุ (ผู้รับคืน)</option>
                    </select>
                </div>
            </div>

            {/* แถบเมนูย่อย */}
            <div className="flex gap-2 border-b border-slate-100 pb-1">
                <button onClick={() => setActiveTab('create')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    ↩️ สร้างใบส่งคืนพัสดุ
                </button>
                {role === 'storekeeper' && (
                    <button onClick={() => { setActiveTab('approve'); fetchPendingReturns(); }} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all text-emerald-600 ${activeTab === 'approve' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent'}`}>
                        📥 ตรวจสอบ & รับคืนเข้าสต๊อก ({pendingReturns.length})
                    </button>
                )}
            </div>

            {/* 📝 แท็บสร้างใบส่งคืน */}
            {activeTab === 'create' && (
                <form onSubmit={handleSubmitReturn} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">ผู้ส่งคืน <span className="text-red-500">*กรอกชื่อ</span></label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm bg-white font-medium" placeholder="ระบุชื่อ-นามสกุล ผู้ส่งคืน" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">เลขที่ใบเบิกเดิม (ถ้ามี)</label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm bg-white" placeholder="เช่น WD-202607-0001" value={formData.withdraw_id} onChange={e => setFormData({...formData, withdraw_id: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">วันที่ส่งคืน</label>
                            <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={formData.return_date} onChange={e => setFormData({...formData, return_date: e.target.value})} required />
                        </div>
                    </div>

                    {/* ตารางเลือกของ */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                                <tr>
                                    <th className="p-3">รายการพัสดุที่ต้องการส่งคืน</th>
                                    <th className="p-3 w-40 text-center">จำนวนที่คืน</th>
                                    <th className="p-3 text-center w-16">ลบ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">
                                            <select className="w-full p-2 border rounded-md bg-white text-sm" value={item.material_id} onChange={e => handleItemChange(idx, 'material_id', e.target.value)} required>
                                                <option value="">-- เลือกวัสดุที่จะส่งคืน --</option>
                                                {materials.map(m => (
                                                    <option key={m.material_id} value={m.material_id}>{m.material_name} ({m.material_id})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" className="w-full p-2 border rounded-md text-center text-sm" value={item.quantity_returned} onChange={e => handleItemChange(idx, 'quantity_returned', parseInt(e.target.value) || 1)} min="1" required />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500" disabled={items.length === 1}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">📝 เหตุผลในการส่งคืนพัสดุ</label>
                        <textarea rows="2" className="w-full p-2 border rounded-md text-sm" value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} placeholder="ระบุเหตุผล..." required></textarea>
                    </div>

                    <div className="flex justify-between items-center">
                        <button type="button" onClick={handleAddItem} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg flex items-center gap-1">
                            <Plus size={14} /> เพิ่มรายการพัสดุ
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm">
                            <RotateCcw size={14} /> ส่งใบแจ้งคืนพัสดุ (Pending)
                        </button>
                    </div>
                </form>
            )}

            {/* 📥 แท็บตรวจสอบและกดรับคืนสินค้าจริงจาก Database */}
            {activeTab === 'approve' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertCircle size={16}/>
                        <span>กรุณาตรวจสอบสภาพพัสดุอุปกรณ์จริงก่อนกดยืนยันรับคืนเข้าสต๊อกสะสม</span>
                    </div>

                    {pendingReturns.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">🎉 ไม่มีคำขอคืนพัสดุที่ค้างตรวจสอบในขณะนี้</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingReturns.map((ret) => (
                                <div key={ret.return_id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <span className="font-mono font-bold text-blue-700 text-sm">เลขที่รับคืน: {ret.return_id}</span>
                                            <p className="text-[11px] text-slate-400 mt-0.5">ผู้คืน: {ret.user_id} | อ้างอิงใบเบิก: {ret.withdraw_id || 'ไม่มี'}</p>
                                        </div>
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">รอตรวจสอบ</span>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-2.5 rounded text-xs space-y-1.5 text-slate-700">
                                        <div>📦 **พัสดุ:** {ret.material_name} ({ret.material_id})</div>
                                        <div>🔄 **จำนวนที่นำมาคืน:** <span className="font-bold text-blue-600">{ret.quantity_returned}</span> {ret.unit || 'ชิ้น'}</div>
                                        <div className="text-slate-500 italic mt-1">"เหตุผล: {ret.remark}"</div>
                                    </div>

                                    <button 
                                        type="button" 
                                        onClick={() => handleApproveReturn(ret.return_id)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors"
                                    >
                                        <CheckCircle size={14}/> อนุมัติรับคืนพัสดุชิ้นนี้ & เพิ่มสต๊อกอัตโนมัติ
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
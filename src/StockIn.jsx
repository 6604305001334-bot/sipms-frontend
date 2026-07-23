import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, AlertTriangle, Calendar } from 'lucide-react';

export default function StockIn() {
    const [header, setHeader] = useState({
        po_number: '',
        delivery_number: '',
        received_date: new Date().toISOString().split('T')[0],
        vendor_id: ''
    });

    const [items, setItems] = useState([
        { material_id: '', quantity: '', unit_cost: '', lot_no: '', expiry_date: '' }
    ]);

    const [materials, setMaterials] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [expiredAlerts, setExpiredAlerts] = useState([]); 

    const loadAllData = () => {
        axios.get('http://localhost:3000/api/stock-in/vendors')
            .then(res => setVendors(res.data))
            .catch(err => console.error('ไม่สามารถโหลดรายชื่อผู้จัดจำหน่าย:', err));

        axios.get('http://localhost:3000/api/stock-in/materials')
            .then(res => setMaterials(res.data))
            .catch(err => console.error('ไม่สามารถโหลดข้อมูลพัสดุ:', err));

        axios.get('http://localhost:3000/api/stock-in/expired-alerts')
            .then(res => setExpiredAlerts(res.data))
            .catch(err => console.error('ไม่สามารถโหลดข้อมูลแจ้งเตือนหมดอายุ:', err));
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const handleAddItemRow = () => {
        setItems([...items, { material_id: '', quantity: '', unit_cost: '', lot_no: '', expiry_date: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;

        if (field === 'material_id') {
            const selectedMaterial = materials.find(m => String(m.material_id) === String(value));
            
            if (selectedMaterial) {
                const defaultPrice = selectedMaterial.unit_price 
                                  || selectedMaterial.price 
                                  || selectedMaterial.unit_cost 
                                  || selectedMaterial.cost 
                                  || selectedMaterial.moving_average_cost 
                                  || '';
                                  
                updated[index]['unit_cost'] = defaultPrice;
            } else {
                updated[index]['unit_cost'] = '';
            }
        }

        setItems(updated);
    };

    const handleRemoveItemRow = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const checkExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { badge: null, rowClass: '' };
        const today = new Date();
        const exp = new Date(expiryDate);
        const timeDiff = exp.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff <= 0) {
            return {
                badge: <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-red-200 mt-1 animate-pulse"><AlertTriangle size={12}/> หมดอายุแล้ว!</span>,
                rowClass: 'bg-red-50/40'
            };
        } else if (daysDiff <= 30) {
            return {
                badge: <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200 mt-1"><Calendar size={12}/> ใกล้หมดอายุ ({daysDiff} วัน)</span>,
                rowClass: 'bg-amber-50/30'
            };
        }
        return { badge: null, rowClass: '' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submissionItems = items.map(item => ({
                ...item,
                quantity: item.quantity === '' ? 0 : Number(item.quantity),
                unit_cost: item.unit_cost === '' ? 0 : Number(item.unit_cost)
            }));

            const response = await axios.post('http://localhost:3000/api/stock-in/stock-in', {
                ...header,
                items: submissionItems
            });

            if (response.data.success) {
                alert(`🎉 บันทึกข้อมูลเข้าฐานข้อมูลสำเร็จ!\nเลขที่เอกสาร: ${response.data.stock_in_id}`);
                
                // 🌟 [เพิ่มใหม่] แอบยิง API ไปบันทึกประวัติการใช้งาน (Audit Log) แบบอัตโนมัติ
                try {
                    await axios.post('http://localhost:3000/api/logs', {
                        user: 'พี่ด้า (Admin)', 
                        action: 'add',
                        module: 'บันทึกรับพัสดุ',
                        details: `ทำรายการรับเข้าพัสดุ เลขที่เอกสาร: ${response.data.stock_in_id} (อ้างอิง PO: ${header.po_number || '-'})`,
                        ip_address: '127.0.0.1' 
                    });
                } catch (logError) {
                    console.error('⚠️ ไม่สามารถบันทึกประวัติการใช้งานลง Audit Log ได้:', logError);
                }
                // 🌟 สิ้นสุดส่วนที่เพิ่มใหม่

                setItems([{ material_id: '', quantity: '', unit_cost: '', lot_no: '', expiry_date: '' }]);
                setHeader({
                    po_number: '',
                    delivery_number: '',
                    received_date: new Date().toISOString().split('T')[0],
                    vendor_id: ''
                });

                loadAllData();
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border max-w-6xl mx-auto my-4 space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-800">📦 บันทึกรับพัสดุเข้าคลังสินค้า</h2>
                <p className="text-xs text-slate-400">ระบบคำนวณต้นทุนเฉลี่ยสะสม (Moving Average) และตรวจเช็ควันหมดอายุอัตโนมัติ</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 📋 ข้อมูลหัวบิล */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">เลขที่ใบสั่งซื้อ (PO)</label>
                        <input type="text" className="w-full p-2 border rounded-md text-sm bg-white" value={header.po_number} onChange={e => setHeader({...header, po_number: e.target.value})} required placeholder="ระบุเลขที่ PO" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">เลขที่ใบส่งของ / Invoice</label>
                        <input type="text" className="w-full p-2 border rounded-md text-sm bg-white" value={header.delivery_number} onChange={e => setHeader({...header, delivery_number: e.target.value})} required placeholder="ระบุเลขใบส่งของ" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">วันที่ตรวจรับ</label>
                        <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={header.received_date} onChange={e => setHeader({...header, received_date: e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">ผู้จัดจำหน่าย</label>
                        <select className="w-full p-2 border rounded-md text-sm bg-white" value={header.vendor_id} onChange={e => setHeader({...header, vendor_id: e.target.value})} required>
                            <option value="">-- เลือกบริษัทคู่ค้า --</option>
                            {vendors.map(v => (
                                <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 📊 ตารางกรอกข้อมูลรับเข้า */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-200">
                            <tr>
                                <th className="p-3">ชื่อวัสดุอุปกรณ์</th>
                                <th className="p-3 w-28 text-center">จำนวน</th>
                                <th className="p-3 w-32 text-center">ราคาต่อหน่วย</th>
                                <th className="p-3 w-36">ล็อตผลิต</th>
                                <th className="p-3 w-44">วันหมดอายุ</th>
                                <th className="p-3 text-center w-16">ลบ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => {
                                const expiryStatus = checkExpiryStatus(item.expiry_date);
                                return (
                                    <tr key={index} className={`transition-colors ${expiryStatus.rowClass}`}>
                                        <td className="p-2">
                                            <select className="w-full p-2 border rounded-md bg-white text-sm" value={item.material_id} onChange={e => handleItemChange(index, 'material_id', e.target.value)} required>
                                                <option value="">-- เลือกรายการพัสดุ --</option>
                                                {materials.map(m => (
                                                    <option key={m.material_id} value={m.material_id}>{m.material_name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" className="w-full p-2 border rounded-md text-center text-sm" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="1" required placeholder="0" />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" step="0.01" className="w-full p-2 border rounded-md text-right text-sm" value={item.unit_cost} onChange={e => handleItemChange(index, 'unit_cost', e.target.value)} min="0.00" required placeholder="0.00" />
                                        </td>
                                        <td className="p-2">
                                            <input type="text" className="w-full p-2 border rounded-md text-sm" value={item.lot_no} onChange={e => handleItemChange(index, 'lot_no', e.target.value)} placeholder="Lot No." />
                                        </td>
                                        <td className="p-2">
                                            <input type="date" className="w-full p-2 border rounded-md text-sm" value={item.expiry_date} onChange={e => handleItemChange(index, 'expiry_date', e.target.value)} />
                                            {expiryStatus.badge}
                                        </td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => handleRemoveItemRow(index)} className="text-slate-400 hover:text-red-500 disabled:opacity-20 transition-colors" disabled={items.length === 1}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={handleAddItemRow} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={16} /> เพิ่มแถวพัสดุ
                    </button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 shadow-sm">
                        <Save size={16} /> บันทึกรับเข้าคลัง
                    </button>
                </div>
            </form>

            <hr className="border-slate-200" />

            {/* 🛑 แจ้งเตือนพัสดุหมดอายุ */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="text-amber-500 animate-bounce" size={20} />
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">📋 รายการแจ้งเตือนพัสดุหมดอายุ / ใกล้หมดอายุภายใน 30 วัน</h3>
                        <p className="text-[11px] text-slate-400">แสดงผลแบบ Real-time ดึงตามวันหมดอายุของทุกล็อตสินค้าที่บันทึกจริงในระบบ</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 font-semibold uppercase border-b">
                            <tr>
                                <th className="p-2.5">รหัสพัสดุ</th>
                                <th className="p-2.5">ชื่อรายการพัสดุอุปกรณ์</th>
                                <th className="p-2.5 text-center">ล็อตผลิต</th>
                                <th className="p-2.5 text-center">วันหมดอายุ</th>
                                <th className="p-2.5 text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {expiredAlerts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center text-slate-400">🎉 ยินดีด้วย! ไม่มีพัสดุชิ้นใดที่ใกล้หมดอายุหรือหมดอายุในขณะนี้</td>
                                </tr>
                            ) : (
                                expiredAlerts.map((alertItem, idx) => (
                                    <tr key={idx} className={alertItem.days_left <= 0 ? "bg-red-50/30" : "bg-amber-50/20"}>
                                        <td className="p-2.5 font-mono font-medium text-slate-600">{alertItem.material_id}</td>
                                        <td className="p-2.5 text-slate-800 font-medium">{alertItem.material_name}</td>
                                        <td className="p-2.5 text-center text-slate-500">{alertItem.lot_no || '-'}</td>
                                        <td className="p-2.5 text-center text-slate-600">
                                            {new Date(alertItem.expiry_date).toLocaleDateString('th-TH')}
                                        </td>
                                        <td className="p-2.5 text-center">
                                            {alertItem.days_left <= 0 ? (
                                                <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-[10px]">🛑 หมดอายุแล้ว</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">⚠️ เหลือ {alertItem.days_left} วัน</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
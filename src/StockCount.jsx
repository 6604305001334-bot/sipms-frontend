import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function StockCount() {
    const [isLoading, setIsLoading] = useState(false);
    const [countData, setCountData] = useState({
        count_id: `SC-${new Date().getFullYear()}-Q2`, // สุ่ม/เจนรหัสรอบนับพัสดุ
        count_title: `ตรวจนับพัสดุประจำไตรมาส 2/${new Date().getFullYear() + 543}`,
        count_date: new Date().toISOString().split('T')[0]
    });

    // 🌟 รายการพัสดุจริงที่จะดึงมาจากฐานข้อมูล
    const [countItems, setCountItems] = useState([]);

    // 🔄 STEP 1: ดึงข้อมูลพัสดุและยอดคงเหลือในระบบจริงจากหลังบ้านตอนเปิดหน้าจอ
    useEffect(() => {
        fetchSystemStock();
    }, []);

    const fetchSystemStock = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/stock-count/prepare');
            // นำข้อมูลจริงจากตาราง db_materials มาเซ็ตลงตาราง โดยเริ่มแรกให้ตั้งค่าคงเหลือจริง (physical_qty) เท่ากับยอดระบบก่อน
            const mappedData = response.data.map(item => ({
                material_id: item.material_id,
                material_name: item.material_name,
                system_qty: parseInt(item.system_qty) || 0,
                physical_qty: parseInt(item.system_qty) || 0, // ค่าเริ่มต้นให้เท่ายอดระบบ เพื่อให้ยูสเซอร์ไล่ปรับตัวเลขชิ้นที่ขาดหรือเกิน
                remark: ''
            }));
            setCountItems(mappedData);
        } catch (error) {
            console.error(error);
            alert('❌ ไม่สามารถดึงข้อมูลพัสดุจากคลังได้: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    // ✏️ ฟังก์ชันจัดการเมื่อผู้ใช้พิมพ์เปลี่ยนตัวเลขจำนวนที่ตรวจนับได้จริง
    const handlePhysicalQtyChange = (index, value) => {
        const updated = [...countItems];
        updated[index].physical_qty = value === '' ? '' : parseInt(value) || 0;
        setCountItems(updated);
    };

    // ✏️ ฟังก์ชันจัดการเมื่อพิมพ์หมายเหตุ
    const handleRemarkChange = (index, value) => {
        const updated = [...countItems];
        updated[index].remark = value;
        setCountItems(updated);
    };

    // 🟢 STEP 2: ฟังก์ชันสำหรับปุ่ม "ยืนยันผล & อัปเดตปรับปรุงสต๊อก" (ยิงเข้า API หลังบ้านจริง!)
    const handleConfirmCount = async () => {
        // เช็คความปลอดภัยเบื้องต้น
        if (countItems.length === 0) return alert('❌ ไม่มีรายการพัสดุสำหรับบันทึกการตรวจนับ');
        
        const hasEmptyValue = countItems.some(item => item.physical_qty === '');
        if (hasEmptyValue) return alert('❌ กรุณาระบุจำนวนที่นับได้จริงให้ครบทุกช่อง (หากไม่มีให้ใส่ 0)');

        if (!window.confirm('⚠️ คุณแน่ใจใช่ไหมที่จะยืนยันผลการตรวจนับ? ยอดพัสดุคงเหลือในคลังหลักจะถูกปรับปรุงให้เท่ากับยอดที่คุณกรอกทันที!')) {
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                count_id: countData.count_id,
                count_title: countData.count_title,
                count_date: countData.count_date,
                items: countItems,
                status: 'Completed' // ส่งสถานะไปสั่งให้หลังบ้านเขียน SQL อัปเดตยอดสต๊อกหลัก
            };

            const response = await axios.post('http://localhost:3000/api/stock-count/submit', payload);
            
            if (response.data.success) {
                alert('🎉 ' + response.data.message);
                // สั่งโหลดข้อมูลสต๊อกใหม่หลังอัปเดตเสร็จ
                fetchSystemStock(); 
            }
        } catch (error) {
            console.error(error);
            alert('❌ บันทึกผลตรวจนับล้มเหลว: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border max-w-6xl mx-auto my-4 space-y-6 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-xl">
                    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-medium shadow-lg animate-bounce">
                        <Loader2 size={16} className="animate-spin" /> กำลังประมวลผลระบบคลัง...
                    </div>
                </div>
            )}

            {/* ส่วนหัวข้อ */}
            <div className="border-b pb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">🔍 ระบบตรวจนับพัสดุประจำปี / รายไตรมาส (Stock Count)</h2>
                    <p className="text-xs text-slate-400">เปรียบเทียบยอดพัสดุในระบบกับของจริงในคลัง พร้อมสรุปยอดส่วนเกิน/ส่วนขาดอัตโนมัติ</p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">สถานะ: กำลังตรวจนับ (Counting)</span>
            </div>

            {/* ข้อมูลรอบเอกสาร */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                    <label className="text-xs text-slate-500 block mb-1 font-medium">รหัสรอบตรวจนับ</label>
                    <input type="text" className="w-full p-2 border rounded-md text-sm bg-slate-100 font-mono text-slate-600 font-bold" value={countData.count_id} disabled />
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1 font-medium">ชื่อรอบการตรวจนับ</label>
                    <input type="text" className="w-full p-2 border rounded-md text-sm bg-slate-100 text-slate-600" value={countData.count_title} disabled />
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1 font-medium">วันที่ตรวจนับ</label>
                    <input type="date" className="w-full p-2 border rounded-md text-sm bg-slate-100 text-slate-600" value={countData.count_date} disabled />
                </div>
            </div>

            {/* ตารางแสดงข้อมูล */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                        <tr>
                            <th className="p-3">รหัส / รายการพัสดุ</th>
                            <th className="p-3 text-center w-36 bg-blue-50/50">คงเหลือตามระบบ</th>
                            <th className="p-3 text-center w-36 bg-purple-50/50">คงเหลือจริง (นับได้)</th>
                            <th className="p-3 text-center w-32">ส่วนเกิน (+)</th>
                            <th className="p-3 text-center w-32">ส่วนขาด (-)</th>
                            <th className="p-3 w-48">หมายเหตุ / สาเหตุ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                        {countItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-8 text-slate-400 font-medium">📥 ไม่พบรายการข้อมูลพัสดุในระบบคลังพัสดุ</td>
                            </tr>
                        ) : (
                            countItems.map((item, idx) => {
                                const systemQty = item.system_qty;
                                const physicalQty = item.physical_qty === '' ? systemQty : item.physical_qty;
                                const variance = physicalQty - systemQty;
                                const surplus = variance > 0 ? variance : 0;
                                const shortage = variance < 0 ? Math.abs(variance) : 0;

                                return (
                                    <tr key={item.material_id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3">
                                            <div className="font-mono font-bold text-slate-400">{item.material_id}</div>
                                            <div className="font-semibold text-slate-800 text-sm">{item.material_name}</div>
                                        </td>
                                        <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/20 text-sm">
                                            {systemQty.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center bg-purple-50/20">
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-24 p-1.5 border border-purple-200 rounded-md text-center font-bold bg-white text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                                value={item.physical_qty} 
                                                onChange={(e) => handlePhysicalQtyChange(idx, e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3 text-center font-bold text-green-600 text-sm bg-green-50/10">
                                            {surplus > 0 ? `+${surplus.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-3 text-center font-bold text-red-600 text-sm bg-red-50/10">
                                            {shortage > 0 ? `-${shortage.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-3">
                                            <input 
                                                type="text" 
                                                className="w-full p-1.5 border rounded text-slate-600 text-xs focus:outline-none focus:border-slate-400"
                                                placeholder="เช่น ชำรุด, ของสูญหาย..."
                                                value={item.remark}
                                                onChange={(e) => handleRemarkChange(idx, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ส่วนท้ายและปุ่มบันทึกข้อมูล */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <div className="text-xs text-amber-600 flex items-center gap-1.5 font-medium bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg w-full sm:w-auto">
                    <AlertTriangle size={15} className="text-amber-500 shrink-0" /> 
                    <span>คำเตือน: หลังกดยืนยัน ยอดคงเหลือตามระบบจะถูกปรับเปลี่ยนไปเป็น "ยอดคงเหลือจริงที่นับได้" ทันที</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button 
                        type="button" 
                        onClick={handleConfirmCount} 
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:shadow active:scale-[0.98]"
                    >
                        <CheckCircle size={15} /> ยืนยันผล & อัปเดตปรับปรุงสต๊อก
                    </button>
                </div>
            </div>
        </div>
    );
}
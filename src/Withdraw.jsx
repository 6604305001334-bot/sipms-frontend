import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, XCircle, Package, Send, Plus, Trash2, Clock } from 'lucide-react';

export default function Withdraw() {
    // 🌟 1. อ่านข้อมูลผู้ใช้และบทบาทจริงจาก localStorage (ไม่ใช่สิทธิ์จำลอง)
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    // กำหนดค่า Role เริ่มต้นจากข้อมูลล็อกอิน
    const roleText = user?.role || 'เจ้าหน้าที่พัสดุ';
    const isStorekeeper = roleText.includes('เจ้าหน้าที่พัสดุ') || roleText.includes('Storekeeper');
    const isApprover = roleText.includes('หัวหน้างาน') || roleText.includes('Approver');
    const isRequester = roleText.includes('ผู้ขอเบิก') || roleText.includes('Requester');

    const [activeTab, setActiveTab] = useState('create'); // create, track, approve, issue

    // State ฟอร์มคำขอเบิก (ใส่ user_id จากคนที่ล็อกอินให้อัตโนมัติ)
    const [formData, setFormData] = useState({
        user_id: user?.username || '', 
        main_department_id: '', 
        department_id: '',      
        request_date: new Date().toISOString().split('T')[0],
        remark: ''
    });
    const [items, setItems] = useState([{ material_id: '', quantity: 1 }]);
    
    // Master Data & รายการใบเบิกจริงจากฐานข้อมูล
    const [materials, setMaterials] = useState([]);
    const [mainDepartments, setMainDepartments] = useState([]); 
    const [subDepartments, setSubDepartments] = useState([]);   
    const [withdrawList, setWithdrawList] = useState([]); 

    // 📥 ฟังก์ชันโหลดข้อมูลใบเบิกทั้งหมดจากฐานข้อมูล
    const loadWithdrawRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/withdraw');
            if (response.data) {
                setWithdrawList(response.data);
            }
        } catch (err) {
            console.error('โหลดรายการใบเบิกจากหลังบ้านล้มเหลว:', err);
        }
    };

    // โหลดข้อมูลวัสดุพัสดุในคลังมารอให้เลือกเบิก
    const loadMaterials = async () => {
        try {
            const matRes = await axios.get('http://localhost:3000/api/stock-in/materials');
            setMaterials(matRes.data);
        } catch (err) {
            console.error('โหลดข้อมูลวัสดุล้มเหลว:', err);
        }
    };

    // โหลดข้อมูลโครงสร้างหน่วยงาน
    const loadDepartmentsData = async () => {
        try {
            const mainRes = await axios.get('http://localhost:3000/api/departments/main');
            setMainDepartments(mainRes.data);

            const subRes = await axios.get('http://localhost:3000/api/departments/sub-all');
            setSubDepartments(subRes.data);
        } catch (err) {
            console.error('โหลดข้อมูลหน่วยงานล้มเหลว:', err);
        }
    };

    // โหลดข้อมูลเมื่อเปิดหน้าจอ หรือสลับแท็บ
    useEffect(() => { 
        loadMaterials(); 
        loadDepartmentsData(); 
        loadWithdrawRequests();
    }, [activeTab]);

    // จัดการแถวรายการสิ่งของที่ขอเบิก
    const handleAddItemRow = () => setItems([...items, { material_id: '', quantity: 1 }]);
    const handleRemoveItemRow = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };
    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    // 🚀 STEP 1: ผู้เบิกยื่นคำขอเบิก
    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!formData.user_id.trim() || !formData.department_id) {
            alert('❌ กรุณากรอกชื่อผู้ขอเบิกและเลือกหน่วยงาน/แผนกย่อยด้วยครับ');
            return;
        }
        try {
            const { main_department_id, ...postData } = formData; 

            const response = await axios.post('http://localhost:3000/api/withdraw/request', {
                ...postData,
                items,
                status: 'Pending'
            });
            if (response.data.success) {
                alert(`🎉 ส่งคำขอเบิกพัสดุสำเร็จ! เลขที่ใบเบิก: ${response.data.withdraw_id}`);
                
                // บันทึก Audit Log
                try {
                    await axios.post('http://localhost:3000/api/logs', {
                        user: `${formData.user_id} (${roleText})`,
                        action: 'add',
                        module: 'ระบบเบิกจ่าย (Withdraw)',
                        details: `ส่งคำขอเบิกพัสดุใหม่ เลขที่ใบเบิก: ${response.data.withdraw_id} (แผนก: ${formData.department_id})`,
                        ip_address: '127.0.0.1' 
                    });
                } catch (logError) {
                    console.error('⚠️ ไม่สามารถบันทึก Audit Log ได้:', logError);
                }
                
                // เคลียร์ฟอร์ม
                setItems([{ material_id: '', quantity: 1 }]);
                setFormData({ 
                    user_id: user?.username || '', 
                    main_department_id: '', 
                    department_id: '', 
                    request_date: new Date().toISOString().split('T')[0], 
                    remark: '' 
                });
                await loadWithdrawRequests();
                setActiveTab('track'); 
            }
        } catch (err) {
            alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
        }
    };

    // 👔 ฟังก์ชันอัปเดตสถานะบิลเบิก
    const handleUpdateStatus = async (withdrawId, newStatus) => {
        try {
            const response = await axios.put(`http://localhost:3000/api/withdraw/status/${withdrawId}`, { status: newStatus });
            if (response.data.success) {
                alert(`อัปเดตสถานะใบเบิกเป็น ${newStatus} สำเร็จ`);
                
                // บันทึก Audit Log จากสิทธิ์ผู้ใช้จริง
                try {
                    let actionType = 'edit';
                    let detailsMsg = `เปลี่ยนสถานะใบเบิก ${withdrawId} เป็น ${newStatus}`;

                    if (newStatus === 'Approved') {
                        actionType = 'approve';
                        detailsMsg = `อนุมัติคำขอเบิกพัสดุ เลขที่: ${withdrawId}`;
                    } else if (newStatus === 'Rejected') {
                        actionType = 'edit';
                        detailsMsg = `ปฏิเสธคำขอเบิกพัสดุ เลขที่: ${withdrawId}`;
                    } else if (newStatus === 'Completed') {
                        actionType = 'withdraw';
                        detailsMsg = `ยืนยันการจัดจ่ายและตัดสต๊อกพัสดุ เลขที่: ${withdrawId}`;
                    }

                    await axios.post('http://localhost:3000/api/logs', {
                        user: `${user?.username || 'ผู้ใช้งาน'} (${roleText})`,
                        action: actionType,
                        module: 'ระบบเบิกจ่าย (Withdraw)',
                        details: detailsMsg,
                        ip_address: '127.0.0.1' 
                    });
                } catch (logError) {
                    console.error('⚠️ ไม่สามารถบันทึก Audit Log ได้:', logError);
                }

                loadWithdrawRequests();
            }
        } catch (err) {
            alert('ไม่สามารถอัปเดตสถานะได้: ' + (err.response?.data?.message || err.message));
        }
    };

    // ฟังก์ชันแสดงสีสถานะ
    const getStatusBadge = (status) => {
        const styles = {
            Draft: 'bg-slate-100 text-slate-600 border-slate-200',
            Pending: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
            Approved: 'bg-blue-50 text-blue-700 border-blue-200',
            Rejected: 'bg-red-50 text-red-700 border-red-200',
            Issued: 'bg-purple-50 text-purple-700 border-purple-200',
            Completed: 'bg-green-50 text-green-700 border-green-200'
        };
        return <span className={`px-2 py-0.5 rounded-md border text-xs font-bold ${styles[status] || styles.Draft}`}>{status}</span>;
    };

    // กรองหน่วยงานย่อยตามฝ่ายหลักที่เลือก
    const filteredSubDepts = subDepartments.filter(
        sub => sub.parent_id === formData.main_department_id
    );

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border max-w-6xl mx-auto my-4 space-y-6">
            {/* หัวข้อระบบ */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">📋 ระบบเบิกจ่ายพัสดุอุปกรณ์ (Withdrawal System)</h2>
                    <p className="text-xs text-slate-400">ควบคุมขั้นตอนสร้างคำขอเบิก, การอนุมัติจากหัวหน้า และการจ่ายตัดสต๊อกจริง</p>
                </div>
                {/* 🌟 แสดงป้ายผู้ใช้จริงแบบ Clean ปราศจาก Dropdown จำลอง */}
                <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border">
                    ผู้ใช้งาน: <span className="text-blue-600">{user?.username || 'ผู้ใช้งานทั่วไป'}</span> ({roleText})
                </div>
            </div>

            {/* แถบเมนูเปลี่ยนหน้าตามแท็บและสิทธิ์จริง */}
            <div className="flex gap-2 border-b border-slate-100 pb-1">
                <button onClick={() => setActiveTab('create')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    ➕ สร้างคำขอเบิก
                </button>
                <button onClick={() => setActiveTab('track')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${activeTab === 'track' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    ⏱️ ติดตามสถานะคำขอ ({withdrawList.length})
                </button>
                
                {/* แสดงแท็บนี้เฉพาะ "หัวหน้างาน" หรือ "เจ้าหน้าที่พัสดุ" */}
                {(isApprover || isStorekeeper) && (
                    <button onClick={() => setActiveTab('approve')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all text-amber-600 ${activeTab === 'approve' ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg' : 'border-transparent'}`}>
                        👔 รายการรออนุมัติ ({withdrawList.filter(w => w.status === 'Pending').length})
                    </button>
                )}
                
                {/* แสดงแท็บนี้เฉพาะ "เจ้าหน้าที่พัสดุ" */}
                {isStorekeeper && (
                    <button onClick={() => setActiveTab('issue')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all text-purple-600 ${activeTab === 'issue' ? 'border-purple-500 text-purple-700 bg-purple-50/50 rounded-t-lg' : 'border-transparent'}`}>
                        📦 รายการตัดสต๊อกจ่ายสินค้า ({withdrawList.filter(w => w.status === 'Approved').length})
                    </button>
                )}
            </div>

            {/* 📥 แท็บที่ 1: หน้าสร้างฟอร์มขอเบิกพัสดุ */}
            {activeTab === 'create' && (
                <form onSubmit={handleCreateRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">ชื่อผู้ขอเบิก <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm bg-white font-medium" placeholder="พิมพ์ชื่อ-นามสกุลของคุณ" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} required />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">ฝ่ายหลัก (สายงาน) <span className="text-red-500">*</span></label>
                            <select 
                                className="w-full p-2 border rounded-md text-sm bg-white font-medium outline-none border-slate-300" 
                                value={formData.main_department_id} 
                                onChange={e => setFormData({...formData, main_department_id: e.target.value, department_id: ''})} 
                                required
                            >
                                <option value="">-- เลือกฝ่ายหลัก --</option>
                                {mainDepartments.map(main => (
                                    <option key={main.dept_id} value={main.dept_id}>
                                        {main.dept_name_th}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">หน่วยงานย่อย / งาน <span className="text-red-500">*</span></label>
                            <select 
                                className="w-full p-2 border rounded-md text-sm bg-white font-medium outline-none border-slate-300 disabled:bg-slate-100 disabled:text-slate-400" 
                                value={formData.department_id} 
                                onChange={e => setFormData({...formData, department_id: e.target.value})} 
                                disabled={!formData.main_department_id}
                                required
                            >
                                <option value="">-- เลือกหน่วยงานย่อย/งาน --</option>
                                {filteredSubDepts.map(sub => (
                                    <option key={sub.dept_id} value={sub.dept_id}>
                                        {sub.dept_name_th} {sub.dept_name_en ? `(${sub.dept_name_en})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1 font-medium">วันที่ขอเบิก</label>
                            <input type="date" className="w-full p-2 border rounded-md text-sm bg-white" value={formData.request_date} onChange={e => setFormData({...formData, request_date: e.target.value})} required />
                        </div>
                    </div>

                    {/* ตารางเลือกของเบิก */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b">
                                <tr>
                                    <th className="p-3">รายการพัสดุอุปกรณ์ที่ต้องการเบิก</th>
                                    <th className="p-3 w-40 text-center">จำนวนที่ขอเบิก</th>
                                    <th className="p-3 text-center w-16">ลบ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">
                                            <select className="w-full p-2 border rounded-md bg-white text-sm" value={item.material_id} onChange={e => handleItemChange(idx, 'material_id', e.target.value)} required>
                                                <option value="">-- เลือกวัสดุที่จะทำการเบิก --</option>
                                                {materials.map(m => (
                                                    <option key={m.material_id} value={m.material_id}>{m.material_name} (คงเหลือ: {m.stock_qty} {m.unit || 'ชิ้น'})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input type="number" className="w-full p-2 border rounded-md text-center text-sm" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} min="1" required />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button type="button" onClick={() => handleRemoveItemRow(idx)} className="text-slate-400 hover:text-red-500 disabled:opacity-20" disabled={items.length === 1}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 block mb-1 font-medium">เหตุผลความจำเป็นในการเบิก</label>
                        <textarea rows="2" className="w-full p-2 border rounded-md text-sm placeholder:text-slate-300" value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} placeholder="ระบุเหตุผล เช่น ใช้ในงานเวชระเบียน, สำรองทดแทนชิ้นเดิมที่ชำรุด" required></textarea>
                    </div>

                    <div className="flex justify-between items-center">
                        <button type="button" onClick={handleAddItemRow} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg flex items-center gap-1">
                            <Plus size={14} /> เพิ่มรายการวัสดุ
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm">
                            <Send size={14} /> ส่งคำขอเบิกพัสดุ (Pending)
                        </button>
                    </div>
                </form>
            )}

            {/* ⏱️ แท็บที่ 2: หน้าติดตามสถานะและประวัติ */}
            {activeTab === 'track' && (
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b">
                            <tr>
                                <th className="p-3">เลขที่ใบเบิก</th>
                                <th className="p-3">วันที่ขอเบิก</th>
                                <th className="p-3">ผู้ขอเบิก</th>
                                <th className="p-3">แผนก</th>
                                <th className="p-3">สถานะ Workflow</th>
                                <th className="p-3">เหตุผล</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawList.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-4 text-center text-slate-400">ยังไม่มีประวัติการขอเบิกพัสดุในระบบ</td>
                                </tr>
                            ) : (
                                withdrawList.map((w) => (
                                    <tr key={w.withdraw_id} className="border-b hover:bg-slate-50">
                                        <td className="p-3 font-mono font-bold text-blue-600">{w.withdraw_id}</td>
                                        <td className="p-3">{new Date(w.request_date).toLocaleDateString('th-TH')}</td>
                                        <td className="p-3 font-medium text-slate-700">{w.user_id}</td>
                                        <td className="p-3 text-slate-600">{w.department_id}</td>
                                        <td className="p-3">{getStatusBadge(w.status)}</td>
                                        <td className="p-3 text-slate-500 truncate max-w-xs">{w.remark || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 👔 แท็บที่ 3: มุมมองอนุมัติ */}
            {activeTab === 'approve' && (isApprover || isStorekeeper) && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">📋 รายการบิลใบเบิกที่รอหัวหน้างานตรวจสอบความเหมาะสม</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {withdrawList.filter(w => w.status === 'Pending').length === 0 ? (
                            <div className="text-center p-6 bg-slate-50 rounded-xl border text-slate-400 text-xs">🎉 ไม่มีใบเบิกค้างอนุมัติในขณะนี้</div>
                        ) : (
                            withdrawList.filter(w => w.status === 'Pending').map((w) => (
                                <div key={w.withdraw_id} className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                                    <div>
                                        <span className="font-mono font-bold text-sm text-blue-600">Doc No: {w.withdraw_id}</span>
                                        <div className="text-xs text-slate-500 mt-1">
                                            <strong>ผู้เบิก:</strong> {w.user_id} | <strong>แผนก:</strong> {w.department_id}
                                        </div>
                                        <div className="text-xs text-slate-400 italic mt-0.5">"เหตุผล: {w.remark}"</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => handleUpdateStatus(w.withdraw_id, 'Rejected')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1">
                                            <XCircle size={14}/> ปฏิเสธ (Rejected)
                                        </button>
                                        <button type="button" onClick={() => handleUpdateStatus(w.withdraw_id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1">
                                            <CheckCircle size={14}/> อนุมัติการเบิก (Approved)
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* 📦 แท็บที่ 4: เจ้าหน้าที่พัสดุจ่ายของ */}
            {activeTab === 'issue' && isStorekeeper && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-purple-700">📦 รายการที่ผ่านการอนุมัติแล้ว และพร้อมจ่ายออกจากคลังสินค้า</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {withdrawList.filter(w => w.status === 'Approved').length === 0 ? (
                            <div className="text-center p-6 bg-purple-50/20 rounded-xl border text-slate-400 text-xs">ไม่มีรายการรอจ่ายของออกในขณะนี้</div>
                        ) : (
                            withdrawList.filter(w => w.status === 'Approved').map((w) => (
                                <div key={w.withdraw_id} className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <span className="font-mono font-bold text-purple-700">บิลที่รอจ่าย: {w.withdraw_id}</span>
                                            <p className="text-[11px] text-slate-400 mt-0.5">ผู้ขอเบิก: {w.user_id} | แผนก: {w.department_id}</p>
                                        </div>
                                        {getStatusBadge(w.status)}
                                    </div>
                                    <div className="text-xs text-slate-600 italic">
                                        "หมายเหตุเพิ่มเติม: {w.remark || '-'}"
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleUpdateStatus(w.withdraw_id, 'Completed')}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <Package size={14}/> ยืนยันการจัดจ่ายพัสดุ & ตัดยอดสต๊อกสำเร็จ (Completed)
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Activity, 
    Search, 
    Filter, 
    LogIn, 
    LogOut, 
    PlusCircle, 
    Edit, 
    Trash2, 
    FileText, 
    RotateCcw, 
    CheckCircle, 
    Clock, 
    User, 
    Info 
} from 'lucide-react';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/logs');
            setLogs(res.data);
        } catch (err) {
            console.error('ไม่สามารถโหลดประวัติการใช้งานได้:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // 🎨 ฟังก์ชันสำหรับสร้างป้ายชื่อสีและไอคอนกั้นประเภท Action ชัดเจน
    const renderActionBadge = (action) => {
        const act = (action || '').toLowerCase();
        
        switch (act) {
            case 'login':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        <LogIn size={13} /> เข้าระบบ
                    </span>
                );
            case 'logout':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                        <LogOut size={13} /> ออกจากระบบ
                    </span>
                );
            case 'add':
            case 'upload':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <PlusCircle size={13} /> เพิ่มข้อมูล
                    </span>
                );
            case 'withdraw':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <FileText size={13} /> เบิกพัสดุ
                    </span>
                );
            case 'return':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <RotateCcw size={13} /> คืนพัสดุ
                    </span>
                );
            case 'approve':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        <CheckCircle size={13} /> อนุมัติ
                    </span>
                );
            case 'edit':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                        <Edit size={13} /> แก้ไขข้อมูล
                    </span>
                );
            case 'delete':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        <Trash2 size={13} /> ลบข้อมูล
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <Info size={13} /> {action || 'ทั่วไป'}
                    </span>
                );
        }
    };

    // 🔍 กรองข้อมูลตามคำค้นหาและปุ่ม Filter
    const filteredLogs = logs.filter((log) => {
        const matchesSearch = 
            (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.module && log.module.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

        if (actionFilter === 'all') return matchesSearch;
        return matchesSearch && (log.action || '').toLowerCase() === actionFilter.toLowerCase();
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="text-rose-600" size={24} />
                            ระบบ Log และ Audit Trail
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            ตรวจสอบประวัติการใช้งานระบบ การเข้าระบบ เพิ่ม ลด แก้ไข อนุมัติ และเบิกจ่าย
                        </p>
                    </div>
                </div>

                {/* ตัวกรองและค้นหา */}
                <div className="mt-4 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="ค้นหาชื่อผู้ใช้, รายละเอียด, หรือโมดูล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 border rounded-lg">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ตัวกรอง:</span>
                        <select
                            className="bg-transparent text-xs font-semibold text-slate-700 border-none focus:outline-none cursor-pointer"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="all">🌐 แสดงทั้งหมด (All)</option>
                            <option value="login">🔑 เข้าสู่ระบบ (Login)</option>
                            <option value="add">➕ เพิ่ม/อัปโหลด (Add)</option>
                            <option value="withdraw">📤 เบิกพัสดุ (Withdraw)</option>
                            <option value="return">🔄 คืนพัสดุ (Return)</option>
                            <option value="approve">✅ อนุมัติ (Approve)</option>
                            <option value="edit">✏️ แก้ไข (Edit)</option>
                            <option value="delete">🗑️ ลบข้อมูล (Delete)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ตารางแสดง Log มีเส้นกั้นชัดเจน */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-slate-300">
                            <tr>
                                <th className="p-3.5 border-r border-slate-200 w-44">วัน-เวลา (Timestamp)</th>
                                <th className="p-3.5 border-r border-slate-200 w-52">ผู้ใช้งาน (User)</th>
                                <th className="p-3.5 border-r border-slate-200 w-36 text-center">การกระทำ (Action)</th>
                                <th className="p-3.5 border-r border-slate-200 w-52">โมดูล (Module)</th>
                                <th className="p-3.5">รายละเอียดเพิ่มเติม (Details)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        กำลังโหลดประวัติการใช้งาน...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        ไม่พบประวัติการใช้งานที่ตรงกับเงื่อนไข
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log, index) => (
                                    <tr 
                                        key={log.id || index} 
                                        className={`hover:bg-blue-50/50 transition-colors ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                                        }`}
                                    >
                                        {/* เวลา */}
                                        <td className="p-3.5 border-r border-slate-200 text-xs font-mono text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} className="text-slate-400" />
                                                <span>{log.timestamp ? new Date(log.timestamp).toLocaleString('th-TH') : '-'}</span>
                                            </div>
                                        </td>

                                        {/* ผู้ใช้งาน */}
                                        <td className="p-3.5 border-r border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <User size={15} className="text-slate-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-xs">{log.user || 'ไม่ระบุ'}</p>
                                                    <p className="text-[10px] font-mono text-slate-400">IP: {log.ip_address || '127.0.0.1'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Action Badge */}
                                        <td className="p-3.5 border-r border-slate-200 text-center">
                                            {renderActionBadge(log.action)}
                                        </td>

                                        {/* โมดูล */}
                                        <td className="p-3.5 border-r border-slate-200 text-xs font-medium text-slate-700">
                                            {log.module || '-'}
                                        </td>

                                        {/* รายละเอียด */}
                                        <td className="p-3.5 text-xs text-slate-600 leading-relaxed font-normal">
                                            {log.details || '-'}
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
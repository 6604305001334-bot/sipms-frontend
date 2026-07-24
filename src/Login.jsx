import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, Lock, User, ShieldCheck, UserPlus, ArrowLeft } from 'lucide-react';

// 🎯 ตั้งค่า URL สำหรับ Backend API ให้ยืดหยุ่น และตัดอักขระส่วนเกินที่อาจหลุดมาให้อัตโนมัติ
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = rawUrl.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '');

export default function Login({ onLoginSuccess }) {
    const [isRegisterMode, setIsRegisterMode] = useState(false); // สลับโหมด Login / Register
    
    // State ฟอร์ม
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('เจ้าหน้าที่พัสดุ (Storekeeper)');
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // 🔑 ฟังก์ชันเข้าสู่ระบบ (Login)
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setErrorMsg('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            // 🔄 ยิงไปเช็กรหัสผ่านจริงกับ Database หลังบ้าน ผ่าน API_BASE_URL
            const response = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
            
            if (response.data.success) {
                const userData = response.data.user;
                localStorage.setItem('user', JSON.stringify(userData));

                // 🔄 บันทึก Audit Log การ Login ผ่าน API_BASE_URL
                try {
                    await axios.post(`${API_BASE_URL}/api/logs`, {
                        user: `${userData.username} (${userData.role})`,
                        action: 'login',
                        module: 'ระบบเข้าสู่ระบบ (Authentication)',
                        details: `เข้าสู่ระบบสำเร็จในตำแหน่ง: ${userData.role}`,
                        ip_address: '127.0.0.1'
                    });
                } catch (logErr) {
                    console.error('⚠️ ไม่สามารถบันทึก Audit Log ได้:', logErr);
                }

                setLoading(false);
                if (onLoginSuccess) {
                    onLoginSuccess(userData);
                } else {
                    window.location.reload();
                }
            }
        } catch (err) {
            setLoading(false);
            setErrorMsg(err.response?.data?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    // 📝 ฟังก์ชันสมัครสมาชิก (Register)
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!username.trim() || !password.trim()) {
            setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }

        setLoading(true);

        try {
            // 🔄 ยิงสมัครสมาชิกผ่าน API_BASE_URL
            const response = await axios.post(`${API_BASE_URL}/api/register`, {
                username,
                password,
                role
            });

            if (response.data.success) {
                setLoading(false);
                setSuccessMsg('🎉 สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านของคุณ');
                // เคลียร์ค่า และสลับกลับไปหน้า Login
                setTimeout(() => {
                    setIsRegisterMode(false);
                    setPassword('');
                    setConfirmPassword('');
                    setSuccessMsg('');
                }, 1500);
            }
        } catch (err) {
            setLoading(false);
            setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-1">
                        {isRegisterMode ? <UserPlus size={36} /> : <ShieldCheck size={36} />}
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">
                        {isRegisterMode ? 'สมัครสมาชิกผู้ใช้งานใหม่' : 'ระบบคลังพัสดุ SIPMS'}
                    </h1>
                    <p className="text-xs text-slate-400">
                        {isRegisterMode ? 'สร้างบัญชีผู้ใช้งานเพื่อกำหนดรหัสผ่านและสิทธิ์เข้าใช้' : 'กรอกข้อมูลเพื่อเข้าสู่ระบบและบันทึกประวัติใช้งาน'}
                    </p>
                </div>

                {/* Form เข้าสู่ระบบ หรือ ลงทะเบียน */}
                <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
                    
                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="ตั้งชื่อผู้ใช้ เช่น muthita1222"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสผ่าน (Password)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Confirm Password (แสดงเฉพาะตอน Register) */}
                    {isRegisterMode && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">ยืนยันรหัสผ่าน (Confirm Password)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Role / ตำแหน่ง */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">ตำแหน่ง / สิทธิ์การใช้งาน</label>
                        <select
                            className="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white cursor-pointer font-medium"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={!isRegisterMode} // ตอน Login จะถูกล็อกไว้ตามบัญชีจริง
                        >
                            <option value="เจ้าหน้าที่พัสดุ (Storekeeper)">📦 เจ้าหน้าที่พัสดุ (Storekeeper)</option>
                            <option value="หัวหน้างาน (Approver)">👔 หัวหน้างาน (Approver)</option>
                            <option value="ผู้ขอเบิกพัสดุ (Requester)">👤 ผู้ขอเบิกพัสดุ (Requester)</option>
                        </select>
                    </div>

                    {/* แจ้งเตือน ข้อผิดพลาด / สำเร็จ */}
                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                            {successMsg}
                        </div>
                    )}

                    {/* ปุ่ม Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isRegisterMode ? <UserPlus size={18} /> : <LogIn size={18} />}
                        {loading 
                            ? (isRegisterMode ? 'กำลังบันทึกข้อมูล...' : 'กำลังตรวจสอบ...') 
                            : (isRegisterMode ? 'ยืนยันลงทะเบียนสมาชิก' : 'เข้าสู่ระบบ (Login)')
                        }
                    </button>
                </form>

                {/* แถบสลับโหมด Login <-> Register */}
                <div className="pt-2 border-t text-center">
                    {isRegisterMode ? (
                        <button
                            type="button"
                            onClick={() => { setIsRegisterMode(false); setErrorMsg(''); }}
                            className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 font-medium"
                        >
                            <ArrowLeft size={14} /> กลับไปหน้าเข้าสู่ระบบ (Login)
                        </button>
                    ) : (
                        <p className="text-xs text-slate-500">
                            ยังไม่มีบัญชีผู้ใช้งานใช่ไหม?{' '}
                            <button
                                type="button"
                                onClick={() => { setIsRegisterMode(true); setErrorMsg(''); }}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                สมัครสมาชิกใหม่ที่นี่
                            </button>
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}
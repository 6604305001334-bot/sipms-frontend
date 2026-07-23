import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, Upload, CheckCircle2, AlertCircle, FileUp, Paperclip, ExternalLink } from 'lucide-react';

export default function EDocumentMaster() {
    const [materials, setMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [uploadingDocType, setUploadingDocType] = useState('');
    const [fileToUpload, setFileToUpload] = useState(null);
    const [uploaderName, setUploaderName] = useState('เจ้าหน้าที่พัสดุ'); // สำหรับบันทึก Audit Log
    const [uploadStatus, setUploadStatus] = useState({ loading: false, message: '', isError: false });

    // 🔄 โหลดรายการพัสดุทั้งหมด
    const loadMaterials = async () => {
        try {
            const res = await axios.get('https://sipms-backend.onrender.com/api/materials');
            setMaterials(res.data);
            // ถ้ามีพัสดุที่เลือกอยู่แล้ว ให้อัปเดตข้อมูลพัสดุชิ้นนั้นด้วย
            if (selectedMaterial) {
                const updated = res.data.find(m => m.material_id === selectedMaterial.material_id);
                if (updated) setSelectedMaterial(updated);
            }
        } catch (err) {
            console.error('ไม่สามารถโหลดรายการพัสดุได้:', err);
        }
    };

    useEffect(() => {
        loadMaterials();
    }, []);

    // 🔍 กรองข้อมูลตามคำค้นหา
    const filteredMaterials = materials.filter(item =>
        (item.material_id && item.material_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.material_name && item.material_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 📤 จัดการการอัปโหลดไฟล์จริง + บันทึก Audit Log
    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!selectedMaterial || !uploadingDocType || !fileToUpload) {
            setUploadStatus({ loading: false, message: 'กรุณากรอกข้อมูลและเลือกไฟล์ให้ครบถ้วน', isError: true });
            return;
        }

        setUploadStatus({ loading: true, message: 'กำลังอัปโหลดเอกสาร...', isError: false });

        try {
            // ใช้ FormData รองรับการส่งไฟล์จริง
            const formData = new FormData();
            formData.append('productId', selectedMaterial.material_id);
            formData.append('documentType', uploadingDocType);
            formData.append('file', fileToUpload);

            const response = await axios.post('https://sipms-backend.onrender.com/api/edocument/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success || response.status === 200) {
                setUploadStatus({ loading: false, message: '🎉 อัปโหลดและผูกเอกสารสำเร็จ!', isError: false });

                // 🌟 [บันทึกประวัติ] ยิง Audit Log อัตโนมัติเมื่อแนบเอกสารสำเร็จ
                try {
                    const docTypeNames = {
                        quotation: 'ใบเสนอราคา',
                        po: 'ใบสั่งซื้อ (PO)',
                        delivery: 'ใบส่งของ',
                        tax: 'ใบกำกับภาษี',
                        image: 'รูปภาพพัสดุ'
                    };
                    await axios.post('https://sipms-backend.onrender.com/api/logs', {
                        user: uploaderName,
                        action: 'add',
                        module: 'ระบบเอกสารอิเล็กทรอนิกส์ (e-Document)',
                        details: `ผูกเอกสาร ${docTypeNames[uploadingDocType] || uploadingDocType} (${fileToUpload.name}) เข้ากับพัสดุ: ${selectedMaterial.material_name} (${selectedMaterial.material_id})`,
                        ip_address: '127.0.0.1'
                    });
                } catch (logErr) {
                    console.error('⚠️ ไม่สามารถบันทึก Audit Log ได้:', logErr);
                }

                setFileToUpload(null);
                setUploadingDocType('');
                loadMaterials(); // รีเฟรชตาราง
            }
        } catch (error) {
            setUploadStatus({
                loading: false,
                message: 'เกิดข้อผิดพลาด: ' + (error.response?.data?.error || error.message),
                isError: true
            });
        }
    };

    // 🔗 ฟังก์ชันช่วยแสดงสถานะและปุ่มกดดูไฟล์เอกสาร
    const renderDocCell = (filePath) => {
        if (!filePath) {
            return <span className="text-slate-300 text-xs">-</span>;
        }
        // กำหนด URL ของไฟล์ (ปรับเป็น Path ตามที่เซิร์ฟเวอร์หลังบ้านให้บริการ เช่น /uploads/)
        const fileUrl = filePath.startsWith('http') ? filePath : `https://sipms-backend.onrender.com/uploads/${filePath}`;
        
        return (
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} // ป้องกันไม่ให้ไปสลับ row ที่เลือก
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                title="คลิกเพื่อเปิดดูเอกสาร"
            >
                <Paperclip size={13} />
                <span>เปิดดู</span>
            </a>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-blue-600" size={24} />
                    ระบบจัดการเอกสารอิเล็กทรอนิกส์ (e-Document)
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    ค้นหารายการพัสดุเพื่อผูกเอกสารสำคัญ เช่น ใบเสนอราคา (Quotation), ใบสั่งซื้อ (PO), ใบส่งของ และใบกำกับภาษี
                </p>

                {/* ช่องค้นหา */}
                <div className="mt-4 relative max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="ค้นหาด้วยรหัส หรือชื่อพัสดุ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* ตารางแสดงรายการพัสดุ */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b">
                            <tr>
                                <th className="p-3">รหัสพัสดุ</th>
                                <th className="p-3">ชื่อรายการพัสดุ</th>
                                <th className="p-3 text-center">ใบเสนอราคา</th>
                                <th className="p-3 text-center">ใบสั่งซื้อ (PO)</th>
                                <th className="p-3 text-center">ใบส่งของ</th>
                                <th className="p-3 text-center">ใบกำกับภาษี</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-4 text-center text-slate-400">
                                        ไม่พบข้อมูลพัสดุที่ค้นหา
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((item) => {
                                    const isSelected = selectedMaterial?.material_id === item.material_id;
                                    return (
                                        <tr
                                            key={item.material_id}
                                            onClick={() => setSelectedMaterial(item)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <td className="p-3 font-mono text-slate-600">{item.material_id}</td>
                                            <td className="p-3 text-slate-800">{item.material_name}</td>
                                            <td className="p-3 text-center">{renderDocCell(item.quotation_file)}</td>
                                            <td className="p-3 text-center">{renderDocCell(item.po_file)}</td>
                                            <td className="p-3 text-center">{renderDocCell(item.delivery_file)}</td>
                                            <td className="p-3 text-center">{renderDocCell(item.tax_file)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ฟอร์มอัปโหลดเมื่อเลือกพัสดุ */}
            {selectedMaterial && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <div className="border-b pb-3 flex justify-between items-center">
                        <h3 className="text-base font-bold text-slate-800">
                            แนบเอกสารสำหรับ: <span className="text-blue-600">{selectedMaterial.material_name}</span> ({selectedMaterial.material_id})
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">ชื่อผู้แนบเอกสาร:</span>
                            <input 
                                type="text" 
                                className="border rounded px-2 py-1 text-xs bg-slate-50 font-medium"
                                value={uploaderName}
                                onChange={(e) => setUploaderName(e.target.value)}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1 font-medium">ประเภทเอกสาร</label>
                                <select
                                    className="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
                                    value={uploadingDocType}
                                    onChange={(e) => setUploadingDocType(e.target.value)}
                                    required
                                >
                                    <option value="">-- เลือกประเภทเอกสาร --</option>
                                    <option value="quotation">ใบเสนอราคา (Quotation)</option>
                                    <option value="po">ใบสั่งซื้อ (PO)</option>
                                    <option value="delivery">ใบส่งของ (Delivery Slip)</option>
                                    <option value="tax">ใบกำกับภาษี (Tax Invoice)</option>
                                    <option value="image">รูปภาพพัสดุ (Product Image)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 block mb-1 font-medium">เลือกไฟล์เอกสาร (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={(e) => setFileToUpload(e.target.files[0] || null)}
                                    required
                                />
                            </div>
                        </div>

                        {uploadStatus.message && (
                            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                                uploadStatus.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                                {uploadStatus.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                {uploadStatus.message}
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={uploadStatus.loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <FileUp size={16} />
                                {uploadStatus.loading ? 'กำลังอัปโหลด...' : 'บันทึกการผูกเอกสาร'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
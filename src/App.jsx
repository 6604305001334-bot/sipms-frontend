import React from 'react';
import MainLayout from './MainLayout'; // ดึงเอาโครงสร้างเมนูแนวตั้งที่เราเพิ่งสร้างไปมาใช้

function App() {
  return (
    // ปล่อยให้ MainLayout ทำหน้าที่คุมทั้งหน้าจอ แดชบอร์ด และข้อมูลพื้นฐาน (Master Data) ทั้งหมดแทนระบบเดิม
    <MainLayout />
  );
}

export default App;
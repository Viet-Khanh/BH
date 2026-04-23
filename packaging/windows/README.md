# BanHang Windows Packaging

Bo file nay dung de tao mot installer Windows tong cho mo hinh:

- Electron app: giao dien nguoi dung
- BanHang backend: Windows Service `BanHangBackend`
- MongoDB: Windows Service `MongoDB`

Khach hang khong can Git, VS Code, hay `npm install`. Khach chi chay file
`BanHang-Setup-<version>.exe`.

## Yeu cau tren may build

Chuan bi tren may Windows dung de dong goi:

- Node.js LTS
- Inno Setup 6
- Git, neu lay code tu repository
- WinSW x64
- MongoDB Community Server MSI

Dat file phu thuoc vao:

```text
packaging\windows\prerequisites\
  WinSW-x64.exe
  mongodb.msi
```

`mongodb.msi` co the doi ten tu file cai MongoDB chinh thuc cho ngan gon.

## Tao thu muc stage

Chay PowerShell tai thu muc goc repo:

```powershell
powershell -ExecutionPolicy Bypass -File packaging\windows\scripts\build-release.ps1
```

Script nay se tao:

```text
release\windows\stage\
  app\              # BanHang Electron win-unpacked
  backend\          # backend + node_modules production + node.exe
  service\          # WinSW da rename thanh BanHangBackend.exe
  prerequisites\    # mongodb.msi
```

## Build installer

Mo file sau bang Inno Setup va bam Compile:

```text
packaging\windows\installer\BanHang.iss
```

Ket qua nam o:

```text
release\windows\installer\BanHang-Setup-0.0.1.exe
```

## Thu nghiem tren may sach

Chay installer bang quyen Administrator, sau do kiem tra:

```powershell
Get-Service MongoDB
Get-Service BanHangBackend
Invoke-RestMethod http://localhost:5000/api/health
```

Neu API tra ve `{ ok: true }`, mo shortcut `BanHang` tren desktop.

## Thu muc du lieu tren may khach

```text
C:\Program Files\BanHang\        # chuong trinh
C:\ProgramData\BanHang\backups   # backup
C:\ProgramData\BanHang\logs      # log backend service
```

Khong xoa `C:\ProgramData\BanHang` khi go app neu van muon giu du lieu.

## Ghi chu

- Installer nay khong xoa MongoDB khi uninstall de tranh mat du lieu ngoai y muon.
- Backend service co `delayedAutoStart` de khoi dong sau MongoDB.
- Neu cong `5000` bi ung dung khac chiem, doi `PORT` trong `.env` va can build
  frontend voi `VITE_API_URL` tuong ung.

==========================

Dưới đây là quy trình chuẩn từ đầu đến cuối.

A. Trên máy của bạn để tạo file cài

Chuẩn bị máy Windows build:

Cài Node.js LTS
Cài Inno Setup 6
Tải WinSW x64
Tải MongoDB Community Server .msi
Đặt file phụ thuộc vào:

packaging\windows\prerequisites\
  WinSW-x64.exe
  mongodb.msi
Tại thư mục gốc repo, chạy:
powershell -ExecutionPolicy Bypass -File packaging\windows\scripts\build-release.ps1
Mở Inno Setup, compile file:
packaging\windows\installer\BanHang.iss
Sau khi compile xong, lấy file:
release\windows\installer\BanHang-Setup-0.0.1.exe
Đây là file gửi cho khách.

B. Trên máy khách mới

Copy file này sang máy khách:
BanHang-Setup-0.0.1.exe
Bấm chuột phải, chọn:
Run as administrator
Cài theo wizard:
Next -> Next -> Install -> Finish
Installer sẽ tự làm các việc:

Cài MongoDB service
Copy backend
Cài BanHangBackend service
Start backend service
Copy Electron app
Tạo shortcut BanHang ngoài Desktop
Kiểm tra API health
Sau khi cài xong, kiểm tra nhanh bằng PowerShell:
Get-Service MongoDB
Get-Service BanHangBackend
Invoke-RestMethod http://localhost:5000/api/health
Kết quả đúng:

MongoDB: Running
BanHangBackend: Running
/api/health: ok = true
Mở app từ shortcut:
Desktop -> BanHang
Test bắt buộc:
Tạo thử sản phẩm
Tạo thử hóa đơn
Tắt app
Mở lại app
Khởi động lại máy
Mở lại BanHang
Kiểm tra dữ liệu còn đầy đủ
C. Khi gửi cho khách

Thuận tiện nhất là gửi qua Google Drive/OneDrive:

BanHang-Setup-0.0.1.exe
Không gửi source code, không bắt khách cài Git, không bắt khách chạy npm.

D. Khi có lỗi cần kiểm tra

Mở PowerShell Administrator:

Get-Service MongoDB
Get-Service BanHangBackend
Start-Service MongoDB
Start-Service BanHangBackend
Invoke-RestMethod http://localhost:5000/api/health
Log backend nằm ở:

C:\ProgramData\BanHang\logs
Dữ liệu/backup nên giữ ở:

C:\ProgramData\BanHang
Chốt quy trình: bạn build ra BanHang-Setup-0.0.1.exe, khách chỉ cần chạy file đó bằng quyền Administrator, cài xong mở shortcut BanHang là dùng.
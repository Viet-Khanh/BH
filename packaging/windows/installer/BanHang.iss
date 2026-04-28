#define MyAppName "BanHang"
#define MyAppVersion "0.0.1"
#define MyAppPublisher "Rostek"
#define StageDir "..\..\..\release\windows\stage"

[Setup]
AppId={{D0196E87-7934-44B9-A107-6C5F0B6F9C72}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\BanHang
DefaultGroupName=BanHang
DisableProgramGroupPage=yes
OutputDir=..\..\..\release\windows\installer
OutputBaseFilename=BanHang-Setup-{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
SetupLogging=yes
UninstallDisplayName=BanHang

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Dirs]
Name: "{commonappdata}\BanHang"; Permissions: users-modify
Name: "{commonappdata}\BanHang\backups"; Permissions: users-modify
Name: "{commonappdata}\BanHang\logs"; Permissions: users-modify

[Files]
Source: "{#StageDir}\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#StageDir}\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#StageDir}\service\BanHangBackend.exe"; DestDir: "{app}\service"; Flags: ignoreversion
Source: "..\service\BanHangBackend.xml"; DestDir: "{app}\service"; Flags: ignoreversion
Source: "..\scripts\install-backend-service.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\scripts\uninstall-backend-service.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\scripts\check-health.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "..\scripts\backup.ps1"; DestDir: "{app}\scripts"; Flags: ignoreversion
Source: "{#StageDir}\prerequisites\mongodb.msi"; DestDir: "{tmp}"; DestName: "mongodb.msi"; Flags: deleteafterinstall; Check: not ServiceExists('MongoDB')

[Icons]
Name: "{autoprograms}\BanHang"; Filename: "{app}\BanHang.exe"
Name: "{autodesktop}\BanHang"; Filename: "{app}\BanHang.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Tao shortcut ngoai Desktop"; GroupDescription: "Shortcut:"

[Run]
Filename: "{sys}\msiexec.exe"; Parameters: "/i ""{tmp}\mongodb.msi"" /qn ADDLOCAL=""ServerService,Router,Client"" SHOULD_INSTALL_COMPASS=""0"""; StatusMsg: "Dang cai MongoDB service..."; Flags: waituntilterminated; Check: not ServiceExists('MongoDB')
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\install-backend-service.ps1"" -AppDir ""{app}"""; StatusMsg: "Dang cai BanHang backend service..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\check-health.ps1"""; StatusMsg: "Dang kiem tra API..."; Flags: runhidden waituntilterminated

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\uninstall-backend-service.ps1"""; Flags: runhidden waituntilterminated

[Code]
function ServiceExists(ServiceName: string): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec(ExpandConstant('{sys}\sc.exe'), 'query "' + ServiceName + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

procedure StopServiceBeforeCopy(ServiceName: string);
var
  ResultCode: Integer;
begin
  if ServiceExists(ServiceName) then
  begin
    Exec(
      'powershell.exe',
      '-NoProfile -ExecutionPolicy Bypass -Command "Stop-Service -Name ''' + ServiceName + ''' -Force -ErrorAction SilentlyContinue; $svc = Get-Service -Name ''' + ServiceName + ''' -ErrorAction SilentlyContinue; if ($svc) { $svc.WaitForStatus(''Stopped'', ''00:00:30'') }"',
      '',
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    );
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
  begin
    StopServiceBeforeCopy('BanHangBackend');
  end;
end;

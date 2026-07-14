; AniVault Custom NSIS Installer Script
; This runs during installation

!macro customInstall
  ; Add AniVault to Windows "Add/Remove Programs" with correct info
  WriteRegStr HKCU "Software\AniVault" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\AniVault" "Version" "${VERSION}"
!macroend

!macro customUnInstall
  ; Clean up registry on uninstall
  DeleteRegKey HKCU "Software\AniVault"
!macroend

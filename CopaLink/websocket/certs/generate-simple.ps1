# Script simplificado para generar certificados usando makecert o certutil
# Para Windows sin OpenSSL

$certPath = $PSScriptRoot
$ip = "192.168.1.68"

Write-Host "Generando certificados para $ip..." -ForegroundColor Cyan

# Crear certificado usando New-SelfSignedCertificate
$cert = New-SelfSignedCertificate `
    -DnsName $ip, "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(2) `
    -KeyExportPolicy Exportable `
    -KeySpec Signature `
    -KeyLength 2048 `
    -KeyAlgorithm RSA `
    -HashAlgorithm SHA256

$thumbprint = $cert.Thumbprint
Write-Host "Certificado creado: $thumbprint" -ForegroundColor Green

# Exportar como PFX con contraseña
$pfxPath = Join-Path $certPath "server.pfx"
$password = ConvertTo-SecureString -String "copalink123" -Force -AsPlainText
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$thumbprint" -FilePath $pfxPath -Password $password | Out-Null
Write-Host "PFX exportado: $pfxPath" -ForegroundColor Green

# Exportar certificado público
$certPath_crt = Join-Path $certPath "server.crt"
Export-Certificate -Cert "Cert:\CurrentUser\My\$thumbprint" -FilePath $certPath_crt -Type CERT | Out-Null
Write-Host "Certificado público exportado: $certPath_crt" -ForegroundColor Green

Write-Host "`n✅ Archivos generados:" -ForegroundColor Green
Write-Host "   - server.pfx (usaremos este en Node.js)" -ForegroundColor White
Write-Host "   - server.crt (certificado público)" -ForegroundColor White
Write-Host "`n⚠️  El servidor Node.js usará el archivo PFX" -ForegroundColor Yellow
Write-Host "   Contraseña del PFX: copalink123" -ForegroundColor Yellow

# Limpiar del almacén
Remove-Item -Path "Cert:\CurrentUser\My\$thumbprint" -DeleteKey -Force
Write-Host "`n🗑️  Certificado removido del almacén de Windows" -ForegroundColor Gray

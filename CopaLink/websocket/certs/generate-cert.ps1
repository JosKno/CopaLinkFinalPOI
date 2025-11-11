# Script para generar certificado self-signed para WebSocket/HTTPS
# Compatible con Windows PowerShell

$certPath = $PSScriptRoot
$certName = "CopaLink WebSocket Server"
$dnsName = "192.168.1.68"  # Tu IP local

Write-Host "Generando certificado self-signed para $dnsName..." -ForegroundColor Cyan

# Crear certificado
$cert = New-SelfSignedCertificate `
    -DnsName $dnsName, "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName $certName `
    -NotAfter (Get-Date).AddYears(2) `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") `
    -KeyExportPolicy Exportable

Write-Host "Certificado creado con Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

# Exportar certificado (.crt)
$certFilePath = Join-Path $certPath "server.crt"
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($certFilePath, $certBytes)
Write-Host "Certificado exportado: $certFilePath" -ForegroundColor Green

# Exportar clave privada (.key) - formato PEM
$keyFilePath = Join-Path $certPath "server.key"
$password = ConvertTo-SecureString -String "copalink" -Force -AsPlainText
$pfxPath = Join-Path $certPath "temp.pfx"

# Exportar a PFX temporal
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null

# Convertir PFX a PEM usando OpenSSL (si está disponible)
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    Write-Host "Convirtiendo con OpenSSL..." -ForegroundColor Yellow
    & openssl pkcs12 -in $pfxPath -nocerts -out $keyFilePath -nodes -password pass:copalink
    & openssl x509 -in $pfxPath -inform PFX -out $certFilePath -password pass:copalink
    Remove-Item $pfxPath -Force
} else {
    Write-Host "⚠️  OpenSSL no encontrado. Usando método alternativo..." -ForegroundColor Yellow
    
    # Método alternativo sin OpenSSL
    $rsaKey = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
    $keyPem = "-----BEGIN PRIVATE KEY-----`n"
    $keyPem += [Convert]::ToBase64String($rsaKey.ExportPkcs8PrivateKey(), [System.Base64FormattingOptions]::InsertLineBreaks)
    $keyPem += "`n-----END PRIVATE KEY-----`n"
    [System.IO.File]::WriteAllText($keyFilePath, $keyPem)
    
    # Exportar certificado en formato PEM
    $certPem = "-----BEGIN CERTIFICATE-----`n"
    $certPem += [Convert]::ToBase64String($cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert), [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem += "`n-----END CERTIFICATE-----`n"
    [System.IO.File]::WriteAllText($certFilePath, $certPem)
    
    Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Certificados generados exitosamente:" -ForegroundColor Green
Write-Host "   - Certificado: $certFilePath" -ForegroundColor White
Write-Host "   - Clave privada: $keyFilePath" -ForegroundColor White
Write-Host "`n⚠️  IMPORTANTE: En móvil/navegador, deberás aceptar el certificado self-signed" -ForegroundColor Yellow
Write-Host "   cuando te pregunte si confías en la conexión." -ForegroundColor Yellow

# Limpiar certificado del almacén (opcional)
# Remove-Item -Path "Cert:\CurrentUser\My\$($cert.Thumbprint)" -DeleteKey

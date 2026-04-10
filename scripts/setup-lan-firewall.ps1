# Run as Administrator
netsh advfirewall firewall add rule name="BikeBrowser API 3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="BikeBrowser Web 5173" dir=in action=allow protocol=TCP localport=5173
Write-Host "Firewall rules added for ports 3001 and 5173"

from onvif import ONVIFCamera

# Параметры подключения к камере
camera_ip = '192.168.1.68'
port = 80
username = 'admin'
password = 'password'

# Подключение к камере через ONVIF
mycam = ONVIFCamera(camera_ip, port, username, password)

# Получение PTZ сервиса
ptz_service = mycam.create_ptz_service()

# Получение сервиса Media
media = mycam.create_media_service()
# Get target profile
media_profile = media.GetProfiles()[0]
# Use the first profile and Profiles have at least one
token = media_profile.token
# PTZ controls  -------------------------------------------------------------
ptz = mycam.create_ptz_service()
# Get available PTZ services
request = ptz.create_type('GetServiceCapabilities')
Service_Capabilities = ptz.GetServiceCapabilities(request)
# Get PTZ status
status = ptz.GetStatus({'ProfileToken': token})
print(status)

request = self.ptz.create_type('GetConfigurationOptions')
request.ConfigurationToken = self.media_profile.PTZConfiguration.token
ptz_configuration_options = self.ptz.GetConfigurationOptions(request)
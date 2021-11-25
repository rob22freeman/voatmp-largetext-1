call environment-variables.cmd

:: Delete current schema content or download will error
rmdir /s /q %WEBSITEDEST%\%WEBSITEFOLDERNAME%

call "%programfiles(x86)%\Microsoft Visual Studio\2019\Professional\Common7\Tools\VsDevCmd.bat"
pac paportal download --path %WEBSITEDEST% -id %WEBSITEID%

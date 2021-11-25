call environment-variables.cmd

call "%programfiles(x86)%\Microsoft Visual Studio\2019\Professional\Common7\Tools\VsDevCmd.bat"
echo on
pac paportal upload --path %WEBSITEDEST%\%WEBSITEFOLDERNAME%

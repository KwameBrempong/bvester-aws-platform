@echo off
echo Deploying Fixed Homepage to S3
echo ==============================

REM Copy file to S3 bucket with content-type
echo Uploading index.html...
curl -X PUT https://bvester-website-public.s3.eu-west-2.amazonaws.com/index.html ^
     -H "Content-Type: text/html" ^
     -H "Cache-Control: no-cache" ^
     --data-binary "@web-app/index.html"

echo.
echo Homepage deployed! The Login and Start Free Trial buttons should now work.
echo.
echo Test at: https://bvester.com
echo.
pause
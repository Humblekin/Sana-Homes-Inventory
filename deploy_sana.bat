@echo off
echo ==========================================
echo Sana Homes - Supabase Deployment Script
echo ==========================================
echo.
echo Phase 1: Authentication
echo ------------------------------------------
call npx supabase login
echo.
echo Phase 2: Linking Project
echo ------------------------------------------
call npx supabase link --project-ref olwajxplzqcxlbqbfhnr
echo.
echo Phase 3: Deploying Paystack Verification
echo ------------------------------------------
call npx supabase functions deploy paystack-verify --no-verify-jwt
echo.
echo Phase 4: Setting Production Secrets
echo ------------------------------------------
echo Please have your Paystack Secret Key ready.
set /p paystack_key="Enter your Paystack Secret Key (sk_test_...): "
call npx supabase secrets set PAYSTACK_SECRET_KEY=%paystack_key%
echo.
echo ==========================================
echo DEPLOYMENT COMPLETE!
echo ==========================================
pause

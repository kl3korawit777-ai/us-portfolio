# ตั้งค่า Supabase สำหรับซิงก์พอร์ต

ไฟล์นี้ไม่มี key ใด ๆ ปลอดภัยที่จะอยู่ใน repo สาธารณะ

## ขั้นตอน (ทำตามลำดับ ห้ามข้าม)

1. **สร้าง project** ที่ https://supabase.com สมัครแล้วกด New project ตั้งชื่อ เลือกภูมิภาคใกล้ไทย (เช่น Singapore) และตั้งรหัสผ่านฐานข้อมูล (เก็บไว้ ไม่ต้องใช้ในเว็บ)
2. **รัน SQL** เปิด SQL Editor > New query > วางเนื้อหาทั้งไฟล์ `supabase/schema.sql` > กด Run ต้องขึ้น "Success. No rows returned"
3. **ตั้ง URL** ไปที่ Authentication > URL Configuration
   - Site URL: `https://kl3korawit777-ai.github.io/us-portfolio/`
   - Redirect URLs: กด Add URL ใส่ `https://kl3korawit777-ai.github.io/us-portfolio/` แล้วบันทึก
4. **สร้างบัญชีของคุณพร้อมรหัสผ่าน** (แนะนำ ใช้ล็อกอินได้ทุกที่รวมถึงแอปที่เพิ่มลงหน้าจอหลักบนมือถือ และไม่ต้องรออีเมล) ไปที่ Authentication > Users > Add user > Create new user ใส่อีเมลกับรหัสผ่านของคุณ และติ๊ก **Auto Confirm User** แล้วกดสร้าง
   - ล็อกอินด้วยลิงก์ทางอีเมลก็ใช้ได้ แต่แพ็กเกจฟรีแก้เทมเพลตอีเมลไม่ได้ (ต้องตั้ง custom SMTP ก่อน) จึงไม่มีรหัส 6 หลักในอีเมล และบน iPhone ที่เพิ่มแอปลงหน้าจอหลัก ลิงก์จะเปิดใน Safari ซึ่งแยกที่เก็บข้อมูลจากแอป ถ้าใช้แอป ให้ล็อกอินด้วยรหัสผ่าน
5. **คัดลอก 2 ค่า** ไปที่ Project Settings > API (หรือ API Keys)
   - Project URL (รูปแบบ `https://xxxx.supabase.co`)
   - anon key (บางหน้าเรียก publishable key) ส่งให้ผมใส่ในโค้ดได้
   - **ห้ามส่ง `service_role` / secret key เด็ดขาด** key นั้นข้าม RLS ทั้งหมด

## ตรวจว่า RLS ทำงานหลังรัน SQL

ใน Table Editor เปิดตาราง `portfolios` ต้องเห็นป้าย RLS enabled ใน SQL Editor รันคำสั่งนี้ ต้องได้ 3 แถว (select, insert, update):

```sql
select policyname, cmd from pg_policies where tablename = 'portfolios';
```

ตรวจสิทธิ์ของ anon ต้องไม่มีแถวเลย:

```sql
select grantee, privilege_type from information_schema.role_table_grants
where table_name = 'portfolios' and grantee = 'anon';
```

## ทดสอบว่าคนอื่นอ่านข้อมูลคุณไม่ได้

ทำหลังจากเว็บซิงก์ข้อมูลขึ้นแล้ว (ต้องมีแถวของคุณอยู่) แทน `URL` และ `ANON` ด้วยค่าของคุณ (anon key เปิดเผยได้ เพราะ RLS เปิดอยู่)

**1) คนที่ไม่ได้ล็อกอิน** ต้องได้ error `permission denied` (ไม่ใช่ข้อมูลของคุณ):

```powershell
curl.exe -s "URL/rest/v1/portfolios?select=*" -H "apikey: ANON" -H "Authorization: Bearer ANON"
```

**2) ล็อกอินเป็นอีกบัญชี** สมัครอีเมลที่สองในหน้าเว็บ (ทำก่อนปิดการสมัคร) หรือสร้างผู้ใช้ทดสอบใน Authentication > Users แล้วนำ access token ของบัญชีนั้นมาใส่ ผลต้องเป็น `[]` (ว่าง) ไม่ใช่ข้อมูลของคุณ:

```powershell
curl.exe -s "URL/rest/v1/portfolios?select=*" -H "apikey: ANON" -H "Authorization: Bearer TOKEN_ของบัญชีอื่น"
```

**3) บัญชีอื่นเขียนแถวของคุณ** (ใส่ user_id ของคุณ) ต้องถูกปฏิเสธ (error `row-level security`):

```powershell
curl.exe -s -X POST "URL/rest/v1/portfolios" -H "apikey: ANON" -H "Authorization: Bearer TOKEN_ของบัญชีอื่น" -H "Content-Type: application/json" -d "{\"user_id\":\"UUID_ของคุณ\",\"data\":{}}"
```

ถ้าข้อใดไม่เป็นไปตามนี้ **หยุดใช้ซิงก์และบอกผมทันที**

## ใส่ค่าในโค้ด

เปิด `index.html` ค้นหา `SUPABASE_URL` ใส่ Project URL และ anon key ในสองบรรทัดนั้น (ห้ามใส่ service_role) แล้ว commit/push

## หลังล็อกอินบัญชีของคุณสำเร็จแล้ว

ปิดการสมัครใหม่: Authentication > Sign In / Providers (หรือ Settings) ปิด "Allow new users to sign up" เพราะ anon key เปิดเผยอยู่ใน repo ใครก็ขอสมัครบัญชีใหม่ได้ (อ่านพอร์ตคุณไม่ได้ แต่ไม่จำเป็นต้องเปิดไว้)

## ข้อจำกัดของแพ็กเกจฟรี

- อีเมลล็อกอินจากระบบในตัวมีโควตาต่อชั่วโมงต่ำ ถ้าไม่มาให้รอสักพัก
- โปรเจกต์ถูก pause เมื่อไม่มีการใช้งานราว 7 วัน กด Restore ในหน้า Supabase ข้อมูลไม่หาย

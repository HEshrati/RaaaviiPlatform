-- داده‌های تست پنل حرفه‌ای‌ها. این فایل فقط با شماره‌ها و عناوین TEST-RAAVI کار می‌کند.
-- قبل از اجرا در محیط عملیاتی حتماً از دیتابیس نسخهٔ پشتیبان گرفته شود.
BEGIN;

INSERT INTO users (phone_number, name, role, is_verified, current_fsm_state)
VALUES
  ('09190000001', 'تست تسهیلگر در انتظار', 'user', true, 'completed'),
  ('09190000002', 'تست تسهیلگر تایید', 'user', true, 'completed'),
  ('09190000003', 'تست همکار در انتظار', 'partner', true, 'completed'),
  ('09190000004', 'تست همکار تایید', 'partner', true, 'completed'),
  ('09190000005', 'تست روانشناس در انتظار', 'user', true, 'completed'),
  ('09190000006', 'تست روانشناس تایید', 'user', true, 'completed'),
  ('09190000007', 'مراجع تست یک', 'user', true, 'completed'),
  ('09190000008', 'مراجع تست دو', 'user', true, 'completed'),
  ('09190000009', 'شرکت‌کننده تست رویداد', 'user', true, 'completed')
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO facilitator_profiles
  (user_id, first_name, last_name, national_id, city, bio, domains, event_experience,
   portfolio_url, sample_events, accepted_manifesto, submitted_at, status,
   resume_received, interview_done, training_done, schedule_set)
SELECT id, 'نسترن', 'آزمون', '0019000001', 'تهران', 'تسهیلگر آزمایشی برای اعتبارسنجی پنل',
  '["هنر و خلاقیت", "بازی و سرگرمی"]'::jsonb, 'سه رویداد آزمایشی',
  'https://example.test/facilitator-pending', '[]'::jsonb, true, NOW(), 'pending_review',
  true, false, false, false
FROM users WHERE phone_number='09190000001'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO facilitator_profiles
  (user_id, first_name, last_name, national_id, city, bio, domains, event_experience,
   portfolio_url, sample_events, accepted_manifesto, submitted_at, status,
   resume_received, interview_done, training_done, schedule_set)
SELECT id, 'سامان', 'آزمون', '0019000002', 'تهران', 'تسهیلگر آزمایشی تاییدشونده',
  '["توسعه فردی", "کتاب و ادبیات"]'::jsonb, 'پنج رویداد آزمایشی',
  'https://example.test/facilitator-approved', '[{"title":"TEST-RAAVI"}]'::jsonb,
  true, NOW(), 'pending_review', true, true, true, true
FROM users WHERE phone_number='09190000002'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO venue_profiles
  (user_id, manager_name, venue_name, national_id, venue_type, address, city, capacity,
   amenities, working_hours, images, accepted_terms, submitted_at, status)
SELECT id, 'مهسا آزمون', 'فضای تست در انتظار راوی', '0029000003', 'کافه',
  'تهران، خیابان آزمایش، پلاک ۱۰', 'تهران', 45,
  '["Wi-Fi", "پارکینگ"]'::jsonb, '{}'::jsonb, '[]'::jsonb, true, NOW(), 'pending_review'
FROM users WHERE phone_number='09190000003'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO venue_profiles
  (user_id, manager_name, venue_name, national_id, venue_type, address, city, capacity,
   amenities, working_hours, images, accepted_terms, submitted_at, status)
SELECT id, 'لیلا آزمون', 'فضای تست تاییدشونده راوی', '0029000004', 'فضای اشتراکی',
  'تهران، میدان آزمایش، پلاک ۲۱', 'تهران', 80,
  '["Wi-Fi", "پروژکتور", "تهویه مطبوع"]'::jsonb, '{}'::jsonb, '[]'::jsonb, true, NOW(), 'pending_review'
FROM users WHERE phone_number='09190000004'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO psychologist_profiles
  (user_id, license_number, mobile_number, first_name, last_name, national_id, name_from_irimc,
   specialty, province, city, verification_status, professional_status, trust_score,
   public_profile_status, session_price, specialties, session_types, submitted_at)
SELECT id, 'TEST-PSY-900005', '09190000005', 'پریا', 'آزمون', '0039000005', 'پریا آزمون',
  'روانشناسی بالینی', 'تهران', 'تهران', 'pending_admin', 'pending_admin', 82,
  'hidden', 800000, '["اضطراب", "روابط"]'::jsonb, '["online"]'::jsonb, NOW()
FROM users WHERE phone_number='09190000005'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO psychologist_profiles
  (user_id, license_number, mobile_number, first_name, last_name, national_id, name_from_irimc,
   specialty, province, city, verification_status, professional_status, trust_score,
   public_profile_status, session_price, specialties, session_types, submitted_at)
SELECT id, 'TEST-PSY-900006', '09190000006', 'امیر', 'آزمون', '0039000006', 'امیر آزمون',
  'مشاوره خانواده', 'تهران', 'تهران', 'pending_admin', 'pending_admin', 91,
  'hidden', 950000, '["خانواده", "زوج‌درمانی"]'::jsonb, '["online", "offline"]'::jsonb, NOW()
FROM users WHERE phone_number='09190000006'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO events
  (title, description, city, category, capacity, event_type, current_bookings, start_date, end_date,
   registration_deadline, location, is_active, price, slug)
SELECT 'TEST-RAAVI رویداد برگزارشده', 'رویداد تستی برای سنجش آمار پنل‌ها', 'تهران', 'توسعه فردی',
  30, 'workshop', 2, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days' + INTERVAL '2 hours',
  NOW() - INTERVAL '10 days', 'فضای تست تاییدشونده راوی', true, 0, 'test-raavi-past-professional'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug='test-raavi-past-professional');

INSERT INTO events
  (title, description, city, category, capacity, event_type, current_bookings, start_date, end_date,
   registration_deadline, location, is_active, price, slug)
SELECT 'TEST-RAAVI رویداد پیش رو', 'رویداد تستی برای سنجش آمار پنل‌ها', 'تهران', 'توسعه فردی',
  40, 'workshop', 1, NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 2 hours',
  NOW() + INTERVAL '4 days', 'فضای تست تاییدشونده راوی', true, 0, 'test-raavi-upcoming-professional'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug='test-raavi-upcoming-professional');

INSERT INTO event_hosts (event_id, host_id, role, name)
SELECT e.id, u.id, 'facilitator', u.name
FROM events e JOIN users u ON u.phone_number='09190000002'
WHERE e.slug IN ('test-raavi-past-professional', 'test-raavi-upcoming-professional')
  AND NOT EXISTS (SELECT 1 FROM event_hosts eh WHERE eh.event_id=e.id AND eh.host_id=u.id);

INSERT INTO bookings (user_id, event_id, status, payment_status, amount_paid, booking_code, confirmed_at)
SELECT u.id, e.id, 'confirmed', 'paid', 0, 'TEST-PAST-01', NOW()
FROM users u JOIN events e ON e.slug='test-raavi-past-professional'
WHERE u.phone_number='09190000007'
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.user_id=u.id AND b.event_id=e.id);

INSERT INTO bookings (user_id, event_id, status, payment_status, amount_paid, booking_code, confirmed_at)
SELECT u.id, e.id, 'confirmed', 'paid', 0, 'TEST-PAST-02', NOW()
FROM users u JOIN events e ON e.slug='test-raavi-past-professional'
WHERE u.phone_number='09190000008'
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.user_id=u.id AND b.event_id=e.id);

INSERT INTO bookings (user_id, event_id, status, payment_status, amount_paid, booking_code, confirmed_at)
SELECT u.id, e.id, 'confirmed', 'paid', 0, 'TEST-UPCOMING-01', NOW()
FROM users u JOIN events e ON e.slug='test-raavi-upcoming-professional'
WHERE u.phone_number='09190000009'
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.user_id=u.id AND b.event_id=e.id);

INSERT INTO event_feedbacks (event_id, user_id, overall_rating, performance_rating, wellbeing_rating, satisfaction_rating)
SELECT e.id, u.id, 5, 5, 4, 5
FROM events e JOIN users u ON u.phone_number='09190000007'
WHERE e.slug='test-raavi-past-professional'
  AND NOT EXISTS (SELECT 1 FROM event_feedbacks ef WHERE ef.event_id=e.id AND ef.user_id=u.id);

INSERT INTO event_feedbacks (event_id, user_id, overall_rating, performance_rating, wellbeing_rating, satisfaction_rating)
SELECT e.id, u.id, 4, 4, 4, 4
FROM events e JOIN users u ON u.phone_number='09190000008'
WHERE e.slug='test-raavi-past-professional'
  AND NOT EXISTS (SELECT 1 FROM event_feedbacks ef WHERE ef.event_id=e.id AND ef.user_id=u.id);

COMMIT;

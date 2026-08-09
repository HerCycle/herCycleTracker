-- Sample Database Seed Data for HerCycle

-- 1. Insert Initial Users
-- Password hash corresponds to 'password123' (BCrypt encoded)
INSERT INTO users (first_name, last_name, email, password, phone, date_of_birth, age, height, weight, blood_group, role, enabled, created_at, created_by)
VALUES 
('System', 'Admin', 'admin@hercycle.com', '$2a$10$f.XqR7mQvH08E/bW5f5/eO9HlA/2X.2k8W65d.L2Q2e8m/Yf2i7mq', '1234567890', '1990-01-01', 36, 165.0, 60.0, 'O+', 'ROLE_ADMIN', TRUE, NOW(), 'SYSTEM'),
('Jane', 'Doe', 'user@hercycle.com', '$2a$10$f.XqR7mQvH08E/bW5f5/eO9HlA/2X.2k8W65d.L2Q2e8m/Yf2i7mq', '9876543210', '1995-05-15', 31, 160.0, 55.0, 'A+', 'ROLE_USER', TRUE, NOW(), 'SYSTEM')
ON DUPLICATE KEY UPDATE email=email;

-- 2. Insert Coupons
INSERT INTO coupons (code, discount_amount, discount_percentage, expiry_date, is_active, created_at, created_by)
VALUES 
('WELCOME10', 0.00, 10.00, '2030-12-31', TRUE, NOW(), 'SYSTEM'),
('FLAT50', 50.00, 0.00, '2030-12-31', TRUE, NOW(), 'SYSTEM')
ON DUPLICATE KEY UPDATE code=code;

-- 3. Insert Products
INSERT INTO products (name, description, price, discount, stock, rating, reviews_count, brand, category, image_url, created_at, created_by)
VALUES 
('Organic Cotton Sanitary Pads', 'Ultra-thin organic cotton sanitary pads with wings. Pack of 10.', 7.99, 0.00, 150, 4.8, 42, 'HerCycle Organic', 'Organic Sanitary Pads', 'https://example.com/pads.png', NOW(), 'SYSTEM'),
('Reusable Cloth Pads', 'Eco-friendly washable organic cotton cloth pads. Pack of 3.', 15.49, 10.00, 80, 4.6, 28, 'GreenLife', 'Reusable Cloth Pads', 'https://example.com/cloth.png', NOW(), 'SYSTEM'),
('Premium Menstrual Cup', 'Medical-grade silicone menstrual cup, size Medium.', 24.99, 15.00, 120, 4.9, 85, 'HerCycle Care', 'Menstrual Cups', 'https://example.com/cup.png', NOW(), 'SYSTEM'),
('Organic Herbal Heating Patch', 'Self-heating herbal patches to relieve menstrual cramp pain. Pack of 5.', 12.99, 0.00, 200, 4.5, 34, 'WarmCare', 'Heating Pads', 'https://example.com/heating.png', NOW(), 'SYSTEM'),
('Intimate Wash - Organic Tea Tree', 'pH-balanced gentle organic intimate wash with tea tree extract, 200ml.', 9.99, 5.00, 95, 4.7, 18, 'NaturaWash', 'Organic Intimate Wash', 'https://example.com/wash.png', NOW(), 'SYSTEM')
ON DUPLICATE KEY UPDATE name=name;

-- 4. Insert Self Care Videos
INSERT INTO self_care (title, description, category, thumbnail, youtube_url, created_at, created_by)
VALUES 
('Nutrition & Diet Guide for Period & PCOS Management', 'Essential dietary and nutrition guidance on foods to eat for period cramps, PCOS, and cycle health.', 'NUTRITION', 'https://img.youtube.com/vi/1SD_29gnFu0/hqdefault.jpg', 'https://www.youtube.com/watch?v=1SD_29gnFu0', NOW(), 'SYSTEM'),
('Gentle Yoga for Period Cramps', 'Relaxing yoga postures to soothe menstrual cycle pain and lower back discomfort.', 'EXERCISE', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400', 'https://www.youtube.com/watch?v=sTANio_2E0Q', NOW(), 'SYSTEM'),
('10-Minute Guided Period Meditation', 'Soothe cramps, mood swings, and anxiety with this simple mindfulness breath meditation.', 'MEDITATION', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400', 'https://www.youtube.com/watch?v=inpok4MKVLM', NOW(), 'SYSTEM'),
('Hormone Balancing & Wellness Tips', 'Important sanitary tips and best hygiene and wellness practices during your cycle.', 'WELLNESS', 'https://images.unsplash.com/photo-1512290900673-0efdb956637b?auto=format&fit=crop&q=80&w=400', 'https://www.youtube.com/watch?v=1SD_29gnFu0', NOW(), 'SYSTEM')
ON DUPLICATE KEY UPDATE title=title;

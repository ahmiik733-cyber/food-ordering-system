-- MySQL Sample Data Insertion Script
-- Smart Online Food Ordering and Restaurant Management System
-- Use the database
USE food_order_db;

-- Clear existing data if necessary (order of deletion respects foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reports;
TRUNCATE TABLE reviews;
TRUNCATE TABLE admins;
TRUNCATE TABLE deliveries;
TRUNCATE TABLE delivery_staff;
TRUNCATE TABLE payments;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE cart;
TRUNCATE TABLE food_items;
TRUNCATE TABLE food_categories;
TRUNCATE TABLE restaurant_owners;
TRUNCATE TABLE restaurants;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users
-- Default password for all: 'password123' (Bcrypt hash: $2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO)
INSERT INTO users (id, name, email, password_hash, role, phone, address) VALUES
(1, 'System Admin', 'admin@foodorder.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'admin', '+1234567890', '123 Head Office St, New York'),
(2, 'Burger Owner', 'owner1@foodorder.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'owner', '+1234567891', '45 Owner Ave, Brooklyn'),
(3, 'Pizza Owner', 'owner2@foodorder.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'owner', '+1234567892', '78 Pizza Court, Queens'),
(4, 'Anas Khan', 'john@customer.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'customer', '+1234567893', '742 Evergreen Terrace, Springfield'),
(5, 'Sarah Connor', 'sarah@customer.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'customer', '+1234567894', '101 Terminus Way, Los Angeles'),
(6, 'Bob Swift', 'delivery1@foodorder.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'delivery', '+1234567895', '12 Delivery lane, Manhattan'),
(7, 'Ahmad Zulfiqar', 'delivery2@foodorder.com', '$2a$10$eImiTXAkRyT78K9A3u3a4e2Z5rC8uCjB7gJ5qJ9z/3Kz7BwHhU5xO', 'delivery', '+1234567896', '99 Speed Road, Staten Island');

-- 2. Insert Restaurants
INSERT INTO restaurants (id, name, description, address, phone, cuisine_type, rating, image_url, status) VALUES
(1, 'Gourmet Burger Kitchen', 'Premium handcrafted burgers with organic ingredients and delicious house sauces.', '15 Gourmet Plaza, Manhattan', '+1999888771', 'American', 4.7, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60', 'active'),
(2, 'Pizza Roma', 'Authentic wood-fired Neapolitan pizzas, freshly baked and topped with imported ingredients.', '22 Italian Blvd, Brooklyn', '+1999888772', 'Italian', 4.5, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60', 'active'),
(3, 'Spice Symphony Lahori Karahi', 'A rich tapestry of traditional Pakistani curries, tandooris, and appetizers.', '88 Curry Street, Queens', '+1999888773', 'Pakistani', 4.2, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=60', 'active'),
(4, 'Sweet Delights Bakery', 'Decadent custom cakes, cupcakes, cookies, and pastries baked fresh daily.', '9 Pastry Lane, Bronx', '+1999888774', 'Desserts', 0.0, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=60', 'pending');

-- 3. Insert Restaurant Owners Mappings
INSERT INTO restaurant_owners (owner_id, restaurant_id) VALUES
(2, 1),
(3, 2),
(3, 3);

-- 4. Insert Food Categories
INSERT INTO food_categories (id, restaurant_id, name) VALUES
(1, 1, 'Burgers'),
(2, 1, 'Sides'),
(3, 1, 'Drinks'),
(4, 2, 'Pizzas'),
(5, 2, 'Pasta'),
(6, 2, 'Beverages'),
(7, 3, 'Appetizers'),
(8, 3, 'Main Course'),
(9, 3, 'Breads & Desserts');

-- 5. Insert Food Items
INSERT INTO food_items (id, category_id, name, description, price, is_available, image_url) VALUES
-- Gourmet Burger Kitchen (Category 1, 2, 3)
(1, 1, 'Classic Beef Burger', 'Angus beef patty, cheddar cheese, lettuce, tomato, pickles, and our signature burger sauce.', 12.99, 1, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60'),
(2, 1, 'Truffle Mushroom Burger', 'Angus beef patty, swiss cheese, sautéed wild mushrooms, and truffle aioli spread.', 14.49, 1, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=60'),
(3, 1, 'Spicy Crispy Chicken Burger', 'Crispy fried chicken breast, pepper jack cheese, jalapeños, and spicy sriracha mayo.', 11.99, 1, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=60'),
(4, 2, 'Loaded Cheese Fries', 'Golden French fries topped with melted cheddar cheese, crispy bacon bits, and chives.', 5.99, 1, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=60'),
(5, 2, 'Beer-Battered Onion Rings', 'Thick cut onion rings coated in craft beer batter, served with barbecue dip.', 4.99, 1, 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=600&auto=format&fit=crop&q=60'),
(6, 3, 'Vanilla Bean Milkshake', 'Creamy vanilla milkshake made with real vanilla bean pods and fresh whipped cream.', 5.49, 1, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60'),
(7, 3, 'Craft Cola', 'Artisanal organic cola flavored with natural herbs and cane sugar.', 2.99, 1, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=60'),

-- Pizza Roma (Category 4, 5, 6)
(8, 4, 'Margherita Pizza', 'San Marzano tomatoes, fresh mozzarella, extra virgin olive oil, and fresh basil leaves.', 13.99, 1, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&auto=format&fit=crop&q=60'),
(9, 4, 'Double Pepperoni Pizza', 'Tomatoes, mozzarella cheese, and double portions of spicy Italian pepperoni slices.', 15.99, 1, 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=60'),
(10, 4, 'Garden Veggie Pizza', 'Mushrooms, red onions, bell peppers, black olives, and sweet corn on thin crust.', 14.99, 1, 'https://images.unsplash.com/photo-1571066811602-71683a3f680d?w=600&auto=format&fit=crop&q=60'),
(11, 5, 'Fettuccine Alfredo', 'Fettuccine pasta tossed in creamy parmesan butter sauce, topped with garlic chicken breast.', 14.49, 1, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=60'),
(12, 5, 'Spaghetti Bolognese', 'Al dente spaghetti served in a rich, slow-simmered minced beef tomato meat sauce.', 13.99, 1, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=60'),
(13, 6, 'San Pellegrino Sparkling Water', 'Refreshing imported Italian sparkling mineral water (750ml).', 3.99, 1, 'https://images.unsplash.com/photo-1608885898957-a599fb16ec18?w=600&auto=format&fit=crop&q=60'),

-- Spice Symphony (Category 7, 8, 9)
(14, 7, 'Vegetable Samosa (2pcs)', 'Crispy triangle pastries filled with spiced potatoes, green peas, served with tamarind chutney.', 4.99, 1, 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60'),
(15, 8, 'Lahori Chicken Karahi with Rice', 'Tender chicken cooked in a traditional wok (karahi) with tomatoes, ginger, green chilies, and freshly ground spices, served with premium Basmati rice.', 16.99, 1, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=60'),
(16, 8, 'Mutton Tikka Masala', 'Succulent boneless mutton pieces marinated in yogurt and spices, grilled to perfection and simmered in a rich tomato gravy.', 15.49, 1, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=60'),
(17, 9, 'Garlic Naan Bread', 'Traditional leavened flatbread topped with minced garlic, fresh cilantro, and ghee.', 2.99, 1, 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&auto=format&fit=crop&q=60'),
(18, 9, 'Gulab Jamun (3pcs)', 'Soft milk solid dumplings soaked in sweet cardamom rose syrup.', 4.49, 1, 'https://images.unsplash.com/photo-1605698881055-312d1e2e13ff?w=600&auto=format&fit=crop&q=60');

-- 6. Insert Carts
INSERT INTO cart (id, user_id) VALUES
(1, 4), -- John's cart
(2, 5); -- Sarah's cart

-- 7. Insert Cart Items
INSERT INTO cart_items (id, cart_id, food_item_id, quantity) VALUES
(1, 1, 1, 2), -- John has 2 Classic Beef Burgers in cart
(2, 1, 4, 1), -- John has 1 Loaded Cheese Fries in cart
(3, 2, 8, 1); -- Sarah has 1 Margherita Pizza in cart

-- 8. Insert Orders
INSERT INTO orders (id, user_id, restaurant_id, total_amount, status, delivery_address, contact_phone, created_at) VALUES
(1, 4, 1, 31.97, 'delivered', '742 Evergreen Terrace, Springfield', '+1234567893', '2026-06-10 12:30:00'),
(2, 5, 2, 17.98, 'delivered', '101 Terminus Way, Los Angeles', '+1234567894', '2026-06-11 09:15:00'),
(3, 4, 3, 24.47, 'preparing', '742 Evergreen Terrace, Springfield', '+1234567893', '2026-06-11 11:30:00');

-- 9. Insert Order Items
INSERT INTO order_items (id, order_id, food_item_id, quantity, price_at_order) VALUES
-- Order 1: 2x Burger ($12.99) + 1x Fries ($5.99)
(1, 1, 1, 2, 12.99),
(2, 1, 4, 1, 5.99),
-- Order 2: 1x Margherita ($13.99) + 1x Water ($3.99)
(3, 2, 8, 1, 13.99),
(4, 2, 13, 1, 3.99),
-- Order 3: 1x Butter Chicken ($16.99) + 1x Samosa ($4.99) + 1x Naan ($2.99)
(5, 3, 15, 1, 16.99),
(6, 3, 14, 1, 4.99),
(7, 3, 17, 1, 2.99);

-- 10. Insert Payments
INSERT INTO payments (id, order_id, payment_method, transaction_id, status, amount, created_at) VALUES
(1, 1, 'card', 'TXN_9988776655', 'completed', 31.97, '2026-06-10 12:32:00'),
(2, 2, 'easypaisa', 'TXN_4433221100', 'completed', 17.98, '2026-06-11 09:16:00'),
(3, 3, 'card', 'TXN_7766554433', 'completed', 24.47, '2026-06-11 11:31:00');

-- 11. Insert Delivery Staff
INSERT INTO delivery_staff (user_id, status, vehicle_type) VALUES
(6, 'busy', 'bicycle'),
(7, 'available', 'motorcycle');

-- 12. Insert Deliveries
INSERT INTO deliveries (id, order_id, delivery_staff_id, status, estimated_delivery_time, actual_delivery_time, created_at) VALUES
(1, 1, 6, 'delivered', '2026-06-10 13:00:00', '2026-06-10 12:55:00', '2026-06-10 12:35:00'),
(2, 2, 7, 'delivered', '2026-06-11 09:45:00', '2026-06-11 09:42:00', '2026-06-11 09:18:00'),
(3, 3, 6, 'assigned', '2026-06-11 12:15:00', NULL, '2026-06-11 11:35:00');

-- 13. Insert Admins
INSERT INTO admins (user_id, permissions_level) VALUES
(1, 'superadmin');

-- 14. Insert Reviews
INSERT INTO reviews (id, user_id, restaurant_id, rating, comment) VALUES
(1, 4, 1, 5, 'Best burger in town! The cheese sauce is incredible, fries are super crispy.'),
(2, 5, 2, 4, 'Authentic Neapolitan crust. Margherita was simple and tasty. Fast delivery.'),
(3, 4, 3, 4, 'Very rich Lahori Chicken Karahi. Fast service, will order again.');

-- 15. Insert Reports
INSERT INTO reports (id, admin_id, report_type, details) VALUES
(1, 1, 'sales', '{"total_sales": 74.42, "completed_orders": 2, "sales_by_restaurant": [{"restaurant_id": 1, "revenue": 31.97}, {"restaurant_id": 2, "revenue": 17.98}], "report_date": "2026-06-11"}'),
(2, 1, 'system', '{"total_registered_users": 7, "active_delivery_agents": 2, "pending_restaurant_approvals": 1, "cpu_usage_pct": 14.5, "db_connection_status": "healthy"}');

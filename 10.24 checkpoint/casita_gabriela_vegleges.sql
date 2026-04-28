-- phpMyAdmin SQL Dump

-- version 5.2.1

-- https://www.phpmyadmin.net/

--

-- Host: 127.0.0.1

-- Generation Time: Apr 28, 2026 at 09:36 AM

-- Server version: 10.4.32-MariaDB

-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;

/*!40101 SET NAMES utf8mb4 */;

--

-- Database: `casita_gabriela`

--

CREATE DATABASE IF NOT EXISTS `casita_gabriela` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE `casita_gabriela`;

-- --------------------------------------------------------

--

-- Table structure for table `booking`

--

-- Creation: Apr 27, 2026 at 07:48 PM

--

DROP TABLE IF EXISTS `booking`;

CREATE TABLE `booking` (

`id` int(11) NOT NULL,

`arrival_date` date NOT NULL,

`departure_date` date NOT NULL,

`people` int(11) NOT NULL,

`booking_date` datetime NOT NULL,

`status` varchar(50) NOT NULL,

`user_id` int(11) NOT NULL,

`room_id` int(11) NOT NULL,

`total_price` int(11) NOT NULL DEFAULT 0

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `booking`:

-- `user_id`

-- `users` -> `id`

-- `room_id`

-- `room` -> `id`

--

--

-- Dumping data for table `booking`

--

INSERT INTO `booking` (`id`, `arrival_date`, `departure_date`, `people`, `booking_date`, `status`, `user_id`, `room_id`, `total_price`) VALUES

(1, '2026-04-24', '2026-04-29', 2, '2026-04-24 10:26:30', 'approved', 1, 1, 0),

(3, '2026-05-05', '2026-05-13', 2, '2026-04-24 11:10:07', 'approved', 2, 1, 0),

(4, '2026-05-05', '2026-05-13', 2, '2026-04-24 11:10:08', 'rejected', 2, 1, 0),

(6, '2026-04-28', '2026-04-29', 1, '2026-04-26 17:55:22', 'approved', 1, 2, 0),

(7, '2026-04-26', '2026-04-27', 2, '2026-04-26 18:17:33', 'approved', 1, 2, 0),

(8, '2026-05-13', '2026-05-20', 1, '2026-04-26 18:23:24', 'approved', 1, 2, 0),

(9, '2026-07-16', '2026-07-23', 1, '2026-04-26 19:16:38', 'rejected', 1, 2, 0),

(10, '2026-06-16', '2026-06-23', 2, '2026-04-27 10:17:34', 'pending', 1, 2, 172200),

(11, '2026-05-20', '2026-05-27', 2, '2026-04-27 14:11:53', 'pending', 1, 1, 119000);

-- --------------------------------------------------------

--

-- Table structure for table `category`

--

-- Creation: Apr 27, 2026 at 07:48 PM

-- Last update: Apr 28, 2026 at 07:34 AM

--

DROP TABLE IF EXISTS `category`;

CREATE TABLE `category` (

`id` int(11) NOT NULL,

`name` varchar(50) NOT NULL,

`image` longtext NOT NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `category`:

--

--

-- Dumping data for table `category`

--

INSERT INTO `category` (`id`, `name`, `image`) VALUES

(4, 'Szuper', 'http://localhost:6969/public/letÃ¶ltÃ©s (7).jpg'),

(5, 'Dupla', 'http://localhost:6969/public/letÃ¶ltÃ©s (13).jpg');

-- --------------------------------------------------------

--

-- Table structure for table `form`

--

-- Creation: Apr 27, 2026 at 07:48 PM

--

DROP TABLE IF EXISTS `form`;

CREATE TABLE `form` (

`id` int(11) NOT NULL,

`name` text NOT NULL,

`email` varchar(50) NOT NULL,

`phone_number` varchar(20) NOT NULL,

`topic` varchar(50) NOT NULL,

`description` varchar(1000) NOT NULL,

`created_at` datetime NOT NULL DEFAULT current_timestamp()

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `form`:

--

--

-- Dumping data for table `form`

--

INSERT INTO `form` (`id`, `name`, `email`, `phone_number`, `topic`, `description`, `created_at`) VALUES

(1, 'Csurgai Christopher', 'csurgaichristopher@gmail.com', '343434343434', 'helokabeloka 5.0', 'asasa', '2026-04-27 12:06:53'),

(2, 'Csurgai Christopher', 'csurgaichristopher@gmail.com', '343434343434', 'helokabeloka 3.0', 'asasas', '2026-04-27 12:06:53'),

(3, 'Csurgai Christopher', 'csurgaichristopher@gmail.com', '343434343434', 'helokabeloka 5.0', 'asasasas', '2026-04-27 12:06:53');

-- --------------------------------------------------------

--

-- Table structure for table `room`

--

-- Creation: Apr 27, 2026 at 07:48 PM

-- Last update: Apr 28, 2026 at 07:35 AM

--

DROP TABLE IF EXISTS `room`;

CREATE TABLE `room` (

`id` int(11) NOT NULL,

`name` varchar(30) NOT NULL,

`description` varchar(1000) NOT NULL,

`price` int(11) NOT NULL,

`ac_availablity` int(11) NOT NULL,

`category` int(11) DEFAULT NULL,

`space` int(11) NOT NULL,

`images` longtext NOT NULL,

`isHighlighted` tinyint(1) NOT NULL DEFAULT 0

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `room`:

-- `category`

-- `category` -> `id`

--

--

-- Dumping data for table `room`

--

INSERT INTO `room` (`id`, `name`, `description`, `price`, `ac_availablity`, `category`, `space`, `images`, `isHighlighted`) VALUES

(1, 'Holdfény lakosztály', 'A tágas, napfényben úszó lakosztály közvetlen kilátást kínál a kertre és a környező dombokra. A természetes fa bútorok és a meleg színvilág nyugodt, otthonos hangulatot teremtenek, miközben a nagy üvegfelületek egész nap kellemes fényt engednek be. A szoba saját erkéllyel, kényelmes ülősarokkal és prémium matraccal felszerelt, így hosszabb tartózkodásra is ideális választás pároknak vagy pihenni vágyóknak.', 8500, 0, 4, 2, '["http://localhost:6969/public/letÃ¶ltÃ©s (12).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (13).jpg","http://localhost:6969/public/letÃ¶ltÃ©s.jpg"]', 1),

(2, 'Párizs szikra', 'Forró és jó', 12300, 0, 5, 4, '["http://localhost:6969/public/letÃ¶ltÃ©s (5).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (10).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (9).jpg"]', 1),

(3, 'Terra Classic Kétszemélyes', 'A családok számára kialakított apartman két külön hálóteret és egy tágas nappalit kínál, így mindenki kényelmesen elfér. A világos, mediterrán stílusú enteriőr barátságos légkört teremt, a gyerekek számára pedig külön kis játszósarok áll rendelkezésre. A konyhasarok és az étkezőasztal lehetővé teszi, hogy a vendégek akár saját ételt is készítsenek, miközben a nagy ablakok kellemes természetes fényt biztosítanak egész nap.', 4500, 1, 4, 3, '["http://localhost:6969/public/letÃ¶ltÃ©s (3).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (9).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (8).jpg"]', 1),

(4, 'Sol Premium Tetőtéri Szoba', 'A Terra Classic a hotel egyik legkedveltebb szobatípusa, amely természetes anyagokkal és földszínekkel teremt nyugodt, harmonikus atmoszférát. A kényelmes ágy, a puha ágynemű és a hangszigetelt falak garantálják a pihentető alvást. A szoba ideális pároknak vagy egyedül utazóknak, akik értékelik a letisztult, otthonos környezetet. A praktikus elrendezés és a gondosan megválasztott részletek kényelmes tartózkodást biztosítanak.', 5600, 0, 5, 4, '["http://localhost:6969/public/letÃ¶ltÃ©s (12).jpg","http://localhost:6969/public/letÃ¶ltÃ©s.jpg","http://localhost:6969/public/letÃ¶ltÃ©s (13).jpg"]', 1),

(5, 'Terra Classic Kétszemélyes', 'A Terra Classic a hotel egyik legkedveltebb szobatípusa, amely természetes anyagokkal és földszínekkel teremt nyugodt, harmonikus atmoszférát. A kényelmes ágy, a puha ágynemű és a hangszigetelt falak garantálják a pihentető alvást. A szoba ideális pároknak vagy egyedül utazóknak, akik értékelik a letisztult, otthonos környezetet. A praktikus elrendezés és a gondosan megválasztott részletek kényelmes tartózkodást biztosítanak.', 4000, 1, 5, 4, '["http://localhost:6969/public/letÃ¶ltÃ©s (13).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (12).jpg","http://localhost:6969/public/letÃ¶ltÃ©s (7).jpg"]', 1),

(7, 'Jardin Superior Szoba', 'A Jardin Superior a hotel csendesebb részén található, ahol a vendégek a kert illataira és madárcsicsergésre ébredhetnek. A modern, letisztult berendezés mellé puha textíliák és hangulatvilágítás társul, amelyek kellemes, nyugodt atmoszférát teremtenek. A franciaágy és a nagy ablakok világos, levegős környezetet biztosítanak, míg a gondosan kialakított részletek kényelmessé teszik a rövid és hosszabb tartózkodásokat is.', 12000, 1, 4, 4, '["http://localhost:6969/public/hotel2_1.avif"]', 0),

(8, 'Costa Blanca Családi Apartman', 'A családok számára kialakított apartman két külön hálóteret és egy tágas nappalit kínál, így mindenki kényelmesen elfér. A világos, mediterrán stílusú enteriőr barátságos légkört teremt, a gyerekek számára pedig külön kis játszósarok áll rendelkezésre. A konyhasarok és az étkezőasztal lehetővé teszi, hogy a vendégek akár saját ételt is készítsenek, miközben a nagy ablakok kellemes természetes fényt biztosítanak egész nap.', 9500, 0, 5, 5, '["http://localhost:6969/public/hotel3_1.jpg"]', 0);

-- --------------------------------------------------------

--

-- Table structure for table `room_review`

--

-- Creation: Apr 27, 2026 at 07:48 PM

--

DROP TABLE IF EXISTS `room_review`;

CREATE TABLE `room_review` (

`id` int(11) NOT NULL,

`stars` int(11) NOT NULL,

`comment` varchar(200) NOT NULL,

`room_id` int(11) NOT NULL,

`user_id` int(11) DEFAULT NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `room_review`:

-- `room_id`

-- `room` -> `id`

-- `user_id`

-- `users` -> `id`

--

--

-- Dumping data for table `room_review`

--

INSERT INTO `room_review` (`id`, `stars`, `comment`, `room_id`, `user_id`) VALUES

(1, 5, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1, 1),

(2, 4, 'aaddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 1, 1),

(3, 4, 'dasfasdfaídfDSFDSdsfWEFweídvFfADQGgsgsgeGGWRGWEGegegGSRGWEGweavSGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 1, 1),

(4, 5, 'aadadad', 1, 1),

(5, 3, 'SDVÍSDFDFsdíaddfíadfsdddAd', 1, 1),

(6, 5, 'aadadadadadaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1, 1),

(7, 2, 'DVYBAFSSDFAÍADVafíresregSVAVDFBFSVÍDÍVSVDSVYFSVÍADJÍSDLVSOVRSVÍDKSJVRUIFDSKJVNLSDJVLSÍVHVJSVKBASFLJGLS', 1, 1),

(8, 5, 'adadadadadad', 1, 1);

-- --------------------------------------------------------

--

-- Table structure for table `users`

--

-- Creation: Apr 27, 2026 at 07:48 PM

--

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (

`id` int(11) NOT NULL,

`name` text NOT NULL,

`password` varchar(100) NOT NULL,

`phone_number` varchar(20) NOT NULL,

`birth_date` date NOT NULL,

`address` varchar(50) NOT NULL,

`identity_card` varchar(50) NOT NULL,

`email` varchar(50) NOT NULL,

`isAdmin` tinyint(1) DEFAULT 0,

`isFirstTimeUser` tinyint(1) DEFAULT 1

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `users`:

--

--

-- Dumping data for table `users`

--

INSERT INTO `users` (`id`, `name`, `password`, `phone_number`, `birth_date`, `address`, `identity_card`, `email`, `isAdmin`, `isFirstTimeUser`) VALUES

(1, 'Csurgai Christopher', '$2b$10$5FasIkniuk8fIk8kCHVMvOY/uQkacRrDnNBCF6Dns7a6luPDf3bV.', '+36222222222', '2026-04-18', 'Mariska u4', '777777uu', 'csurgaichristopher@gmail.com', 1, 0),

(2, 'Sergey Csurgi', '$2b$10$lmz139ivtPuI5NiWZ623NeeOB0K7i7oh8MkmyeE4.NJwAOVwETGCm', '+36333333333', '2026-04-09', 'Marika u 6', '673332AA', 'repedsarku06@gmail.com', 0, 0),

(3, 'Bede Árpád', '$2b$10$TG671estiLKT8mMYdL8dpu4.TnVkXCznXAyk3UeqV3weVMov3dHgq', '+36301234567', '2001-10-20', '6600 Szentes, asd u. 10', '123456AA', 'bede.arpad.arany@gmail.com', 1, 1);

-- --------------------------------------------------------

--

-- Table structure for table `_prisma_migrations`

--

-- Creation: Apr 27, 2026 at 07:48 PM

--

DROP TABLE IF EXISTS `_prisma_migrations`;

CREATE TABLE `_prisma_migrations` (

`id` varchar(36) NOT NULL,

`checksum` varchar(64) NOT NULL,

`finished_at` datetime(3) DEFAULT NULL,

`migration_name` varchar(255) NOT NULL,

`logs` text DEFAULT NULL,

`rolled_back_at` datetime(3) DEFAULT NULL,

`started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),

`applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- RELATIONSHIPS FOR TABLE `_prisma_migrations`:

--

--

-- Dumping data for table `_prisma_migrations`

--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES

('13a3a49b-fdc2-4d11-aba3-75396c832b7e', 'd693b87d9865c29d4415a36d1eb204c5706d7846a6bd65536a7389589290ff5b', '2026-04-22 06:59:52.684', '20260416093438_add_review_user', NULL, NULL, '2026-04-22 06:59:52.611', 1),

('4ef6f47a-9829-4531-85c6-3a8341544507', '61bcfe99b2bec10d4a5037375a67c5f4f0ba7c7a9c4c9c9f2b05c901e6676dd1', '2026-04-22 06:59:52.505', '20260220093733', NULL, NULL, '2026-04-22 06:59:52.235', 1),

('50c402c2-070c-4d4f-abf4-f00c04cf7c50', 'a68c82d9a0048a15728c5ca10e41732fd6827cb279006451e087e5fcd78278f6', '2026-04-27 10:06:53.490', '20260427100653_add_contact_form_created_at_and_rate_limit_support', NULL, NULL, '2026-04-27 10:06:53.475', 1),

('65c86b26-6e5b-429c-9d0b-ead13064a7bf', '2f3bdc09d0cedf5290d10c537d8450ba77a327be23841d18731abec0e3c3293b', '2026-04-22 06:59:52.609', '20260416082948_add_is_first_time_user', NULL, NULL, '2026-04-22 06:59:52.509', 1),

('6dbe992d-294a-4c30-89a2-7e9891705485', '5a976bd12728336daf43aa7a82648e79abaeb0518aa62d3e83a11f9f777c4f34', '2026-04-27 08:14:00.514', '20260427081400_add_total_price_to_booking', NULL, NULL, '2026-04-27 08:14:00.503', 1),

('a4bd0d3e-4bf0-4dfc-9657-3a7ee5f60d61', '13eb2e0897a75f22bf98c547e12823cbae12de6eea813c78e757130f3ac8a31d', '2026-04-22 07:00:02.016', '20260422070001_add_category_table', NULL, NULL, '2026-04-22 07:00:01.968', 1);

--

-- Indexes for dumped tables

--

--

-- Indexes for table `booking`

--

ALTER TABLE `booking`

ADD PRIMARY KEY (`id`),

ADD KEY `room_id` (`room_id`),

ADD KEY `user_id` (`user_id`);

--

-- Indexes for table `category`

--

ALTER TABLE `category`

ADD PRIMARY KEY (`id`),

ADD UNIQUE KEY `category_name_key` (`name`);

--

-- Indexes for table `form`

--

ALTER TABLE `form`

ADD PRIMARY KEY (`id`);

--

-- Indexes for table `room`

--

ALTER TABLE `room`

ADD PRIMARY KEY (`id`),

ADD KEY `room_category_fk` (`category`);

--

-- Indexes for table `room_review`

--

ALTER TABLE `room_review`

ADD PRIMARY KEY (`id`),

ADD KEY `booking_id` (`room_id`),

ADD KEY `user_id` (`user_id`);

--

-- Indexes for table `users`

--

ALTER TABLE `users`

ADD PRIMARY KEY (`id`),

ADD UNIQUE KEY `unique_email` (`email`);

--

-- Indexes for table `_prisma_migrations`

--

ALTER TABLE `_prisma_migrations`

ADD PRIMARY KEY (`id`);

--

-- AUTO_INCREMENT for dumped tables

--

--

-- AUTO_INCREMENT for table `booking`

--

ALTER TABLE `booking`

MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--

-- AUTO_INCREMENT for table `category`

--

ALTER TABLE `category`

MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--

-- AUTO_INCREMENT for table `form`

--

ALTER TABLE `form`

MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--

-- AUTO_INCREMENT for table `room`

--

ALTER TABLE `room`

MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--

-- AUTO_INCREMENT for table `room_review`

--

ALTER TABLE `room_review`

MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--

-- AUTO_INCREMENT for table `users`

--

ALTER TABLE `users`

MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--

-- Constraints for dumped tables

--

--

-- Constraints for table `booking`

--

ALTER TABLE `booking`

ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),

ADD CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`);

--

-- Constraints for table `room`

--

ALTER TABLE `room`

ADD CONSTRAINT `room_category_fk` FOREIGN KEY (`category`) REFERENCES `category` (`id`) ON DELETE SET NULL;

--

-- Constraints for table `room_review`

--

ALTER TABLE `room_review`

ADD CONSTRAINT `room_review_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`),

ADD CONSTRAINT `room_review_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--

-- Metadata

--

USE `phpmyadmin`;

--

-- Metadata for table booking

--

--

-- Metadata for table category

--

--

-- Metadata for table form

--

--

-- Metadata for table room

--

--

-- Metadata for table room_review

--

--

-- Metadata for table users

--

--

-- Metadata for table _prisma_migrations

--

--

-- Metadata for database casita_gabriela

--

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

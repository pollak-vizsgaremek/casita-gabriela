-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 19, 2026 at 10:25 PM
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

DROP TABLE IF EXISTS `booking`;
CREATE TABLE `booking` (
  `id` int(11) NOT NULL,
  `arrival_date` date NOT NULL,
  `departure_date` date NOT NULL,
  `people` int(11) NOT NULL,
  `booking_date` datetime NOT NULL,
  `status` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELATIONSHIPS FOR TABLE `booking`:
--   `user_id`
--       `users` -> `id`
--   `room_id`
--       `room` -> `id`
--

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `arrival_date`, `departure_date`, `people`, `booking_date`, `status`, `user_id`, `room_id`) VALUES
(6, '2026-04-17', '2026-04-18', 1, '2026-04-17 11:19:09', 'approved', 3, 5),
(7, '2026-04-17', '2026-04-30', 2147483647, '2026-04-17 11:24:33', 'approved', 1, 9),
(8, '2026-05-06', '2026-05-14', 1, '2026-04-17 11:35:28', 'approved', 1, 9),
(9, '2026-04-22', '2026-04-30', 1, '2026-04-17 11:54:27', 'approved', 2, 11),
(10, '2026-04-22', '2026-04-30', 1, '2026-04-17 11:55:50', 'pending', 2, 5),
(11, '2026-04-22', '2026-04-30', 1, '2026-04-17 11:59:45', 'pending', 2, 6);

-- --------------------------------------------------------

--
-- Table structure for table `form`
--

DROP TABLE IF EXISTS `form`;
CREATE TABLE `form` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `topic` varchar(50) NOT NULL,
  `description` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELATIONSHIPS FOR TABLE `form`:
--

--
-- Dumping data for table `form`
--

INSERT INTO `form` (`id`, `name`, `email`, `phone_number`, `topic`, `description`) VALUES
(1, 'Csurgai Christopher', 'csurgaichristopher@gmail.com', '343434343434', 'helokabeloka 4.0', 'halál rád');

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
CREATE TABLE `room` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(1000) NOT NULL,
  `price` int(11) NOT NULL,
  `ac_availablity` int(11) NOT NULL,
  `category` varchar(20) NOT NULL,
  `space` int(11) NOT NULL,
  `images` longtext NOT NULL,
  `isHighlighted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELATIONSHIPS FOR TABLE `room`:
--

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`id`, `name`, `description`, `price`, `ac_availablity`, `category`, `space`, `images`, `isHighlighted`) VALUES
(5, 'Császári Szoba', 'Igazi királynak való ez a lakosztály', 39500, 1, 'Premium', 2, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (11).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (12).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (7).jpg\"]', 1),
(6, 'Holdfény Lakosztály', 'Igazán romantikus, gyönyörű szoba pezsgővel.', 11000, 0, 'Dupla', 2, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (8).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (9).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (2).jpg\"]', 1),
(8, 'Parázs Szoba', 'Légkondiciónálás nagyszerűen működik', 8000, 1, 'Classic', 4, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (1).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (5).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (10).jpg\"]', 0),
(9, 'Mennyei Lakosztály', 'nagyon nó nagon szép', 8700, 1, 'Classic', 4, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (5).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (4).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (9).jpg\"]', 0),
(10, 'Urban Szoba', 'Szimpla, egyszerű', 16500, 0, 'Dupla', 2, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (13).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (6).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (2).jpg\"]', 0),
(11, 'AAS', 'asdsdfasd', 1000, 0, 'szex dungeon', 13, '[\"http://localhost:6969/public/admin felÃ¼let main 2026.02.26.png\"]', 1);

-- --------------------------------------------------------

--
-- Table structure for table `room_review`
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
--   `room_id`
--       `room` -> `id`
--   `user_id`
--       `users` -> `id`
--

--
-- Dumping data for table `room_review`
--

INSERT INTO `room_review` (`id`, `stars`, `comment`, `room_id`, `user_id`) VALUES
(7, 3, 'nem tudom', 5, 1),
(8, 3, 'chat is this real?', 5, 1),
(9, 4, 'chat this IS real', 5, 1),
(10, 5, '10/10', 6, 1),
(11, 5, 'Nagyon jó', 6, 1),
(12, 4, 'Hiányzik a feleségem', 6, 1),
(13, 1, 'Ez nem így néz ki', 8, 1),
(14, 2, 'Éces lettem ', 8, 1),
(15, 1, 'Nem adták vissza a pénzem', 8, 1),
(16, 4, 'Megfelelelt', 10, 1),
(17, 4, 'Már NAGYON hiányzik a feleségem', 10, 1),
(18, 5, 'Le a kalappal', 10, 1),
(19, 5, 'Ez nagyon 67', 5, 3),
(20, 1, 'dnolgksdre\n', 5, 3),
(21, 1, 'dssdfsdfsdf', 5, 3),
(22, 1, 'dfgdffgdfgdfg', 5, 3),
(23, 3, 'sdfsdf', 5, 3),
(24, 4, 'sdfsdfsdf', 5, 3),
(25, 5, 'sdfsdfdsfdsfsd', 5, 3),
(26, 5, 'asdasdasd', 5, 3);

-- --------------------------------------------------------

--
-- Table structure for table `users`
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
(1, 'Csurgai Christopher', '$2b$10$jCMGE1BhtHuTOsThzDaUvuzpC45k.FkWCuQclvvtsUW4KjtAV.Wae', '0630685356', '2000-01-11', 'asadada', '111111', 'asd@asd.com', 1, 0),
(2, 'Csurgai Christopher', '$2b$10$salDUsp025YPgidFsqATourgMOcTEeXBMZhzba9OIzx0iSd7BIxn.', '2222', '2000-02-02', 'asasasas', '2222', 'aaa@gmail.com', 0, 1),
(3, 'asd', '$2b$10$oYk2IbsiKcX/d4STgFMaM.C/mTqL4yZ4FPark4Ejl8xTC9zI6INEO', '123123123123123', '2000-08-06', '123123', '123123123123', 'asd2@asd.hu', 0, 1),
(4, 'injection test', '$2b$10$xo/RMKoxlxfO6Ln7g.CcOO2rkWQo48eDXC1unx0GGea2srsl9Q/Hu', '42424242424', '2000-12-03', 'sdsdsdsd', '333', 'bbb@gmail.com', 0, 1),
(5, 'csugribugri', '$2b$10$gTwgTXF7BbzIGtW6eLONRuIafykGbtTCkV8BKu1soH66moVyR091y', '3333', '2222-02-02', 'aaa', '33333', 'bbbb@gmail.com', 0, 1),
(6, 'aaaa', '$2b$10$g4ttpdNDThkyvbJlL1g1ru8Cs7gL.677g9Yr0qaySKC3ebH9Jyl4i', '33333', '2026-04-22', 'aaaaa', '33333', 'af@afgmail.com', 0, 1),
(7, 'aaa', '$2b$10$snwJZGGMwOdWbu0H0zStOevnuEz6JJLawYrfe7zyFSKlEPZBVhAjW', '11111111111111111111', '1910-10-31', 'aaa', '22222222222222222222222222222222222222222', 'aaa@aaa.hu', 0, 1),
(8, 'Nagy Antal', '$2b$10$8pwyyMziSC/83dpFFMmxqOfxekXSWosHeVEXmmTjKaIdWZmUPFgOq', '+36111111111', '2000-10-20', '6600 Szentes, Szilfa u. 1.', '123456SS', 'aaaaa@aaaaa.hu', 0, 1),
(11, 'Casita Admin', '$2b$10$mDp/tbQm7HXLnSYavU51HeNuNkSTCORbkCk0DxUhk51ovz00K6weC', '+36301234567', '1998-10-20', '6600 Szentes, asd u. 20', '123456SS', 'casitagabriela.mailer@gmail.com', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
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
('0a5b49c1-302b-4f1b-afd8-fcd1a96c2682', 'd693b87d9865c29d4415a36d1eb204c5706d7846a6bd65536a7389589290ff5b', '2026-04-16 09:34:38.160', '20260416093438_add_review_user', NULL, NULL, '2026-04-16 09:34:38.086', 1),
('1641a948-bc09-4b76-a2c6-0be890b1ca81', '2f3bdc09d0cedf5290d10c537d8450ba77a327be23841d18731abec0e3c3293b', '2026-04-16 08:29:48.250', '20260416082948_add_is_first_time_user', NULL, NULL, '2026-04-16 08:29:48.142', 1),
('54ee50c5-6b1c-4787-b101-64f0b94461bc', '61bcfe99b2bec10d4a5037375a67c5f4f0ba7c7a9c4c9c9f2b05c901e6676dd1', '2026-04-16 08:29:14.990', '20260220093733', NULL, NULL, '2026-04-16 08:29:14.743', 1);

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
-- Indexes for table `form`
--
ALTER TABLE `form`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT for table `form`
--
ALTER TABLE `form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `room_review`
--
ALTER TABLE `room_review`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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

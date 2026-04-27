-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 22. 09:39
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `casita_gabriela`
--
CREATE DATABASE IF NOT EXISTS `casita_gabriela` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `casita_gabriela`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `booking`
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

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `category`
--

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `image` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `category`
--

INSERT INTO `category` (`id`, `name`, `image`) VALUES
(1, 'Classic', 'http://localhost:6969/public/letÃ¶ltÃ©s (3).jpg'),
(2, 'Dupla', 'http://localhost:6969/public/letÃ¶ltÃ©s (2).jpg');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `form`
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

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room`
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
-- A tábla adatainak kiíratása `room`
--

INSERT INTO `room` (`id`, `name`, `description`, `price`, `ac_availablity`, `category`, `space`, `images`, `isHighlighted`) VALUES
(1, 'Holdfény lakosztály', 'Szép', 8500, 0, 'Classic', 2, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (12).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (13).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s.jpg\"]', 1),
(2, 'Parázs szikra', 'Forró és jó', 12300, 0, 'Dupla', 4, '[\"http://localhost:6969/public/letÃ¶ltÃ©s (5).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (10).jpg\",\"http://localhost:6969/public/letÃ¶ltÃ©s (9).jpg\"]', 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room_review`
--

DROP TABLE IF EXISTS `room_review`;
CREATE TABLE `room_review` (
  `id` int(11) NOT NULL,
  `stars` int(11) NOT NULL,
  `comment` varchar(200) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
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
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `name`, `password`, `phone_number`, `birth_date`, `address`, `identity_card`, `email`, `isAdmin`, `isFirstTimeUser`) VALUES
(1, 'Csurgai Christopher', '$2b$10$5FasIkniuk8fIk8kCHVMvOY/uQkacRrDnNBCF6Dns7a6luPDf3bV.', '+36222222222', '2026-04-18', 'Mariska u4', '777777uu', 'csurgaichristopher@gmail.com', 1, 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `_prisma_migrations`
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
-- A tábla adatainak kiíratása `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('13a3a49b-fdc2-4d11-aba3-75396c832b7e', 'd693b87d9865c29d4415a36d1eb204c5706d7846a6bd65536a7389589290ff5b', '2026-04-22 06:59:52.684', '20260416093438_add_review_user', NULL, NULL, '2026-04-22 06:59:52.611', 1),
('4ef6f47a-9829-4531-85c6-3a8341544507', '61bcfe99b2bec10d4a5037375a67c5f4f0ba7c7a9c4c9c9f2b05c901e6676dd1', '2026-04-22 06:59:52.505', '20260220093733', NULL, NULL, '2026-04-22 06:59:52.235', 1),
('65c86b26-6e5b-429c-9d0b-ead13064a7bf', '2f3bdc09d0cedf5290d10c537d8450ba77a327be23841d18731abec0e3c3293b', '2026-04-22 06:59:52.609', '20260416082948_add_is_first_time_user', NULL, NULL, '2026-04-22 06:59:52.509', 1),
('a4bd0d3e-4bf0-4dfc-9657-3a7ee5f60d61', '13eb2e0897a75f22bf98c547e12823cbae12de6eea813c78e757130f3ac8a31d', '2026-04-22 07:00:02.016', '20260422070001_add_category_table', NULL, NULL, '2026-04-22 07:00:01.968', 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_name_key` (`name`);

--
-- A tábla indexei `form`
--
ALTER TABLE `form`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `room_review`
--
ALTER TABLE `room_review`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`room_id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`);

--
-- A tábla indexei `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `form`
--
ALTER TABLE `form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `room`
--
ALTER TABLE `room`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `room_review`
--
ALTER TABLE `room_review`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`);

--
-- Megkötések a táblához `room_review`
--
ALTER TABLE `room_review`
  ADD CONSTRAINT `room_review_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`),
  ADD CONSTRAINT `room_review_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

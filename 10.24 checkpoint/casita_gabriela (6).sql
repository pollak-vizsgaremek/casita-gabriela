-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Dec 18. 10:34
-- Kiszolgáló verziója: 10.4.28-MariaDB
-- PHP verzió: 8.2.4

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
CREATE DATABASE IF NOT EXISTS `casita_gabriela` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `casita_gabriela`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `booking`
--

DROP TABLE IF EXISTS `booking`;
CREATE TABLE `booking` (
  `id` int(5) NOT NULL,
  `arrival_date` date NOT NULL,
  `departure_date` date NOT NULL,
  `people` int(2) NOT NULL,
  `booking_date` date NOT NULL,
  `status` varchar(50) NOT NULL,
  `user_id` int(5) NOT NULL,
  `room_id` int(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- TÁBLA KAPCSOLATAI `booking`:
--   `user_id`
--       `users` -> `id`
--   `room_id`
--       `room` -> `id`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `form`
--

DROP TABLE IF EXISTS `form`;
CREATE TABLE `form` (
  `id` int(5) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `topic` varchar(50) NOT NULL,
  `description` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- TÁBLA KAPCSOLATAI `form`:
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room`
--

DROP TABLE IF EXISTS `room`;
CREATE TABLE `room` (
  `id` int(5) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(1000) NOT NULL,
  `price` int(7) NOT NULL,
  `ac_availablity` int(1) NOT NULL,
  `category` varchar(20) NOT NULL,
  `space` int(2) NOT NULL,
  `images` mediumblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- TÁBLA KAPCSOLATAI `room`:
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `room_review`
--

DROP TABLE IF EXISTS `room_review`;
CREATE TABLE `room_review` (
  `id` int(5) NOT NULL,
  `stars` int(1) NOT NULL,
  `comment` varchar(200) NOT NULL,
  `room_id` int(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- TÁBLA KAPCSOLATAI `room_review`:
--   `room_id`
--       `room` -> `id`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(5) NOT NULL,
  `name` text NOT NULL,
  `password` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `birth_date` date NOT NULL,
  `address` varchar(50) NOT NULL,
  `identity_card` varchar(50) NOT NULL,
  `email` varchar(30) NOT NULL,
  `isAdmin` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- TÁBLA KAPCSOLATAI `users`:
--

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `name`, `password`, `phone_number`, `birth_date`, `address`, `identity_card`, `email`, `isAdmin`) VALUES
(1, 'bedi', '$2b$10$6f/f/G4mVrszQPs9iOJnXeYj8gfz.tDdN0IT/pUO6HtLsfoDXU.Lq', '123456789', '2100-02-01', 'asd u. 20', 'CIG', 'bedi@bedi.com', 0),
(2, 'Daddy', '$2b$10$oH.cK7WaIQy8IZ8xhxBdqu64P09e3JiWyG7ez54YxEim0QwYZ/Rhq', '+36301234567', '1912-04-15', 'North Atlantic Ocean at roughly 41°43\'N, 49°56\'W', 'FASZOM', 'lofasz@gmail.com', 0),
(3, 'asd', '$2b$10$xFv1vWYBTlwEO/yjbJZOXuE1NJlTj73Wn1Nkv4NqSaOutwKOX7.R2', '123456789', '1912-04-15', 'asd u. asd', 'ASD', 'asd@asd.com', 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

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
  ADD KEY `booking_id` (`room_id`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `form`
--
ALTER TABLE `form`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `room`
--
ALTER TABLE `room`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `room_review`
--
ALTER TABLE `room_review`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  ADD CONSTRAINT `room_review_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`id`);


--
-- Metaadat
--
USE `phpmyadmin`;

--
-- A(z) booking tábla metaadatai
--

--
-- A(z) form tábla metaadatai
--

--
-- A(z) room tábla metaadatai
--

--
-- A(z) room_review tábla metaadatai
--

--
-- A(z) users tábla metaadatai
--

--
-- A(z) casita_gabriela adatbázis metaadatai
--
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

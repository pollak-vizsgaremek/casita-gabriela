-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 14. 12:11
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
  `booking_date` datetime NOT NULL,
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

--
-- A tábla adatainak kiíratása `booking`
--

INSERT INTO `booking` (`id`, `arrival_date`, `departure_date`, `people`, `booking_date`, `status`, `user_id`, `room_id`) VALUES
(17, '2026-04-09', '2026-04-12', 5, '2026-04-09 00:00:00', 'approved', 3, 19),
(18, '2026-04-15', '2026-04-22', 4, '2026-04-09 10:19:17', 'approved', 3, 19),
(19, '2026-04-22', '2026-04-23', 4, '2026-04-09 10:27:17', 'rejected', 3, 19),
(20, '2026-04-28', '2026-04-30', 3, '2026-04-09 10:31:38', 'rejected', 3, 19),
(21, '2026-04-24', '2026-04-25', 2, '2026-04-09 10:34:56', 'rejected', 3, 19),
(22, '2026-04-25', '2026-04-26', 4, '2026-04-09 12:46:43', 'rejected', 3, 19),
(23, '2026-04-12', '2026-04-15', 1, '2026-04-09 13:14:01', 'rejected', 3, 19),
(24, '2026-04-26', '2026-04-28', 6, '2026-04-09 13:18:33', 'approved', 3, 19),
(25, '2026-04-23', '2026-04-24', 4, '2026-04-09 16:40:23', 'rejected', 3, 19),
(26, '2026-04-30', '2026-05-01', 1, '2026-04-09 16:43:13', 'approved', 3, 19);

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

--
-- A tábla adatainak kiíratása `form`
--

INSERT INTO `form` (`id`, `name`, `email`, `phone_number`, `topic`, `description`) VALUES
(1, 'asd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(2, 'asd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(3, 'asd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(4, 'asd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(5, 'asd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(6, 'asd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(7, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(8, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(9, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(10, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(11, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(12, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(13, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(14, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(15, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(16, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(17, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(18, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(19, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(20, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(21, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi'),
(22, 'asdasd', 'bede.arpad.arany@gmail.com', '+36306282956', 'MIÉRT VAGY BUZI', 'szeretem a faszt meg téged is meg a te faszodat is szeretem meg a pinát is imádom, de azt még jobban. ttetszel te gádzsi');

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
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `isHighlighted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- TÁBLA KAPCSOLATAI `room`:
--

--
-- A tábla adatainak kiíratása `room`
--

INSERT INTO `room` (`id`, `name`, `description`, `price`, `ac_availablity`, `category`, `space`, `images`, `isHighlighted`) VALUES
(19, 'alma', 'asdasdad', 15000, 0, 'Luxury', 6, '[\"http://localhost:6969/public/szoba_001.jpg\",\"http://localhost:6969/public/peldaRoom1.jpg\",\"http://localhost:6969/public/peldaRoom2.jpg\",\"http://localhost:6969/public/peldaRoom3.jpg\"]', 1),
(20, 'aoa', 'adasd', 20000, 0, 'asda', 10, '[\"http://localhost:6969/public/admin felÃ¼let 2026.02.26.png\",\"http://localhost:6969/public/admin felÃ¼let main 2026.02.26.png\"]', 0);

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
(3, 'asd', '$2b$10$xFv1vWYBTlwEO/yjbJZOXuE1NJlTj73Wn1Nkv4NqSaOutwKOX7.R2', '123456789', '1912-04-15', 'asd u. asd', 'ASD', 'asd@asd.com', 1),
(4, 'fasz', '$2b$10$wTCSjGx2wvKbQ0Bkt0SKo.NrMqEJKpMTljR5VwJlYbCFWMfyitBxy', '06301234567', '2003-02-06', 'fasz utca 1', 'FASZFASZ', 'fasz@fasz.com', 0),
(6, 'bedi', '$2b$10$SHjSf9HCAh6oawMj0u/.8eEtOmjS5cKnDpBQU0OURArnBrDNR8kGS', '320664595', '2001-10-20', 'asdasd', 'pajdjpiajd', 'bedi1@bedi1.com', 0);

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
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT a táblához `form`
--
ALTER TABLE `form`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT a táblához `room`
--
ALTER TABLE `room`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT a táblához `room_review`
--
ALTER TABLE `room_review`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- A tábla adatainak kiíratása `pma__table_uiprefs`
--

INSERT INTO `pma__table_uiprefs` (`username`, `db_name`, `table_name`, `prefs`, `last_update`) VALUES
('root', 'casita_gabriela', 'room', '{\"sorted_col\":\"`room`.`isHighlighted` ASC\"}', '2026-04-14 09:54:11');

--
-- A(z) room_review tábla metaadatai
--

--
-- A(z) users tábla metaadatai
--

--
-- A tábla adatainak kiíratása `pma__table_uiprefs`
--

INSERT INTO `pma__table_uiprefs` (`username`, `db_name`, `table_name`, `prefs`, `last_update`) VALUES
('root', 'casita_gabriela', 'users', '{\"sorted_col\":\"`users`.`identity_card` ASC\"}', '2026-03-06 10:25:41');

--
-- A(z) casita_gabriela adatbázis metaadatai
--
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

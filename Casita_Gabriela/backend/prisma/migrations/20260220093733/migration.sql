-- CreateTable
CREATE TABLE `booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `arrival_date` DATE NOT NULL,
    `departure_date` DATE NOT NULL,
    `people` INTEGER NOT NULL,
    `booking_date` DATE NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,

    INDEX `room_id`(`room_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `topic` VARCHAR(50) NOT NULL,
    `description` VARCHAR(1000) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,
    `description` VARCHAR(1000) NOT NULL,
    `price` INTEGER NOT NULL,
    `ac_availablity` INTEGER NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `space` INTEGER NOT NULL,
    `images` MEDIUMBLOB NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stars` INTEGER NOT NULL,
    `comment` VARCHAR(200) NOT NULL,
    `room_id` INTEGER NOT NULL,

    INDEX `booking_id`(`room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `birth_date` DATE NOT NULL,
    `address` VARCHAR(50) NOT NULL,
    `identity_card` VARCHAR(50) NOT NULL,
    `email` VARCHAR(30) NOT NULL,
    `isAdmin` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `unique_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `booking` ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `booking` ADD CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `room`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `room_review` ADD CONSTRAINT `room_review_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

/*
  Warnings:

  - You are about to alter the column `images` on the `room` table. The data in that column could be lost. The data in that column will be cast from `MediumBlob` to `LongText`.

*/
-- AlterTable
ALTER TABLE `booking` MODIFY `booking_date` DATETIME(0) NOT NULL;

-- AlterTable
ALTER TABLE `room` ADD COLUMN `isHighlighted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `images` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isFirstTimeUser` BOOLEAN NULL DEFAULT true;

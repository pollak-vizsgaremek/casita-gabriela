-- AlterTable
ALTER TABLE `room_review` ADD COLUMN `user_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `user_id` ON `room_review`(`user_id`);

-- AddForeignKey
ALTER TABLE `room_review` ADD CONSTRAINT `room_review_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

CREATE TABLE `todo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`completed` integer DEFAULT false NOT NULL,
	`due_date` integer DEFAULT '"2026-02-14T16:19:27.873Z"'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `todo_id_unique` ON `todo` (`id`);
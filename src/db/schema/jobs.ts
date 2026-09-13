import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const jobStatus = pgEnum("job_status", [
  "pending",
  "processing",
  "review_ready",
  "failed",
  "done",
]);

export const job = pgTable(
  "job",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: jobStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastError: text("last_error"),
    originalFilename: text("original_filename").notNull(),
    storagePath: text("storage_path").notNull(),
    byteSize: integer("byte_size").notNull(),
    mimeType: text("mime_type"),
    checksum: text("checksum").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (table) => [
    index("job_status_idx").on(table.status),
    index("job_created_at_idx").on(table.createdAt),
  ],
);

export const jobRelations = relations(job, ({ one }) => ({
  user: one(user, {
    fields: [job.userId],
    references: [user.id],
  }),
}));
